// Legislator Intelligence Pipeline
// Orchestrates the full analysis pipeline: Robert's Rules → Votes → Quotes → Positions
// Updated to use video_id schema pattern matching actual database

import { parseTranscript, detectAgendaItemBoundaries, correlateMotionSecond } from './robert-rules-parser';
import { extractAllVotes } from './vote-extractor';
import { detectQuotesFromSegments } from './key-quote-detector';
import {
    positionFromVote,
    positionFromMotion,
    positionFromSecond,
    positionFromDeliberation
} from './position-aggregator';
import { analyzeSegment } from './transcript-analyzer';

import { createAgendaItems, linkSegmentsToAgendaItems, getAgendaItemsByVideo, getAgendaItemAtTime } from '@/lib/data/agenda-items';
import { saveKeyQuotes } from '@/lib/data/key-quotes';
import { savePositions } from '@/lib/data/legislator-positions';

import type {
    AgendaItem,
    RobertRulesEvent,
    VoteExtractionResult,
    QuoteDetectionResult,
    PositionAggregationResult
} from '@/types/LegislatorIntelligence';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    AI_MODEL_VERSION: 'intelligence-pipeline-v1',

    // Whether to run each step
    ENABLE_ROBERT_RULES: true,
    ENABLE_VOTE_EXTRACTION: true,
    ENABLE_QUOTE_DETECTION: true,
    ENABLE_POSITION_AGGREGATION: true,

    // Progress callback interval (segments)
    PROGRESS_INTERVAL: 10
};

// ============================================================================
// PIPELINE TYPES
// ============================================================================

export interface PipelineInput {
    videoId: string;  // video_transcriptions.video_id
    segments: Array<{
        id: number;  // INTEGER in actual schema
        text: string;
        start_time: number;  // Column names match actual schema
        end_time: number;
        speaker_id?: string | null;
        speaker_name?: string | null;
    }>;
    // Optional: pre-parsed agenda from PDF
    agendaFromPdf?: Array<{
        itemNumber: number;
        title: string;
        billId?: string;
    }>;
    // Optional: list of attendees for unanimous consent handling
    attendeeIds?: string[];
}

export interface PipelineOutput {
    // Processing stats
    processingTimeMs: number;
    segmentsProcessed: number;

    // Created records
    agendaItems: AgendaItem[];
    eventsDetected: RobertRulesEvent[];
    votesExtracted: VoteExtractionResult[];
    quotesDetected: QuoteDetectionResult[];
    positionsAggregated: PositionAggregationResult[];

    // Database save results
    savedAgendaItems: number;
    savedQuotes: number;
    savedPositions: number;

    // Errors
    errors: string[];
}

// ============================================================================
// MAIN PIPELINE
// ============================================================================

/**
 * Run the full legislator intelligence pipeline on a video transcript
 */
