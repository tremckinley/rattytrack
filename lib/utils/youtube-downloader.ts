// YouTube audio recording using puppeteer-stream
// Critical: Handles browser cleanup and Xvfb process management

import puppeteer, { Browser } from 'puppeteer';
import { getStream } from 'puppeteer-stream';
import fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';

interface RecordingOptions {
  videoId: string;
  outputPath: string;
  onProgress?: (seconds: number) => void;
}

interface RecordingResult {
  success: boolean;
  filePath?: string;
  duration?: number;
  error?: string;
}

/**
 * Start Xvfb virtual display (fallback for headless mode failure)
 */
function startXvfb(): ChildProcess | null {
  try {
    const xvfb = spawn('Xvfb', [':99', '-screen', '0', '1280x720x24', '-ac', '-nolisten', 'tcp']);
    
    // Set DISPLAY environment variable for browser
    process.env.DISPLAY = ':99';
    
    console.log('Started Xvfb virtual display on :99');
    return xvfb;
  } catch (error) {
    console.error('Failed to start Xvfb:', error);
    return null;
  }
}

/**
 * Launch browser with proper audio configuration
 * Two-tier approach: headless shell first, then Xvfb fallback
 */
async function launchBrowserWithAudio(): Promise<{ browser: Browser; xvfbProcess: ChildProcess | null }> {
  let xvfbProcess: ChildProcess | null = null;

  try {
    // Try headless shell mode first (works without display)
    console.log('Attempting headless shell mode...');
    const browser = await puppeteer.launch({
      headless: 'shell',
      args: [
        '--autoplay-policy=no-user-gesture-required',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
      ignoreDefaultArgs: ['--mute-audio'],
      defaultViewport: {
        width: 1280,
        height: 720,
      },
    });

    console.log('Browser launched in headless shell mode');
    return { browser, xvfbProcess: null };
  } catch (error) {
    console.log('Headless shell failed, trying Xvfb fallback...', error);
    
    // Start Xvfb virtual display
    xvfbProcess = startXvfb();
    
    if (!xvfbProcess) {
      throw new Error('Failed to start Xvfb - cannot record audio');
    }

    // Wait for Xvfb to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Launch browser with Xvfb display
    const browser = await puppeteer.launch({
      headless: false, // Must be headful with Xvfb
      args: [
        '--autoplay-policy=no-user-gesture-required',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
      ignoreDefaultArgs: ['--mute-audio'],
      defaultViewport: {
        width: 1280,
        height: 720,
      },
    });

    console.log('Browser launched with Xvfb virtual display');
    return { browser, xvfbProcess };
  }
}

/**
 * Wait for video element to be ready and get duration
 */
async function waitForVideo(page: any): Promise<number> {
  await page.waitForSelector('video', { timeout: 30000 });
  
  // Wait for video to load metadata
  await page.evaluate(() => {
    return new Promise<void>((resolve) => {
      const video = document.querySelector('video') as HTMLVideoElement;
      if (video.readyState >= 1) {
        resolve();
      } else {
        video.addEventListener('loadedmetadata', () => resolve(), { once: true });
      }
    });
  });

  // Get video duration
  const duration = await page.evaluate(() => {
    const video = document.querySelector('video') as HTMLVideoElement;
    return video.duration;
  });

  return Math.floor(duration);
}

/**
 * Monitor video playback and stop when ended
 */
async function monitorVideoEnd(page: any, onProgress?: (seconds: number) => void): Promise<void> {
  return new Promise((resolve) => {
    const checkInterval = setInterval(async () => {
      try {
        const status = await page.evaluate(() => {
          const video = document.querySelector('video') as HTMLVideoElement;
          return {
            ended: video.ended,
            currentTime: Math.floor(video.currentTime),
            paused: video.paused,
          };
        });

        if (onProgress) {
          onProgress(status.currentTime);
        }

        // If video is paused, try to play it
        if (status.paused && !status.ended) {
          await page.evaluate(() => {
            const video = document.querySelector('video') as HTMLVideoElement;
            video.play().catch(() => {});
          });
        }

        if (status.ended) {
          clearInterval(checkInterval);
          resolve();
        }
      } catch (error) {
        console.error('Error monitoring video:', error);
      }
    }, 5000); // Check every 5 seconds
  });
}

/**
 * Record audio from YouTube video
 * CRITICAL: Always cleans up browser and Xvfb process
 */
export async function recordYouTubeAudio(options: RecordingOptions): Promise<RecordingResult> {
  const { videoId, outputPath, onProgress } = options;
  
  let browser: Browser | null = null;
  let xvfbProcess: ChildProcess | null = null;
  let writeStream: fs.WriteStream | null = null;

  try {
    console.log(`Starting audio recording for video ${videoId}`);

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Launch browser with audio enabled
    const launchResult = await launchBrowserWithAudio();
    browser = launchResult.browser;
    xvfbProcess = launchResult.xvfbProcess;

    const page = await browser.newPage();

    // Navigate to YouTube video
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    console.log(`Navigating to ${videoUrl}`);
    await page.goto(videoUrl, { waitUntil: 'networkidle2', timeout: 60000 });

    // Wait for video to be ready
    const duration = await waitForVideo(page);
    console.log(`Video duration: ${duration} seconds`);

    // Click play button (in case it's not auto-playing)
    await page.evaluate(() => {
      const video = document.querySelector('video') as HTMLVideoElement;
      video.play().catch(() => {});
    });

    // Start recording audio stream
    console.log('Starting audio stream recording...');
    const stream = await getStream(page, { audio: true, video: false });
    writeStream = fs.createWriteStream(outputPath);
    stream.pipe(writeStream);

    // Monitor video until it ends
    console.log('Monitoring video playback...');
    await monitorVideoEnd(page, onProgress);

    // Stop recording
    console.log('Video ended, stopping recording...');
    stream.destroy();
    await new Promise(resolve => writeStream?.end(resolve));

    // Verify file was created
    if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
      throw new Error('Recording failed - output file is empty or missing');
    }

    console.log(`Recording completed: ${outputPath}`);
    return {
      success: true,
      filePath: outputPath,
      duration,
    };
  } catch (error) {
    console.error('Error recording YouTube audio:', error);
    
    // Clean up partial file
    if (outputPath && fs.existsSync(outputPath)) {
      try {
        fs.unlinkSync(outputPath);
      } catch (e) {
        console.error('Failed to delete partial file:', e);
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  } finally {
    // CRITICAL: Clean up resources
    try {
      if (writeStream) {
        writeStream.end();
      }
      
      if (browser) {
        await browser.close();
        console.log('Browser closed');
      }

      // Kill Xvfb process if it was started
      if (xvfbProcess) {
        xvfbProcess.kill('SIGTERM');
        console.log('Xvfb process terminated');
        
        // Wait for process to exit
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Force kill if still running
        if (!xvfbProcess.killed) {
          xvfbProcess.kill('SIGKILL');
        }
      }
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }
  }
}