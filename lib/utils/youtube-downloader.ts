// YouTube MP3 download using ytmp3.as automation
// Uses tested selectors and approach that works reliably

import puppeteer, { Browser } from 'puppeteer';
import fs from 'fs';
import path from 'path';

interface DownloadOptions {
  videoId: string;
  outputPath: string;
}

interface DownloadResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

/**
 * Find system Chromium executable path
 * Falls back to Puppeteer's bundled Chrome if not set
 */
function findChromiumExecutable(): string | undefined {
  return process.env.CHROMIUM_PATH || undefined;
}

/**
 * Download MP3 from YouTube using ytmp3.as
 * Uses specific selectors that work with the ytmp3.as site
 */
export async function recordYouTubeAudio(options: DownloadOptions): Promise<DownloadResult> {
  const { videoId, outputPath } = options;
  
  let browser: Browser | null = null;
  const outputDir = path.dirname(outputPath);
  let tempDownloadFile: string | null = null; // Track the temporary download

  try {
    console.log(`Starting MP3 download for video ${videoId}`);

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Configure browser
    const chromiumPath = findChromiumExecutable();
    
    browser = await puppeteer.launch({
      headless: true,
      executablePath: chromiumPath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();

    // Set download behavior
    const client = await page.createCDPSession();
    await client.send('Browser.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: outputDir,
    });

    // Navigate to ytmp3.as converter
    const converterUrl = 'https://ytmp3.as/AOPR/';
    console.log(`Navigating to ${converterUrl}`);
    await page.goto(converterUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Wait for the input field to be ready
    await page.waitForSelector('#v');
    
    // Enter the YouTube URL
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    console.log('Entering URL and submitting');
    await page.type('#v', youtubeUrl);
    
    // Click the convert button
    await page.click('body > form > div:nth-child(2) > button:nth-child(3)');
    console.log('Conversion started');
    
    // Wait for the download button to appear and click it
    try {
      await page.waitForSelector('body > form > div:nth-child(2) > button:nth-child(1)', { timeout: 120000 }); // 2 minutes for conversion
      await page.click('body > form > div:nth-child(2) > button:nth-child(1)');
      console.log('Download button clicked');
    } catch (error) {
      throw new Error('Timeout waiting for conversion to complete');
    }
    
    // Wait a bit for download to initiate
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Poll for downloaded file
    console.log('Waiting for download to complete (up to 3 minutes)...');
    const downloadStartTime = Date.now();
    const downloadTimeout = 180000; // 3 minutes
    let downloadedFile: string | null = null;
    
    while (Date.now() - downloadStartTime < downloadTimeout) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const files = fs.readdirSync(outputDir);
      const mp3File = files.find(f => f.endsWith('.mp3'));
      
      if (mp3File) {
        const filePath = path.join(outputDir, mp3File);
        const stats = fs.statSync(filePath);
        
        // Make sure file has content and isn't still being written
        if (stats.size > 0) {
          // Wait a bit to ensure write is complete
          await new Promise(resolve => setTimeout(resolve, 1000));
          const newStats = fs.statSync(filePath);
          
          // If size hasn't changed, download is complete
          if (newStats.size === stats.size) {
            downloadedFile = mp3File;
            break;
          }
        }
      }
    }

    if (!downloadedFile) {
      throw new Error('Download timed out - no MP3 file found after 3 minutes');
    }

    const downloadedPath = path.join(outputDir, downloadedFile);
    tempDownloadFile = downloadedPath; // Track for cleanup
    
    // Atomically replace outputPath with the new download
    if (downloadedPath !== outputPath) {
      // Remove existing outputPath only when we have a successful new download
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
        console.log(`Replaced existing file at ${outputPath}`);
      }
      fs.renameSync(downloadedPath, outputPath);
      tempDownloadFile = null; // Successfully renamed, no longer temporary
      console.log(`Renamed ${downloadedFile} to ${path.basename(outputPath)}`);
    }

    // Final verification
    if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
      throw new Error('Downloaded file is empty or missing');
    }

    console.log(`Download completed successfully: ${outputPath}`);
    return {
      success: true,
      filePath: outputPath,
    };
  } catch (error) {
    console.error('Error downloading YouTube MP3:', error);
    
    // Clean up only the temporary download from this attempt
    // Never delete outputPath (preserves previous successful downloads)
    if (tempDownloadFile && fs.existsSync(tempDownloadFile)) {
      try {
        fs.unlinkSync(tempDownloadFile);
        console.log(`Cleaned up partial download: ${path.basename(tempDownloadFile)}`);
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError);
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  } finally {
    // Clean up browser
    if (browser) {
      await browser.close();
      console.log('Browser closed');
    }
  }
}
