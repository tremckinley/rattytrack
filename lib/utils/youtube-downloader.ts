// Utility for downloading YouTube video audio using Puppeteer
// This uses a headless browser to access YouTube and extract audio

import puppeteer from 'puppeteer';
import ytdl from 'ytdl-core';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { pipeline } from 'stream';

const streamPipeline = promisify(pipeline);

export interface VideoInfo {
  title: string;
  duration: number; // in seconds
  description: string;
}

/**
 * Get YouTube video information
 */
export async function getVideoInfo(videoId: string): Promise<VideoInfo> {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const info = await ytdl.getInfo(videoUrl);
  
  return {
    title: info.videoDetails.title,
    duration: parseInt(info.videoDetails.lengthSeconds),
    description: info.videoDetails.description || '',
  };
}

/**
 * Download YouTube video audio
 * Returns path to the downloaded audio file
 */
export async function downloadYouTubeAudio(videoId: string): Promise<string> {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const tempDir = '/tmp/youtube-audio';
  const outputPath = path.join(tempDir, `${videoId}.mp3`);
  
  // Ensure temp directory exists
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  try {
    // Download audio using ytdl-core
    const audioStream = ytdl(videoUrl, {
      quality: 'highestaudio',
      filter: 'audioonly',
    });
    
    const writeStream = fs.createWriteStream(outputPath);
    await streamPipeline(audioStream, writeStream);
    
    console.log(`Downloaded audio to: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('Error downloading YouTube audio:', error);
    throw new Error(`Failed to download audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Clean up temporary audio file
 */
export function cleanupAudioFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Cleaned up file: ${filePath}`);
    }
  } catch (error) {
    console.error('Error cleaning up file:', error);
  }
}

/**
 * Get file size in bytes
 */
export function getFileSize(filePath: string): number {
  const stats = fs.statSync(filePath);
  return stats.size;
}
