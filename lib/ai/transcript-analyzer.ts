// AI-powered transcript analysis using Anthropic (Claude) and AssemblyAI.
// Provides issue categorization and sentiment analysis for civic meeting transcripts.
// Optimized for Vercel Serverless (no local model loading).

import Anthropic from '@anthropic-ai/sdk';
import { ISSUE_CATEGORIES, type IssueCategory } from './issue-categories';

// Initialize Anthropic client
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
});

/**
 * Configuration for AI analysis
 */
const CONFIG = {
    // Minimum confidence threshold for issue categorization (0-1)
    MIN_ISSUE_CONFIDENCE: 0.3,

    // Maximum number of issues to return per segment
    MAX_ISSUES_PER_SEGMENT: 3,

    // Anthropic Model
    MODEL: 'claude-sonnet-4-5-20250929'
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
 * Categorize a transcript segment into relevant issue categories using Claude
 * 
 * @param text - The transcript segment text
 * @returns Array of issue categories with confidence scores
 */
export async function categorizeIssues(text: string): Promise<IssueCategorization[]> {
    if (!text || text.trim().length === 0) {
        return [];
    }

    try {
        const response = await anthropic.messages.create({
            model: CONFIG.MODEL,
            max_tokens: 1024,
            system: `You are a civic data assistant. Categorize the following transcript segment from a city council meeting into the most relevant issue categories.
Available categories: ${ISSUE_CATEGORIES.join(', ')}.
Respond ONLY with a JSON array of objects, each containing "category" and "confidence" (0-1 scale).
Example: [{"category": "Transportation", "confidence": 0.9}, {"category": "Infrastructure", "confidence": 0.4}]`,
            messages: [
                {
                    role: 'user',
                    content: text
                }
            ]
        });

        const block = (response.content[0] as any);
        const content = block && block.type === 'text' ? block.text : '';
        if (!content) return [];

        // Simple JSON extraction in case Claude adds markdown or text
        // Use [\s\S] instead of . with /s flag for ES2017 compatibility
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        const jsonStr = jsonMatch ? jsonMatch[0] : content;
        
        const data = JSON.parse(jsonStr);
        const categorizations: IssueCategorization[] = (Array.isArray(data) ? data : [])
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
        console.error('Claude issue categorization failed:', error);
        return [];
    }
}

/**
 * Analyze sentiment of a transcript segment
 * Note: Now primarily relies on AssemblyAI sentiment passed through, 
 * but keeps this as a fallback using Claude.
 * 
 * @param text - The transcript segment text
 * @returns Sentiment analysis result
 */
export async function analyzeSentiment(text: string): Promise<SentimentAnalysis> {
    if (!text || text.trim().length === 0) {
        return { label: 'neutral', score: 0, confidence: 0 };
    }

    try {
        const response = await anthropic.messages.create({
            model: CONFIG.MODEL,
            max_tokens: 512,
            system: 'Analyze the sentiment of this city council meeting transcript segment. Respond with a JSON object: {"label": "positive"|"negative"|"neutral", "score": number (-1 to 1), "confidence": number (0-1)}',
            messages: [
                {
                    role: 'user',
                    content: text
                }
            ]
        });

        const block = (response.content[0] as any);
        const content = block && block.type === 'text' ? block.text : '';
        if (!content) throw new Error('Empty response');

        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : content;

        const data = JSON.parse(jsonStr);
        return {
            label: data.label || 'neutral',
            score: data.score || 0,
            confidence: data.confidence || 0.5
        };
    } catch (error) {
        console.error('Claude sentiment analysis failed:', error);
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

    // Process in smaller batches
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
