// Audio processing utilities using FFmpeg
// Converts WebM to MP3 and handles chunking for large files

import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';

interface ConversionOptions {
  inputPath: string;
  outputPath: string;
  frequency?: number; // Default: 16000 (16kHz)
  channels?: number; // Default: 1 (mono)
  bitrate?: string; // Default: '64k'
}

interface ChunkOptions {
  inputPath: string;
  outputDir: string;
  chunkDuration: number; // Duration in seconds (e.g., 600 for 10 minutes)
}

/**
 * Convert WebM to MP3 with optimal settings for Whisper API
 */
export async function convertToMP3(options: ConversionOptions): Promise<string> {
  const {
    inputPath,
    outputPath,
    frequency = 16000,
    channels = 1,
    bitrate = '64k',
  } = options;

  return new Promise((resolve, reject) => {
    console.log(`Converting ${inputPath} to MP3...`);

    ffmpeg(inputPath)
      .audioFrequency(frequency)
      .audioChannels(channels)
      .audioBitrate(bitrate)
      .toFormat('mp3')
      .on('start', (commandLine) => {
        console.log('FFmpeg command:', commandLine);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          console.log(`Conversion progress: ${Math.round(progress.percent)}%`);
        }
      })
      .on('end', () => {
        console.log('Conversion completed');
        resolve(outputPath);
      })
      .on('error', (error) => {
        console.error('Conversion error:', error);
        reject(error);
      })
      .save(outputPath);
  });
}

/**
 * Split audio file into chunks (for files exceeding OpenAI's 25MB limit)
 */
export async function splitAudioIntoChunks(options: ChunkOptions): Promise<string[]> {
  const { inputPath, outputDir, chunkDuration } = options;

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Get audio duration
  const duration = await getAudioDuration(inputPath);
  const numChunks = Math.ceil(duration / chunkDuration);

  console.log(`Splitting audio into ${numChunks} chunks of ${chunkDuration} seconds each`);

  const chunkPaths: string[] = [];

  for (let i = 0; i < numChunks; i++) {
    const startTime = i * chunkDuration;
    const outputPath = path.join(outputDir, `chunk_${i.toString().padStart(3, '0')}.mp3`);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .setStartTime(startTime)
        .setDuration(chunkDuration)
        .audioFrequency(16000)
        .audioChannels(1)
        .audioBitrate('64k')
        .toFormat('mp3')
        .on('end', () => {
          console.log(`Chunk ${i + 1}/${numChunks} created`);
          chunkPaths.push(outputPath);
          resolve();
        })
        .on('error', (error) => {
          console.error(`Error creating chunk ${i}:`, error);
          reject(error);
        })
        .save(outputPath);
    });
  }

  return chunkPaths;
}

/**
 * Get audio file duration in seconds
 */
export async function getAudioDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (error, metadata) => {
      if (error) {
        reject(error);
      } else {
        resolve(metadata.format.duration || 0);
      }
    });
  });
}

/**
 * Get audio file size in bytes
 */
export function getFileSize(filePath: string): number {
  const stats = fs.statSync(filePath);
  return stats.size;
}

/**
 * Check if file exceeds OpenAI's 25MB limit
 */
export function exceedsFileSizeLimit(filePath: string, limitMB: number = 25): boolean {
  const sizeMB = getFileSize(filePath) / (1024 * 1024);
  console.log(`File size: ${sizeMB.toFixed(2)} MB`);
  return sizeMB > limitMB;
}

/**
 * Process audio for Whisper API
 * Converts to MP3 and splits into chunks if necessary
 */
export async function processAudioForWhisper(
  webmPath: string,
  workDir: string
): Promise<{ chunks: string[]; needsCleanup: boolean }> {
  const mp3Path = path.join(workDir, 'audio.mp3');

  // Convert WebM to MP3
  await convertToMP3({
    inputPath: webmPath,
    outputPath: mp3Path,
  });

  // Check if we need to split into chunks
  if (exceedsFileSizeLimit(mp3Path, 25)) {
    console.log('File exceeds 25MB limit, splitting into chunks...');

    const chunksDir = path.join(workDir, 'chunks');
    const chunks = await splitAudioIntoChunks({
      inputPath: mp3Path,
      outputDir: chunksDir,
      chunkDuration: 600, // 10 minutes per chunk
    });

    // Delete the large MP3 file
    fs.unlinkSync(mp3Path);

    return { chunks, needsCleanup: true };
  }

  return { chunks: [mp3Path], needsCleanup: false };
}

/**
 * Clean up temporary audio files
 */
export function cleanupAudioFiles(paths: string[]): void {
  for (const filePath of paths) {
    try {
      if (fs.existsSync(filePath)) {
        if (fs.statSync(filePath).isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(filePath);
        }
        console.log(`Deleted: ${filePath}`);
      }
    } catch (error) {
      console.error(`Failed to delete ${filePath}:`, error);
    }
  }
}