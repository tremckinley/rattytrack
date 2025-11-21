import fs from 'fs';

interface TranscribeOptions {
  filePath: string;
  language?: string;
  numSpeakers?: number | null;
  diarizationThreshold?: number;
}

interface ElevenLabsWord {
  word: string;
  start: number;
  end: number;
  speaker?: string;
}

interface ElevenLabsResponse {
  text: string;
  language: string;
  words?: ElevenLabsWord[];
}

interface TranscribeResult {
  text: string;
  segments: Array<{
    start: number;
    end: number;
    text: string;
    speaker?: string;
  }>;
  duration: number;
  cost: number;
}

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/speech-to-text';
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

function calculateCost(durationSeconds: number): number {
  const minutes = durationSeconds / 60;
  return minutes * 0.006;
}

function groupWordsIntoSegments(words: ElevenLabsWord[]): Array<{
  start: number;
  end: number;
  text: string;
  speaker?: string;
}> {
  if (words.length === 0) return [];

  const segments: Array<{ start: number; end: number; text: string; speaker?: string }> = [];
  let currentSegment: ElevenLabsWord[] = [words[0]];
  let currentSpeaker = words[0].speaker;

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const prevWord = words[i - 1];
    
    const speakerChanged = word.speaker !== currentSpeaker;
    const longPause = word.start - prevWord.end > 1.5;

    if (speakerChanged || longPause || currentSegment.length >= 20) {
      segments.push({
        start: currentSegment[0].start,
        end: currentSegment[currentSegment.length - 1].end,
        text: currentSegment.map(w => w.word).join(' '),
        speaker: currentSpeaker,
      });
      currentSegment = [word];
      currentSpeaker = word.speaker;
    } else {
      currentSegment.push(word);
    }
  }

  if (currentSegment.length > 0) {
    segments.push({
      start: currentSegment[0].start,
      end: currentSegment[currentSegment.length - 1].end,
      text: currentSegment.map(w => w.word).join(' '),
      speaker: currentSpeaker,
    });
  }

  return segments;
}

export async function transcribeAudio(options: TranscribeOptions): Promise<TranscribeResult> {
  const { filePath, language = 'en', numSpeakers = null, diarizationThreshold = 0.22 } = options;

  if (!ELEVENLABS_API_KEY) {
    throw new Error('ELEVENLABS_API_KEY is not configured');
  }

  console.log(`Transcribing ${filePath} with Eleven Labs...`);

  try {
    const fileBuffer = fs.readFileSync(filePath);
    const fileBlob = new Blob([fileBuffer], { type: 'audio/mpeg' });
    
    const formData = new FormData();
    formData.append('file', fileBlob, 'audio.mp3');
    formData.append('model_id', 'scribe_v1');
    formData.append('language_code', language);
    formData.append('diarize', 'true');
    
    if (numSpeakers !== null) {
      formData.append('num_speakers', numSpeakers.toString());
    }
    
    if (numSpeakers === null && diarizationThreshold) {
      formData.append('diarization_threshold', diarizationThreshold.toString());
    }

    const response = await fetch(ELEVENLABS_API_URL, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Eleven Labs API error (${response.status}): ${errorText}`);
    }

    const result: ElevenLabsResponse = await response.json();
    
    console.log(`ElevenLabs response:`, {
      hasWords: !!result.words,
      wordCount: result.words?.length || 0,
      hasText: !!result.text,
      textLength: result.text?.length || 0,
      firstWords: result.words?.slice(0, 3),
    });

    const segments = result.words && result.words.length > 0
      ? groupWordsIntoSegments(result.words)
      : [{
          start: 0,
          end: 0,
          text: result.text,
          speaker: undefined,
        }];

    const duration = segments.length > 0 
      ? segments[segments.length - 1].end 
      : 0;

    const cost = calculateCost(duration);

    const uniqueSpeakers = new Set(segments.map((s) => s.speaker).filter(Boolean));

    console.log(
      `Transcription completed: ${segments.length} segments, ` +
      `${duration.toFixed(1)}s, $${cost.toFixed(4)}, ` +
      `speakers: ${uniqueSpeakers.size}`
    );

    return {
      text: result.text,
      segments,
      duration,
      cost,
    };
  } catch (error) {
    console.error('Error transcribing audio with Eleven Labs:', error);
    throw error;
  }
}

export async function transcribeAudioChunks(
  chunkPaths: string[],
  options?: { language?: string; numSpeakers?: number | null; diarizationThreshold?: number }
): Promise<TranscribeResult> {
  console.log(`Transcribing ${chunkPaths.length} audio chunks with Eleven Labs...`);

  const allSegments: Array<{ start: number; end: number; text: string; speaker?: string }> = [];
  let totalDuration = 0;
  let totalCost = 0;
  let fullText = '';

  for (let i = 0; i < chunkPaths.length; i++) {
    const chunkPath = chunkPaths[i];
    console.log(`Processing chunk ${i + 1}/${chunkPaths.length}...`);

    const result = await transcribeAudio({
      filePath: chunkPath,
      language: options?.language,
      numSpeakers: options?.numSpeakers,
      diarizationThreshold: options?.diarizationThreshold,
    });

    const timeOffset = totalDuration;
    const adjustedSegments = result.segments.map(seg => ({
      start: seg.start + timeOffset,
      end: seg.end + timeOffset,
      text: seg.text,
      speaker: seg.speaker,
    }));

    allSegments.push(...adjustedSegments);
    totalDuration += result.duration;
    totalCost += result.cost;
    fullText += (fullText ? ' ' : '') + result.text;

    if (i < chunkPaths.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(
    `All chunks transcribed: ${allSegments.length} total segments, ` +
    `$${totalCost.toFixed(4)} total cost`
  );

  return {
    text: fullText,
    segments: allSegments,
    duration: totalDuration,
    cost: totalCost,
  };
}

export async function transcribeWithAutoChunking(
  filePaths: string[],
  options?: { language?: string; numSpeakers?: number | null; diarizationThreshold?: number }
): Promise<TranscribeResult> {
  if (filePaths.length === 1) {
    return transcribeAudio({
      filePath: filePaths[0],
      language: options?.language,
      numSpeakers: options?.numSpeakers,
      diarizationThreshold: options?.diarizationThreshold,
    });
  } else {
    return transcribeAudioChunks(filePaths, options);
  }
}
