// YouTube MP3 download using ytmp3.as automation
// Uses Puppeteer's native download handling for reliability

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
 * Uses Puppeteer's native download API for reliable file handling
 */
export async function recordYouTubeAudio(options: DownloadOptions): Promise<DownloadResult> {
  const { videoId, outputPath } = options;
  
  let browser: Browser | null = null;

  try {
    console.log(`Starting MP3 download for video ${videoId}`);

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Configure browser
    const chromiumPath = findChromiumExecutable();
    
    browser = await puppeteer.launch({
      headless: false,
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
    await page.waitForSelector('#v')
    //await page.waitForNavigation({ waitUntil: 'networkidle2' })
    console.log('pasting URL and submitting')
    await page.type("#v","https://www.youtube.com/watch?v=krW88eliPB0")
    await page.click('body > form > div:nth-child(2) > button:nth-child(3)')
    console.log("running")
    try {
        await page.waitForSelector("body > form > div:nth-child(2) > button:nth-child(1)", { timeout: 60000 })
        await page.click("body > form > div:nth-child(2) > button:nth-child(1)")
        console.log("downloading...")
    } catch (error) {
        console.error("Timeout or error waiting for selector:")
    }
    await new Promise(resolve => setTimeout(resolve, 2000));

  }

    
//     // Wait for page to be interactive
//     await new Promise(resolve => setTimeout(resolve, 2000));

//     // Enter YouTube URL
//     const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
//     console.log(`Entering YouTube URL: ${youtubeUrl}`);
    
//     const inputFilled = await page.evaluate((url) => {
//       const input = document.querySelector('input[type="text"]') as HTMLInputElement;
//       if (!input) return false;
      
//       input.focus();
//       input.value = url;
//       input.dispatchEvent(new Event('input', { bubbles: true }));
//       input.dispatchEvent(new Event('change', { bubbles: true }));
//       return true;
//     }, youtubeUrl);

//     if (!inputFilled) {
//       throw new Error('Could not find URL input field on ytmp3.as');
//     }

//     await new Promise(resolve => setTimeout(resolve, 1000));

//     // Click convert button or press Enter
//     console.log('Starting conversion...');
//     const buttonClicked = await page.evaluate(() => {
//       const buttons = Array.from(document.querySelectorAll('button'));
//       const convertButton = buttons.find(btn => 
//         btn.textContent?.toLowerCase().includes('convert') ||
//         btn.textContent?.toLowerCase().includes('submit') ||
//         btn.type === 'submit'
//       );
      
//       if (convertButton) {
//         (convertButton as HTMLButtonElement).click();
//         return true;
//       }
//       return false;
//     });

//     if (!buttonClicked) {
//       await page.keyboard.press('Enter');
//     }

//     // Wait for conversion to complete
//     console.log('Waiting for conversion to complete (up to 2 minutes)...');
    
//     // Poll for download link with retries
//     let downloadLinkFound = false;
//     const maxAttempts = 24; // 2 minutes with 5 second intervals
    
//     for (let attempt = 0; attempt < maxAttempts; attempt++) {
//       await new Promise(resolve => setTimeout(resolve, 5000));
      
//       downloadLinkFound = await page.evaluate(() => {
//         const links = Array.from(document.querySelectorAll('a'));
//         return links.some(link => 
//           link.href.toLowerCase().includes('.mp3') ||
//           (link.textContent?.toLowerCase().includes('download') && link.href)
//         );
//       });
      
//       if (downloadLinkFound) {
//         console.log(`Download link found after ${(attempt + 1) * 5} seconds`);
//         break;
//       }
      
//       if (attempt % 6 === 5) {
//         console.log(`Still waiting for conversion... (${(attempt + 1) * 5}s elapsed)`);
//       }
//     }

//     if (!downloadLinkFound) {
//       throw new Error('Conversion timed out - no download link found after 2 minutes');
//     }

//     // Wait a bit more for any final DOM updates
//     await new Promise(resolve => setTimeout(resolve, 2000));

//     // Initiate download by clicking the link
//     console.log('Clicking download link...');
    
//     const downloadClicked = await page.evaluate(() => {
//       const links = Array.from(document.querySelectorAll('a'));
//       const downloadLink = links.find(link => 
//         link.href.toLowerCase().includes('.mp3') ||
//         (link.textContent?.toLowerCase().includes('download') && link.href)
//       );
      
//       if (downloadLink) {
//         (downloadLink as HTMLAnchorElement).click();
//         return true;
//       }
//       return false;
//     });

//     if (!downloadClicked) {
//       throw new Error('Failed to click download link');
//     }

//     // Wait for download to complete
//     console.log('Waiting for download to complete (up to 3 minutes)...');
    
//     // Poll for downloaded file
//     const downloadStartTime = Date.now();
//     const downloadTimeout = 180000; // 3 minutes
//     let downloadedFile: string | null = null;
    
//     while (Date.now() - downloadStartTime < downloadTimeout) {
//       await new Promise(resolve => setTimeout(resolve, 2000));
      
//       const files = fs.readdirSync(outputDir);
//       const mp3File = files.find(f => f.endsWith('.mp3'));
      
//       if (mp3File) {
//         const filePath = path.join(outputDir, mp3File);
//         const stats = fs.statSync(filePath);
        
//         // Make sure file has content and isn't still being written
//         if (stats.size > 0) {
//           // Wait a bit to ensure write is complete
//           await new Promise(resolve => setTimeout(resolve, 1000));
//           const newStats = fs.statSync(filePath);
          
//           // If size hasn't changed, download is complete
//           if (newStats.size === stats.size) {
//             downloadedFile = mp3File;
//             break;
//           }
//         }
//       }
//     }

//     if (!downloadedFile) {
//       throw new Error('Download timed out - no MP3 file found after 3 minutes');
//     }

//     const downloadedPath = path.join(outputDir, downloadedFile);
    
//     // Rename to expected output path if different
//     if (downloadedPath !== outputPath) {
//       fs.renameSync(downloadedPath, outputPath);
//       console.log(`Renamed ${downloadedFile} to ${path.basename(outputPath)}`);
//     }

//     // Final verification
//     if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
//       throw new Error('Downloaded file is empty or missing');
//     }

//     console.log(`Download completed successfully: ${outputPath}`);
//     return {
//       success: true,
//       filePath: outputPath,
//     };
//   } catch (error) {
//     console.error('Error downloading YouTube MP3:', error);
    
//     // Clean up partial file if exists
//     if (outputPath && fs.existsSync(outputPath)) {
//       try {
//         fs.unlinkSync(outputPath);
//       } catch (e) {
//         console.error('Failed to delete partial file:', e);
//       }
//     }

//     return {
//       success: false,
//       error: error instanceof Error ? error.message : 'Unknown error',
//     };
//   } finally {
//     // Clean up browser
//     if (browser) {
//       await browser.close();
//       console.log('Browser closed');
//     }
//   }
// }
