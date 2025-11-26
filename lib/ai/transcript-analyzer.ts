// AI-powered transcript analysis using Transformers.js
// Provides issue categorization and sentiment analysis for civic meeting transcripts

import { pipeline, Pipeline } from '@xenova/transformers';
import { ISSUE_CATEGORIES, type IssueCategory } from './issue-categories';

// Lazy-loaded model pipelines
let classificationPipeline: Pipeline | null = null;
let sentimentPipeline: Pipeline | null = null;

/**
 * Configuration for AI analysis
 */
const CONFIG = {
    // Minimum confidence threshold for issue categorization (0-1)
    MIN_ISSUE_CONFIDENCE: 0.3,

    // Minimum confidence threshold for sentiment analysis (0-1)
    MIN_SENTIMENT_CONFIDENCE: 0.5,

    // Maximum number of issues to return per segment
    MAX_ISSUES_PER_SEGMENT: 3,

    // Model names
    CLASSIFICATION_MODEL: 'Xenova/bart-large-mnli',
    SENTIMENT_MODEL: 'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
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
 * Initialize the classification model (lazy loading)
 */
async function getClassificationPipeline(): Promise<Pipeline> {
    if (!classificationPipeline) {
        console.log('Loading classification model (first run only, ~400MB)...');
        const startTime = Date.now();
        classificationPipeline = await pipeline(
            'zero-shot-classification',
            CONFIG.CLASSIFICATION_MODEL
        );
        console.log(`Classification model loaded in ${Date.now() - startTime}ms`);
    }
    return classificationPipeline;
}

/**
 * Initialize the sentiment model (lazy loading)
 */
async function getSentimentPipeline(): Promise<Pipeline> {
    if (!sentimentPipeline) {
        console.log('Loading sentiment model (first run only, ~250MB)...');
        const startTime = Date.now();
        sentimentPipeline = await pipeline(
            'sentiment-analysis',
            CONFIG.SENTIMENT_MODEL
        );
        console.log(`Sentiment model loaded in ${Date.now() - startTime}ms`);
    }
    return sentimentPipeline;
}

/**
 * Categorize a transcript segment into relevant issue categories
 * 
 * @param text - The transcript segment text
 * @returns Array of issue categories with confidence scores
 */
export async function categorizeIssues(text: string): Promise<IssueCategorization[]> {
    if (!text || text.trim().length === 0) {
        return [];
    }

    try {
        const classifier = await getClassificationPipeline();

        // Run zero-shot classification
        const result = await classifier(text, ISSUE_CATEGORIES, {
            multi_label: true // Allow multiple categories per segment
        });

        // Extract results and filter by confidence
        const categorizations: IssueCategorization[] = [];

        if (Array.isArray(result.labels) && Array.isArray(result.scores)) {
            for (let i = 0; i < result.labels.length; i++) {
                const confidence = result.scores[i];

                if (confidence >= CONFIG.MIN_ISSUE_CONFIDENCE) {
                    categorizations.push({
                        category: result.labels[i] as IssueCategory,
                        confidence
                    });
                }
            }
        }

        // Sort by confidence (highest first) and limit to top N
        return categorizations
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, CONFIG.MAX_ISSUES_PER_SEGMENT);

    } catch (error) {
        console.error('Issue categorization failed:', error);
        return [];
    }
}

/**
 * Analyze sentiment of a transcript segment
 * 
 * @param text - The transcript segment text
 * @returns Sentiment analysis with label, score, and confidence
 */
export async function analyzeSentiment(text: string): Promise<SentimentAnalysis> {
    if (!text || text.trim().length === 0) {
        return {
            label: 'neutral',
            score: 0,
            confidence: 0
        };
    }

    try {
        const analyzer = await getSentimentPipeline();

        // Run sentiment analysis
        const result = await analyzer(text);

        // Extract result (model returns array with single result)
        const sentimentResult = Array.isArray(result) ? result[0] : result;

        // Convert to our format
        const label = sentimentResult.label.toLowerCase() as 'positive' | 'negative' | 'neutral';
        const confidence = sentimentResult.score;

        // Convert to -1 to 1 scale
        let score = 0;
        if (label === 'positive') {
            score = confidence; // 0 to 1
        } else if (label === 'negative') {
            score = -confidence; // 0 to -1
        }

        return {
            label,
            score,
            confidence
        };

    } catch (error) {
        console.error('Sentiment analysis failed:', error);
        return {
            label: 'neutral',
            score: 0,
            confidence: 0
        };
    }
}

/**
 * Perform complete analysis on a transcript segment
 * Combines issue categorization and sentiment analysis
 * 
 * @param text - The transcript segment text
 * @returns Complete analysis results with timing
 */
export async function analyzeSegment(text: string): Promise<SegmentAnalysis> {
    const startTime = Date.now();

    // Run both analyses in parallel for better performance
    const [issues, sentiment] = await Promise.all([
        categorizeIssues(text),
        analyzeSentiment(text)
    ]);

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
 * Processes segments sequentially to avoid memory issues
 * 
 * @param segments - Array of transcript segment texts
 * @param onProgress - Optional callback for progress updates
 * @returns Array of analysis results
 */
export async function analyzeSegments(
    segments: string[],
    onProgress?: (current: number, total: number) => void
): Promise<SegmentAnalysis[]> {
    const results: SegmentAnalysis[] = [];

    for (let i = 0; i < segments.length; i++) {
        const result = await analyzeSegment(segments[i]);
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

/**
 * Update configuration values
 */
export function updateConfig(updates: Partial<typeof CONFIG>) {
    Object.assign(CONFIG, updates);
}
