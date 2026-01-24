// API route for getting speaker suggestions for a video
// GET /api/transcripts/suggest-speakers?videoId=xxx

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { suggestSpeakerMatches, TranscriptSegment, SpeakerSuggestion } from '@/lib/utils/speaker-matcher';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface SuggestionResponse {
    videoId: string;
    suggestions: Record<string, SpeakerSuggestion>;
    speakerStats: Array<{
        label: string;
        segmentCount: number;
        totalDuration: number;
        sampleText: string;
        currentLegislatorId: string | null;
        suggestion: SpeakerSuggestion | null;
    }>;
}

/**
 * GET /api/transcripts/suggest-speakers?videoId=xxx
 * Returns speaker suggestions based on learned patterns and transcript analysis
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
        return NextResponse.json(
            { error: 'Video ID is required' },
            { status: 400 }
        );
    }

    try {
        // Fetch transcript segments for this video
        const { data: segments, error: segmentsError } = await supabase
            .from('transcription_segments')
            .select('id, speaker_name, speaker_id, text, start_time, end_time')
            .eq('video_id', videoId)
            .order('start_time', { ascending: true });

        if (segmentsError) {
            throw segmentsError;
        }

        if (!segments || segments.length === 0) {
            return NextResponse.json({
                videoId,
                suggestions: {},
                speakerStats: [],
                message: 'No segments found for this video',
            });
        }

        // Convert to TranscriptSegment format
        const transcriptSegments: TranscriptSegment[] = segments.map(seg => ({
            speaker: seg.speaker_name || undefined,
            text: seg.text,
            start: seg.start_time,
            end: seg.end_time,
        }));

        // Get suggestions using the enhanced matcher
        const suggestionsMap = await suggestSpeakerMatches(transcriptSegments);

        // Build speaker stats
        const speakerData = new Map<string, {
            count: number;
            duration: number;
            texts: string[];
            currentLegislatorId: string | null;
        }>();

        segments.forEach(seg => {
            if (!seg.speaker_name) return;

            const existing = speakerData.get(seg.speaker_name) || {
                count: 0,
                duration: 0,
                texts: [],
                currentLegislatorId: null,
            };

            existing.count++;
            existing.duration += (seg.end_time || 0) - (seg.start_time || 0);

            // Keep first few text samples
            if (existing.texts.length < 3) {
                existing.texts.push(seg.text.substring(0, 100));
            }

            if (seg.speaker_id && !existing.currentLegislatorId) {
                existing.currentLegislatorId = seg.speaker_id;
            }

            speakerData.set(seg.speaker_name, existing);
        });

        // Build response
        const speakerStats = Array.from(speakerData.entries()).map(([label, data]) => ({
            label,
            segmentCount: data.count,
            totalDuration: Math.round(data.duration),
            sampleText: data.texts.join(' | '),
            currentLegislatorId: data.currentLegislatorId,
            suggestion: suggestionsMap.get(label) || null,
        }));

        // Sort by segment count (most active first)
        speakerStats.sort((a, b) => b.segmentCount - a.segmentCount);

        // Convert suggestions map to object for JSON
        const suggestionsObject: Record<string, SpeakerSuggestion> = {};
        suggestionsMap.forEach((value, key) => {
            suggestionsObject[key] = value;
        });

        const response: SuggestionResponse = {
            videoId,
            suggestions: suggestionsObject,
            speakerStats,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error fetching speaker suggestions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch speaker suggestions' },
            { status: 500 }
        );
    }
}
