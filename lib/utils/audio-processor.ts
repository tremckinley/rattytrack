// Audio processing utilities for handling large files
// Compresses and chunks audio to fit OpenAI's 25MB limit

import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB in bytes
const CHUNK_DURATION_SECONDS = 600; // 10 minutes per chunk

export interface AudioChunk {
  path: string;
  index: number;
  startTime: number; // in seconds
  endTime: number; // in seconds
}

/**
 * Compress audio file to reduce size
 * Returns path to compressed file
 */
export async function compressAudio(inputPath: string): Promise<string> {
  const outputPath = inputPath.replace('.mp3', '_compressed.mp3');
  
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioBitrate('64k') // Lower bitrate for smaller file size
      .audioCodec('libmp3lame')
      .audioChannels(1) // Mono audio
      .audioFrequency(16000) // 16kHz (Whisper's preferred sample rate)
      .on('end', () => {
        console.log(`Compressed audio saved to: ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('Error compressing audio:', err);
        reject(err);
      })
      .save(outputPath);
  });
}

/**
 * Split audio file into chunks if it exceeds max size
 * Returns array of chunk file paths with timing information
 */
export async function chunkAudio(inputPath: string, durationSeconds: number): Promise<AudioChunk[]> {
  const fileSize = fs.statSync(inputPath).size;
  
  // If file is under limit, return single chunk
  if (fileSize < MAX_FILE_SIZE) {
    return [{
      path: inputPath,
      index: 0,
      startTime: 0,
      endTime: durationSeconds,
    }];
  }
  
  // Calculate number of chunks needed
  const numChunks = Math.ceil(durationSeconds / CHUNK_DURATION_SECONDS);
  const chunks: AudioChunk[] = [];
  const dir = path.dirname(inputPath);
  const basename = path.basename(inputPath, path.extname(inputPath));
  
  for (let i = 0; i < numChunks; i++) {
    const startTime = i * CHUNK_DURATION_SECONDS;
    const endTime = Math.min((i + 1) * CHUNK_DURATION_SECONDS, durationSeconds);
    const outputPath = path.join(dir, `${basename}_chunk_${i}.mp3`);
    
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .setStartTime(startTime)
        .setDuration(endTime - startTime)
        .audioBitrate('64k')
        .audioCodec('libmp3lame')
        .audioChannels(1)
        .audioFrequency(16000)
        .on('end', () => {
          console.log(`Created chunk ${i}: ${outputPath}`);
          resolve();
        })
        .on('error', (err) => {
          console.error(`Error creating chunk ${i}:`, err);
          reject(err);
        })
        .save(outputPath);
    });
    
    chunks.push({
      path: outputPath,
      index: i,
      startTime,
      endTime,
    });
  }
  
  return chunks;
}

/**
 * Process audio file: compress and chunk if necessary
 * Returns array of processable audio chunks
 */
export async function processAudioForTranscription(
  inputPath: string,
  durationSeconds: number
): Promise<AudioChunk[]> {
  console.log('Processing audio for transcription...');
  
  // Step 1: Compress the audio
  const compressedPath = await compressAudio(inputPath);
  
  // Step 2: Check if we need to chunk
  const chunks = await chunkAudio(compressedPath, durationSeconds);
  
  console.log(`Audio processed into ${chunks.length} chunk(s)`);
  return chunks;
}

/**
 * Clean up all chunk files
 */
export function cleanupChunks(chunks: AudioChunk[]): void {
  chunks.forEach(chunk => {
    try {
      if (fs.existsSync(chunk.path)) {
        fs.unlinkSync(chunk.path);
        console.log(`Cleaned up chunk: ${chunk.path}`);
      }
    } catch (error) {
      console.error('Error cleaning up chunk:', error);
    }
  });
}
