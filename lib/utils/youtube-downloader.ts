// Utility for recording YouTube video audio using Puppeteer
// Uses puppeteer-stream to capture audio directly from browser playback

import { launch, getStream, wss } from 'puppeteer-stream';
import fs from 'fs';
import path from 'path';

export interface VideoInfo {
  title: string;
  duration: number; // in seconds
  description: string;
}

/**
 * Get YouTube video information using YouTube Data API
 * This is more reliable than scraping
 */
export async function getVideoInfo(videoId: string): Promise<VideoInfo> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  
  if (!apiKey) {
    throw new Error('YouTube API key is not configured');
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch video info: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      throw new Error(`Video not found: ${videoId}`);
    }

    const video = data.items[0];
    const duration = parseISO8601Duration(video.contentDetails.duration);
    
    return {
      title: video.snippet.title,
      duration,
      description: video.snippet.description || '',
    };
  } catch (error) {
    console.error('Error fetching video info:', error);
    throw error;
  }
}

/**
 * Parse ISO 8601 duration string (e.g., "PT1H2M34S") to seconds
 */
function parseISO8601Duration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Record YouTube video audio using Puppeteer browser automation
 * Returns path to the recorded audio file
 */
export async function downloadYouTubeAudio(videoId: string): Promise<string> {
  const tempDir = '/tmp/youtube-audio';
  const outputPath = path.join(tempDir, `${videoId}.webm`);
  
  // Ensure temp directory exists
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  let browser;
  let streamInstance;
  
  try {
    console.log(`Starting audio recording for video: ${videoId}`);
    
    // Get video info to know duration
    const videoInfo = await getVideoInfo(videoId);
    const videoDuration = videoInfo.duration;
    const maxRecordingTime = Math.max(videoDuration * 1000 + 60000, 14400000); // Video duration + 1min buffer, max 4 hours
    
    // Get Chromium path from puppeteer package (ESM import)
    const { executablePath: getExecutablePath } = await import('puppeteer');
    const executablePath = getExecutablePath();
    
    // Try new headless mode first (works without display)
    let launchError: Error | null = null;
    try {
      browser = await launch({
        executablePath,
        headless: 'shell' as any, // New headless mode - supports audio
        defaultViewport: {
          width: 1920,
          height: 1080,
        },
        args: [
          '--autoplay-policy=no-user-gesture-required',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
        ],
        ignoreDefaultArgs: ['--mute-audio'],
      });
    } catch (error) {
      launchError = error as Error;
      console.log('New headless mode failed, trying headful with Xvfb...');
      
      // Fallback: Start Xvfb and use headful mode
      const { spawn } = await import('child_process');
      const xvfb = spawn('Xvfb', [':99', '-screen', '0', '1920x1080x24', '-ac', '-nolisten', 'tcp']);
      
      // Wait for Xvfb to start
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      browser = await launch({
        executablePath,
        headless: false,
        defaultViewport: {
          width: 1920,
          height: 1080,
        },
        args: [
          '--autoplay-policy=no-user-gesture-required',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
        ignoreDefaultArgs: ['--mute-audio'],
        env: {
          ...process.env,
          DISPLAY: ':99',
        },
      });
    }

    const page = await browser.newPage();
    
    // Navigate to YouTube video with autoplay
    const videoUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0`;
    await page.goto(videoUrl, { waitUntil: 'networkidle2' });
    
    // Wait for video to start playing
    await page.waitForSelector('video', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for playback to start
    
    console.log('Starting audio stream capture...');
    
    // Start recording audio stream
    streamInstance = await getStream(page, {
      audio: true,
      video: false, // Audio only
      mimeType: 'audio/webm',
      audioBitsPerSecond: 128000, // 128kbps for good quality
    });

    const fileStream = fs.createWriteStream(outputPath);
    streamInstance.pipe(fileStream);

    // Monitor video playback to stop when video ends
    const checkInterval = 5000; // Check every 5 seconds
    let elapsed = 0;
    
    const recordingPromise = new Promise<void>((resolve) => {
      const intervalId = setInterval(async () => {
        try {
          elapsed += checkInterval;
          
          // Safety timeout: Stop if exceeded max time
          if (elapsed >= maxRecordingTime) {
            console.log('Max recording time reached, stopping...');
            clearInterval(intervalId);
            resolve();
            return;
          }
          
          // Check if video has ended
          const videoEnded = await page.evaluate(() => {
            const video = document.querySelector('video');
            return video ? video.ended : false;
          });
          
          if (videoEnded) {
            console.log('Video playback ended, stopping recording...');
            clearInterval(intervalId);
            resolve();
          }
        } catch (error) {
          console.error('Error checking video status:', error);
          clearInterval(intervalId);
          resolve();
        }
      }, checkInterval);
      
      // Also listen for stream end
      fileStream.on('finish', () => {
        clearInterval(intervalId);
        resolve();
      });
    });

    await recordingPromise;

    // Stop recording
    if (streamInstance) {
      await streamInstance.destroy();
    }
    
    fileStream.close();
    
    console.log(`Audio recorded to: ${outputPath}`);
    
    return outputPath;
  } catch (error) {
    console.error('Error recording YouTube audio:', error);
    throw new Error(`Failed to record audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    // Cleanup
    if (streamInstance) {
      try {
        await streamInstance.destroy();
      } catch (e) {
        console.error('Error destroying stream:', e);
      }
    }
    
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.error('Error closing browser:', e);
      }
    }
    
    // Close WebSocket server
    try {
      const ws = await wss;
      ws.close();
    } catch (e) {
      console.error('Error closing WebSocket:', e);
    }
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
