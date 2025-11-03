// OpenAI Whisper API client for audio transcription

import OpenAI from 'openai';
import fs from 'fs';
import { WhisperResponse, WhisperSegment } from '../lib/types/youtube';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface TranscribeOptions {
  filePath: string;
  language?: string; // Default: auto-detect
  prompt?: string; // Optional context prompt
}

interface TranscribeResult {
  text: string;
  segments: Array<{ start: number; end: number; text: string }>;
  duration: number;
  cost: number; // Estimated cost in USD
}

/**
 * Calculate transcription cost
 * OpenAI Whisper pricing: $0.006 per minute
 */
function calculateCost(durationSeconds: number): number {
  const minutes = durationSeconds / 60;
  return minutes * 0.006;
}

/**
 * Transcribe audio file using OpenAI Whisper API
 */
export async function transcribeAudio(options: TranscribeOptions): Promise<TranscribeResult> {
  const { filePath, language, prompt } = options;

  console.log(`Transcribing ${filePath}...`);

  try {
    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: 'whisper-1',
      language: language || undefined,
      prompt: prompt || undefined,
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
    });

    const whisperResponse = response as unknown as WhisperResponse;

    // Extract segments with timestamps
    const segments = (whisperResponse.segments || []).map((seg: WhisperSegment) => ({
      start: seg.start,
      end: seg.end,
      text: seg.text,
    }));

    const duration = whisperResponse.duration || 0;
    const cost = calculateCost(duration);

    console.log(`Transcription completed: ${segments.length} segments, ${duration.toFixed(1)}s, $${cost.toFixed(4)}`);

    return {
      text: whisperResponse.text,
      segments,
      duration,
      cost,
    };
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
}

/**
 * Transcribe multiple audio chunks and merge results
 */
export async function transcribeAudioChunks(
  chunkPaths: string[],
  options?: { language?: string; prompt?: string }
): Promise<TranscribeResult> {
  console.log(`Transcribing ${chunkPaths.length} audio chunks...`);

  const allSegments: Array<{ start: number; end: number; text: string }> = [];
  let totalDuration = 0;
  let totalCost = 0;
  let fullText = '';

  for (let i = 0; i < chunkPaths.length; i++) {
    const chunkPath = chunkPaths[i];
    console.log(`Processing chunk ${i + 1}/${chunkPaths.length}...`);

    const result = await transcribeAudio({
      filePath: chunkPath,
      language: options?.language,
      prompt: options?.prompt,
    });

    // Adjust timestamps for chunks after the first
    const timeOffset = totalDuration;
    const adjustedSegments = result.segments.map(seg => ({
      start: seg.start + timeOffset,
      end: seg.end + timeOffset,
      text: seg.text,
    }));

    allSegments.push(...adjustedSegments);
    totalDuration += result.duration;
    totalCost += result.cost;
    fullText += (fullText ? ' ' : '') + result.text;

    // Add small delay between API calls to avoid rate limiting
    if (i < chunkPaths.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`All chunks transcribed: ${allSegments.length} total segments, $${totalCost.toFixed(4)} total cost`);

  return {
    text: fullText,
    segments: allSegments,
    duration: totalDuration,
    cost: totalCost,
  };
}

/**
 * Transcribe audio file(s) with automatic chunking detection
 */
export async function transcribeWithAutoChunking(
  filePaths: string[],
  options?: { language?: string; prompt?: string }
): Promise<TranscribeResult> {
  if (filePaths.length === 1) {
    return transcribeAudio({
      filePath: filePaths[0],
      language: options?.language,
      prompt: options?.prompt,
    });
  } else {
    return transcribeAudioChunks(filePaths, options);
  }
}