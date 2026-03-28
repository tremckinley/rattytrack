// AI-powered transcript analysis using Anthropic (Claude) and AssemblyAI.
// Provides issue categorization and sentiment analysis for civic meeting transcripts.
// Optimized for Vercel Serverless (no local model loading).

import Anthropic from '@anthropic-ai/sdk';
import { ISSUE_CATEGORIES, type IssueCategory } from './issue-categories';
import { MEMPHIS_SYSTEM_PROMPT } from './memphis-context';

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
            system: `${MEMPHIS_SYSTEM_PROMPT}\n\nYou are an expert civic data extraction assistant.`,
            messages: [
                {
                    role: 'user',
                    content: `Categorize the following transcript segment from a city council meeting into the most relevant issue categories:\n\n${text}`
                }
            ],
            tools: [
                {
                    name: 'extract_categories',
                    description: 'Extract relevant civic issue categories from the text',
                    input_schema: {
                        type: 'object',
                        properties: {
                            issues: {
                                type: 'array',
                                description: 'List of relevant civic issue categories found in the text',
                                items: {
                                    type: 'object',
                                    properties: {
                                        category: {
                                            type: 'string',
                                            enum: Object.values(ISSUE_CATEGORIES),
                                            description: 'The standardized civic category.'
                                        },
                                        confidence: {
                                            type: 'number',
                                            description: 'Confidence score (0 to 1) that this category applies to the text.'
                                        }
                                    },
                                    required: ['category', 'confidence']
                                }
                            }
                        },
                        required: ['issues']
                    }
                }
            ],
            tool_choice: { type: 'tool', name: 'extract_categories' }
        });

        const toolCall = response.content.find(block => block.type === 'tool_use');
        
        if (!toolCall || toolCall.type !== 'tool_use') {
            throw new Error('Anthropic failed to use the extraction tool.');
        }

        const data = toolCall.input as unknown as { issues: IssueCategorization[] };
        const categorizations: IssueCategorization[] = (data.issues || [])
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
            system: `${MEMPHIS_SYSTEM_PROMPT}\n\nYou are an expert civic sentiment analyzer.`,
            messages: [
                {
                    role: 'user',
                    content: `Analyze the sentiment of this city council meeting transcript segment:\n\n${text}`
                }
            ],
            tools: [
                {
                    name: 'extract_sentiment',
                    description: 'Extract the overall sentiment from the provided transcript segment',
                    input_schema: {
                        type: 'object',
                        properties: {
                            label: {
                                type: 'string',
                                enum: ['positive', 'negative', 'neutral'],
                                description: 'The overarching sentiment classification.'
                            },
                            score: {
                                type: 'number',
                                description: 'A detailed sentiment score ranging from -1 (extremely negative) to 1 (extremely positive). 0 is neutral.'
                            },
                            confidence: {
                                type: 'number',
                                description: 'The probability (0 to 1) that this sentiment classification is accurate.'
                            }
                        },
                        required: ['label', 'score', 'confidence']
                    }
                }
            ],
            tool_choice: { type: 'tool', name: 'extract_sentiment' }
        });

        const toolCall = response.content.find(block => block.type === 'tool_use');
        
        if (!toolCall || toolCall.type !== 'tool_use') {
            throw new Error('Anthropic failed to use the extraction tool.');
        }

        const data = toolCall.input as unknown as SentimentAnalysis;
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
