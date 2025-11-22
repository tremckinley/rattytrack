import fs from 'fs';

interface TranscribeOptions {
  filePath: string;
  language?: string;
  numSpeakers?: number | null;
  diarizationThreshold?: number;
}

interface ElevenLabsWord {
  text: string;
  start: number;
  end: number;
  type: 'word' | 'spacing';
  speaker_id: string;
  logprob: number;
}

interface ElevenLabsResponse {
  language_code: string;
  text: string;
  words: ElevenLabsWord[];
  transcription_id?: string;
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

function convertElevenLabsSegments(words: ElevenLabsWord[]): Array<{
  start: number;
  end: number;
  text: string;
  speaker?: string;
}> {
  // Filter out spacing segments and group words into sentences
  const wordSegments = words.filter(w => w.type === 'word');
  
  if (wordSegments.length === 0) {
    return [];
  }

  const sentences: Array<{
    start: number;
    end: number;
    text: string;
    speaker?: string;
  }> = [];

  let currentSentence: ElevenLabsWord[] = [];
  let currentSpeaker: string | null = null;

  const flushSentence = () => {
    if (currentSentence.length > 0) {
      sentences.push({
        start: currentSentence[0].start,
        end: currentSentence[currentSentence.length - 1].end,
        text: currentSentence.map(w => w.text).join(' '),
        speaker: currentSpeaker || undefined,
      });
      currentSentence = [];
    }
  };

  for (let i = 0; i < wordSegments.length; i++) {
    const word = wordSegments[i];
    const nextWord = wordSegments[i + 1];

    // Check if we need to start a new sentence due to speaker change
    const speakerChange = currentSpeaker !== null && word.speaker_id !== currentSpeaker;
    
    if (speakerChange) {
      flushSentence();
      currentSpeaker = word.speaker_id;
    } else if (currentSpeaker === null) {
      currentSpeaker = word.speaker_id;
    }

    // Add word to current sentence
    currentSentence.push(word);

    // Check for sentence boundaries
    const sentenceEnd = word.text.match(/[.!?]$/);
    const longPause = nextWord && (nextWord.start - word.end > 1.0); // 1+ second pause
    const isLastWord = !nextWord;

    // Flush on sentence boundaries
    if (sentenceEnd || longPause || isLastWord) {
      flushSentence();
      currentSpeaker = null;
    }
  }

  return sentences;
}

export async function transcribeAudio(options: TranscribeOptions): Promise<TranscribeResult> {
  const { filePath, language = 'en', numSpeakers = null, diarizationThreshold = 0.22 } = options;

  if (!ELEVENLABS_API_KEY) {
    throw new Error('ELEVENLABS_API_KEY is not configured');
  }

  console.log(`Transcribing ${filePath} with Eleven Labs to ${ELEVENLABS_API_URL}...`);

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

    console.log(`Making request to ${ELEVENLABS_API_URL} with model_id=${formData.get('model_id')}, diarize=${formData.get('diarize')}`);

    const response = await fetch(ELEVENLABS_API_URL, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: formData,
    });
    
    console.log(`ElevenLabs response status: ${response.status} ${response.statusText}`);

    // Save raw response to file for debugging
    const responseText = await response.text();
    const debugFilePath = '/tmp/elevenlabs-response-debug.json';
    fs.writeFileSync(debugFilePath, JSON.stringify({
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseText
    }, null, 2));
    console.log(`Saved ElevenLabs response to ${debugFilePath}`);

    if (!response.ok) {
      throw new Error(`Eleven Labs API error (${response.status}): ${responseText}`);
    }

    const result: ElevenLabsResponse = JSON.parse(responseText);
    
    console.log(`ElevenLabs response: ${result.words?.length || 0} words, language: ${result.language_code}`);

    const segments = convertElevenLabsSegments(result.words || []);

    const duration = segments.length > 0 
      ? segments[segments.length - 1].end 
      : 0;

    const cost = calculateCost(duration);

    const uniqueSpeakers = new Set(segments.map((s) => s.speaker).filter(Boolean));
    const fullText = segments.map(s => s.text).join(' ');

    console.log(
      `Transcription completed: ${segments.length} segments, ` +
      `${duration.toFixed(1)}s, $${cost.toFixed(4)}, ` +
      `speakers: ${uniqueSpeakers.size}`
    );

    return {
      text: fullText,
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