export async function runIntelligencePipeline(
    input: PipelineInput,
    onProgress?: (step: string, current: number, total: number) => void
): Promise<PipelineOutput> {
    const startTime = Date.now();
    const errors: string[] = [];

    const output: PipelineOutput = {
        processingTimeMs: 0,
        segmentsProcessed: input.segments.length,
        agendaItems: [],
        eventsDetected: [],
        votesExtracted: [],
        quotesDetected: [],
        positionsAggregated: [],
        savedAgendaItems: 0,
        savedQuotes: 0,
        savedPositions: 0,
        errors
    };

    try {
        // ====================================================================
        // STEP 1: Robert's Rules Parsing
        // ====================================================================
        if (CONFIG.ENABLE_ROBERT_RULES) {
            onProgress?.('Robert\'s Rules Parsing', 0, input.segments.length);

            // Convert segments to parser format
            const parserSegments = input.segments.map(s => ({
                id: String(s.id),
                text: s.text,
                start_time_seconds: s.start_time,
                speaker_id: s.speaker_id
            }));

            // Parse all segments for events
            output.eventsDetected = parseTranscript(parserSegments);

            // Detect agenda item boundaries
            const boundaries = detectAgendaItemBoundaries(output.eventsDetected);

            // Create agenda items (from detection or PDF)
            const agendaItemsToCreate = boundaries.map((b, index) => ({
                videoId: input.videoId,
                itemNumber: b.itemNumber ?? (index + 1),
                itemType: b.itemType,
                title: input.agendaFromPdf?.find(a => a.itemNumber === b.itemNumber)?.title
                    ?? `Agenda Item ${b.itemNumber ?? (index + 1)}`,
                startTime: b.startTimestamp,
                endTime: b.endTimestamp ?? undefined,
                detectionMethod: 'robert_rules' as const,
                detectionConfidence: b.triggerEvent.confidence,
                triggerPhrase: b.triggerEvent.triggerPhrase
            }));

            if (agendaItemsToCreate.length > 0) {
                const createResult = await createAgendaItems(agendaItemsToCreate);
                output.savedAgendaItems = createResult.created;

                if (createResult.errors > 0) {
                    errors.push(`Failed to create ${createResult.errors} agenda items`);
                }
            }

            // Link segments to agenda items
            const linkResult = await linkSegmentsToAgendaItems(input.videoId);
            if (linkResult.errors > 0) {
                errors.push(`Failed to link ${linkResult.errors} segment batches`);
            }

            onProgress?.('Robert\'s Rules Parsing', input.segments.length, input.segments.length);
        }

        // ====================================================================
        // STEP 2: Vote Extraction
        // ====================================================================
        if (CONFIG.ENABLE_VOTE_EXTRACTION) {
            onProgress?.('Vote Extraction', 0, output.eventsDetected.length);

            // Get agenda boundaries with IDs
            const agendaItems = await getAgendaItemsByVideo(input.videoId);

            const agendaBoundaries = agendaItems.map(item => ({
                agendaItemId: item.id,
                startTimestamp: item.start_time ?? 0,
                endTimestamp: item.end_time ?? null,
                billId: item.bill_id
            }));

            // Convert segments to extractor format
            const extractorSegments = input.segments.map(s => ({
                id: String(s.id),
                text: s.text,
                start_time_seconds: s.start_time,
                speaker_id: s.speaker_id
            }));

            // Extract votes
            output.votesExtracted = extractAllVotes(
                output.eventsDetected,
                extractorSegments,
                agendaBoundaries
            );

            onProgress?.('Vote Extraction', output.eventsDetected.length, output.eventsDetected.length);
        }

        // ====================================================================
        // STEP 3: Key Quote Detection
        // ====================================================================
        if (CONFIG.ENABLE_QUOTE_DETECTION) {
            const total = input.segments.length;
            onProgress?.('Key Quote Detection', 0, total);

            // Convert segments to quote detector format
            const quoteSegments = input.segments.map(s => ({
                id: String(s.id),
                text: s.text,
                speaker_id: s.speaker_id
            }));

            // Detect quotes with sentiment analysis
            output.quotesDetected = await detectQuotesFromSegments(
                quoteSegments,
                async (text) => {
                    const result = await analyzeSegment(text);
                    return result.sentiment;
                },
                async (segmentId) => {
                    // Get primary issue from segment_issues
                    const { supabaseAdmin } = await import('@/lib/utils/supabase-admin');
                    const { data } = await supabaseAdmin
                        .from('segment_issues')
                        .select('issue_id')
                        .eq('segment_id', parseInt(segmentId))
                        .order('relevance_score', { ascending: false })
                        .limit(1)
                        .single();
                    return data?.issue_id ?? null;
                }
            );

            // Save quotes
            if (output.quotesDetected.length > 0) {
                const saveResult = await saveKeyQuotes(
                    output.quotesDetected,
                    CONFIG.AI_MODEL_VERSION
                );
                output.savedQuotes = saveResult.saved;

                if (saveResult.errors > 0) {
                    errors.push(`Failed to save ${saveResult.errors} quotes`);
                }
            }

            onProgress?.('Key Quote Detection', total, total);
        }

        // ====================================================================
        // STEP 4: Position Aggregation
        // ====================================================================
        if (CONFIG.ENABLE_POSITION_AGGREGATION) {
            onProgress?.('Position Aggregation', 0, output.votesExtracted.length);

            const allPositions: PositionAggregationResult[] = [];

            // Positions from votes
            for (const voteResult of output.votesExtracted) {
                for (const vote of voteResult.votes) {
                    if (voteResult.billId) {
                        allPositions.push(positionFromVote(
                            vote.legislatorId,
                            voteResult.billId,
                            voteResult.agendaItemId,
                            vote
                        ));
                    }
                }
            }

            // Positions from motions and seconds
            const motionSeconds = correlateMotionSecond(output.eventsDetected);
            for (const { motion, second } of motionSeconds) {
                if (motion.speakerId) {
                    // Find related bill
                    const agenda = await getAgendaItemAtTime(input.videoId, motion.timestampSeconds);

                    if (agenda?.bill_id) {
                        allPositions.push(positionFromMotion(
                            motion.speakerId,
                            agenda.bill_id,
                            agenda.id,
                            '',
                            motion.confidence
                        ));

                        if (second?.speakerId) {
                            allPositions.push(positionFromSecond(
                                second.speakerId,
                                agenda.bill_id,
                                agenda.id,
                                '',
                                second.confidence
                            ));
                        }
                    }
                }
            }

            // Positions from deliberation (grouped by legislator + bill)
            const deliberationGroups = new Map<string, Array<{ id: string; sentiment_score: number | null }>>();

            for (const segment of input.segments) {
                if (!segment.speaker_id) continue;

                const agenda = await getAgendaItemAtTime(input.videoId, segment.start_time);

                if (agenda?.bill_id) {
                    const key = `${segment.speaker_id}:${agenda.bill_id}`;
                    if (!deliberationGroups.has(key)) {
                        deliberationGroups.set(key, []);
                    }
                    deliberationGroups.get(key)!.push({
                        id: String(segment.id),
                        sentiment_score: null // Would need to look up from segment_issues
                    });
                }
            }

            for (const [key, segments] of deliberationGroups) {
                const [legislatorId, billId] = key.split(':');
                const position = positionFromDeliberation(legislatorId, billId, null, segments);
                if (position) {
                    allPositions.push(position);
                }
            }

            // Store all positions
            output.positionsAggregated = allPositions;

            // Save positions
            if (output.positionsAggregated.length > 0) {
                const saveResult = await savePositions(
                    output.positionsAggregated,
                    CONFIG.AI_MODEL_VERSION
                );
                output.savedPositions = saveResult.saved;

                if (saveResult.errors > 0) {
                    errors.push(`Failed to save ${saveResult.errors} positions`);
                }
            }

            onProgress?.('Position Aggregation', output.votesExtracted.length, output.votesExtracted.length);
        }

    } catch (error) {
        errors.push(`Pipeline error: ${error instanceof Error ? error.message : String(error)}`);
    }

    output.processingTimeMs = Date.now() - startTime;
    output.errors = errors;

    return output;
}

// ============================================================================
// EXPORTS
// ============================================================================

export function getConfig() {
    return { ...CONFIG };
}

export function updateConfig(updates: Partial<typeof CONFIG>) {
    Object.assign(CONFIG, updates);
}
