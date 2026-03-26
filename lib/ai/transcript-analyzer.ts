// AI-powered transcript analysis using OpenAI and AssemblyAI.
// Provides issue categorization and sentiment analysis for civic meeting transcripts.
// Optimized for Vercel Serverless (no local model loading).

import OpenAI from 'openai';
import { ISSUE_CATEGORIES, type IssueCategory } from './issue-categories';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
});

/**
 * Configuration for AI analysis
 */
const CONFIG = {
    // Minimum confidence threshold for issue categorization (0-1)
    MIN_ISSUE_CONFIDENCE: 0.3,

    // Maximum number of issues to return per segment
    MAX_ISSUES_PER_SEGMENT: 3,

    // OpenAI Model
    MODEL: 'gpt-4o-mini'
};

/**
 * Issue categorization result
 */
export interface IssueCategorization {
    category: IssueCategory;
    confidence: number;
}

/**
 * Sentiment analysis result
 */
export interface SentimentAnalysis {
    label: 'positive' | 'negative' | 'neutral';
    score: number; // -1 to 1 scale
    confidence: number; // 0 to 1 scale
}

/**
 * Complete segment analysis result
 */
export interface SegmentAnalysis {
    text: string;
    issues: IssueCategorization[];
    sentiment: SentimentAnalysis;
    processingTimeMs: number;
}

/**
 * Categorize a transcript segment into relevant issue categories using OpenAI
 * 
 * @param text - The transcript segment text
 * @returns Array of issue categories with confidence scores
 */
export async function categorizeIssues(text: string): Promise<IssueCategorization[]> {
    if (!text || text.trim().length === 0) {
        return [];
    }

    try {
        const response = await openai.chat.completions.create({
            model: CONFIG.MODEL,
            messages: [
                {
                    role: 'system',
                    content: `You are a civic data assistant. Categorize the following transcript segment from a city council meeting into the most relevant issue categories.
Available categories: ${ISSUE_CATEGORIES.join(', ')}.
Respond ONLY with a JSON array of objects, each containing "category" and "confidence" (0-1 scale).
Example: [{"category": "Transportation", "confidence": 0.9}, {"category": "Infrastructure", "confidence": 0.4}]`
                },
                {
                    role: 'user',
                    content: text
                }
            ],
            response_format: { type: 'json_object' }
        });

        const content = response.choices[0].message.content;
        if (!content) return [];

        const data = JSON.parse(content);
        const results = Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);
        
        // Handle case where LLM returns a single object instead of array
        const rawCategorizations = Array.isArray(data.categories) ? data.categories : results;

        const categorizations: IssueCategorization[] = rawCategorizations
            .filter((item: any) => ISSUE_CATEGORIES.includes(item.category as IssueCategory))
            .map((item: any) => ({
                category: item.category as IssueCategory,
                confidence: item.confidence || 0.5
            }))
            .filter((item: any) => item.confidence >= CONFIG.MIN_ISSUE_CONFIDENCE);

        return categorizations
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, CONFIG.MAX_ISSUES_PER_SEGMENT);

    } catch (error) {
        console.error('OpenAI issue categorization failed:', error);
        return [];
    }
}

/**
 * Analyze sentiment of a transcript segment
 * Note: Now primarily relies on AssemblyAI sentiment passed through, 
 * but keeps this as a fallback using OpenAI.
 * 
 * @param text - The transcript segment text
 * @returns Sentiment analysis result
 */
export async function analyzeSentiment(text: string): Promise<SentimentAnalysis> {
    if (!text || text.trim().length === 0) {
        return { label: 'neutral', score: 0, confidence: 0 };
    }

    try {
        const response = await openai.chat.completions.create({
            model: CONFIG.MODEL,
            messages: [
                {
                    role: 'system',
                    content: 'Analyze the sentiment of this city council meeting transcript segment. Respond with a JSON object: {"label": "positive"|"negative"|"neutral", "score": number (-1 to 1), "confidence": number (0-1)}'
                },
                {
                    role: 'user',
                    content: text
                }
            ],
            response_format: { type: 'json_object' }
        });

        const content = response.choices[0].message.content;
        if (!content) throw new Error('Empty response');

        const data = JSON.parse(content);
        return {
            label: data.label || 'neutral',
            score: data.score || 0,
            confidence: data.confidence || 0.5
        };
    } catch (error) {
        console.error('OpenAI sentiment analysis failed:', error);
        return { label: 'neutral', score: 0, confidence: 0 };
    }
}

/**
 * Perform complete analysis on a transcript segment
 * 
 * @param text - The transcript segment text
 * @param precomputedSentiment - Optional pre-computed sentiment from AssemblyAI
 * @returns Complete analysis results
 */
export async function analyzeSegment(text: string, precomputedSentiment?: any): Promise<SegmentAnalysis> {
    const startTime = Date.now();

    // If sentiment is provided from AssemblyAI, we map it.
    // AssemblyAI sentiment format: { sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL', confidence: number }
    let sentiment: SentimentAnalysis;
    
    if (precomputedSentiment) {
        const label = precomputedSentiment.sentiment?.toLowerCase() || 'neutral';
        const confidence = precomputedSentiment.confidence || 1.0;
        sentiment = {
            label: label as any,
            score: label === 'positive' ? confidence : (label === 'negative' ? -confidence : 0),
            confidence
        };
    } else {
        sentiment = await analyzeSentiment(text);
    }

    const issues = await categorizeIssues(text);
    const processingTimeMs = Date.now() - startTime;

    return {
        text,
        issues,
        sentiment,
        processingTimeMs
    };
}

/**
 * Batch analyze multiple segments
 * 
 * @param segments - Array of objects with text and optional precomputed sentiment
 */
export async function analyzeSegments(
    segments: Array<{ text: string; sentiment?: any }>,
    onProgress?: (current: number, total: number) => void
): Promise<SegmentAnalysis[]> {
    const results: SegmentAnalysis[] = [];

    // Process in smaller batches to stay within OpenAI rate limits and Vercel time limits
    for (let i = 0; i < segments.length; i++) {
        const result = await analyzeSegment(segments[i].text, segments[i].sentiment);
        results.push(result);

        if (onProgress) {
            onProgress(i + 1, segments.length);
        }
    }

    return results;
}

/**
 * Get configuration values
 */
export function getConfig() {
    return { ...CONFIG };
}
