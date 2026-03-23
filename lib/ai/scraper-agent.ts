import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import FirecrawlApp from '@mendable/firecrawl-js';

let openai: OpenAI | null = null;
let firecrawl: FirecrawlApp | null = null;

export const ScrapedMeetingSchema = z.object({
    hasMeeting: z.boolean().describe("Whether a relevant city/county meeting is found on the page"),
    meetingTitle: z.string().nullable().describe("The name of the meeting, e.g., 'City Council Meeting'"),
    meetingDate: z.string().nullable().describe("The date of the meeting in YYYY-MM-DD format if available"),
    videoUrl: z.string().nullable().describe("The direct URL to the YouTube or local video player for the meeting"),
    agendaUrl: z.string().nullable().describe("The direct URL to the PDF or HTML agenda"),
    minutesUrl: z.string().nullable().describe("The direct URL to the PDF or HTML minutes, if available"),
    confidence: z.number().min(0).max(100).describe("Confidence score (0-100) that this is the correct most recent meeting"),
    explanation: z.string().describe("A brief explanation of how the agent decided on this extraction"),
});

export type ScrapedMeetingResult = z.infer<typeof ScrapedMeetingSchema>;

export interface ScrapeOptions {
    targetUrl: string;
    prompt?: string;
}

/**
 * Intelligent Agent that uses Firecrawl to read a complex dynamic government website, 
 * formats it into clean Markdown, and then uses OpenAI structured outputs 
 * to surgically extract the latest meeting materials.
 */
export async function runScraperAgent({ 
    targetUrl, 
    prompt = "Find the most recent City Council or County Commission meeting. Extract its video, agenda, and minutes URLs." 
}: ScrapeOptions): Promise<ScrapedMeetingResult> {
    
    if (!openai) {
        openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    if (!firecrawl) {
        firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY || 'dummy' });
    }

    console.log(`[Scraper Agent] Initiating Firecrawl for ${targetUrl}...`);

    try {
        // 1. Scrape with Firecrawl
        const scrapeResult = await firecrawl.scrape(targetUrl, {
            formats: ['markdown'],
            // Optional: wait for dynamic React/Angular tables to load
            waitFor: 2000, 
        }) as any;

        if (!scrapeResult.success) {
            throw new Error(`Firecrawl failed: ${scrapeResult.error}`);
        }

        const markdownContent = scrapeResult.markdown || '';
        
        console.log(`[Scraper Agent] Firecrawl succeeded. Extracted ${markdownContent.length} characters of Markdown.`);
        console.log(`[Scraper Agent] Analyzing with OpenAI...`);

        // 2. Extract structured data using OpenAI Strict Structured Outputs
        // @ts-ignore - Bypass OpenAI beta typing caching issues during Next.js build
        const completion = await openai.beta.chat.completions.parse({
            model: 'gpt-4o-2024-08-06',
            messages: [
                {
                    role: 'system',
                    content: `You are an expert AI data extraction agent. You are looking at the exact Markdown representation of a local government website. Your goal is to identify the most recent city/county meeting and extract its media URLs (video, agenda, minutes). Use absolute URLs if relative ones are found. Note: A lot of local government websites are messy. Look for keywords like "Agenda", "Video", "Watch", "Minutes".`
                },
                {
                    role: 'user',
                    content: `Here is the user's specific extraction request:\n"${prompt}"\n\n--- SITE MARKDOWN ---\n${markdownContent}`
                }
            ],
            response_format: zodResponseFormat(ScrapedMeetingSchema, 'meeting_extraction'),
            temperature: 0.1, // Keep it highly deterministic
        });

        const extractedData = completion.choices[0].message.parsed;
        
        if (!extractedData) {
            throw new Error("OpenAI failed to return valid structured data.");
        }

        console.log(`[Scraper Agent] Extraction complete! Confidence: ${extractedData.confidence}%`);
        
        return extractedData;

    } catch (error) {
        console.error(`[Scraper Agent] Error during pipeline:`, error);
        throw error;
    }
}
