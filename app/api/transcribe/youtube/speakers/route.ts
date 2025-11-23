// API route for managing speaker mappings in YouTube transcriptions
// GET /api/transcribe/youtube/speakers?videoId=xxx - Get speaker labels
// PATCH /api/transcribe/youtube/speakers - Map speakers to legislators

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface SpeakerMapping {
  [speakerLabel: string]: string; // speaker label -> legislator UUID
}

interface SpeakerInfo {
  label: string;
  segmentCount: number;
  currentLegislatorId: string | null;
  currentLegislatorName: string | null;
}

/**
 * GET /api/transcribe/youtube/speakers?videoId=xxx
 * Get list of speaker labels and their current mappings
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
    // Get all segments with speaker labels for this video
    const { data: segments, error: segmentsError } = await supabase
      .from('youtube_transcript_segments')
      .select('speaker_name, speaker_id')
      .eq('video_id', videoId)
      .not('speaker_name', 'is', null);

    if (segmentsError) {
      throw segmentsError;
    }

    if (!segments || segments.length === 0) {
      return NextResponse.json({
        videoId,
        speakers: [],
        message: 'No speaker labels found for this video',
      });
    }

    // Group by speaker label and count segments
    const speakerMap = new Map<string, { count: number; speakerId: string | null }>();
    
    segments.forEach(seg => {
      const label = seg.speaker_name!;
      const existing = speakerMap.get(label);
      
      if (existing) {
        existing.count++;
        // Use the first non-null speaker_id we find
        if (seg.speaker_id && !existing.speakerId) {
          existing.speakerId = seg.speaker_id;
        }
      } else {
        speakerMap.set(label, {
          count: 1,
          speakerId: seg.speaker_id,
        });
      }
    });

    // Get legislator names for mapped speakers
    const mappedSpeakerIds = Array.from(speakerMap.values())
      .map(v => v.speakerId)
      .filter((id): id is string => !!id);

    const legislatorNames = new Map<string, string>();
    
    if (mappedSpeakerIds.length > 0) {
      const { data: legislators } = await supabase
        .from('legislators')
        .select('id, display_name')
        .in('id', mappedSpeakerIds);

      if (legislators) {
        legislators.forEach(leg => {
          legislatorNames.set(leg.id, leg.display_name);
        });
      }
    }

    // Build response
    const speakers: SpeakerInfo[] = Array.from(speakerMap.entries()).map(([label, info]) => ({
      label,
      segmentCount: info.count,
      currentLegislatorId: info.speakerId,
      currentLegislatorName: info.speakerId ? legislatorNames.get(info.speakerId) || null : null,
    }));

    // Sort by segment count (most active speakers first)
    speakers.sort((a, b) => b.segmentCount - a.segmentCount);

    return NextResponse.json({
      videoId,
      speakers,
      totalSpeakers: speakers.length,
      totalSegments: segments.length,
    });
  } catch (error) {
    console.error('Error fetching speaker labels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch speaker labels' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/transcribe/youtube/speakers
 * Update speaker-to-legislator mappings for a video
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoId, mappings } = body as {
      videoId: string;
      mappings: SpeakerMapping;
    };

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    if (!mappings || typeof mappings !== 'object') {
      return NextResponse.json(
        { error: 'Mappings object is required' },
        { status: 400 }
      );
    }

    // Validate that all unique legislator IDs exist
    const legislatorIds = Object.values(mappings).filter(id => id !== null);
    const uniqueLegislatorIds = [...new Set(legislatorIds)];
    
    if (uniqueLegislatorIds.length > 0) {
      const { data: legislators, error: validationError } = await supabase
        .from('legislators')
        .select('id')
        .in('id', uniqueLegislatorIds);

      if (validationError) {
        throw validationError;
      }

      if (!legislators || legislators.length !== uniqueLegislatorIds.length) {
        return NextResponse.json(
          { error: 'One or more legislator IDs are invalid' },
          { status: 400 }
        );
      }
    }

    // Apply mappings one by one
    const results: Array<{ label: string; success: boolean; segmentsUpdated?: number; error?: string }> = [];

    for (const [speakerLabel, legislatorId] of Object.entries(mappings)) {
      try {
        const { data, error, count } = await supabase
          .from('youtube_transcript_segments')
          .update({ speaker_id: legislatorId || null }, { count: 'exact' })
          .eq('video_id', videoId)
          .eq('speaker_name', speakerLabel)
          .select();

        if (error) {
          results.push({
            label: speakerLabel,
            success: false,
            error: error.message,
          });
        } else {
          results.push({
            label: speakerLabel,
            success: true,
            segmentsUpdated: count || 0,
          });
        }
      } catch (err) {
        results.push({
          label: speakerLabel,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      message: `Updated ${successCount} speaker mapping(s)`,
      videoId,
      results,
      summary: {
        total: results.length,
        success: successCount,
        failed: failureCount,
      },
    });
  } catch (error) {
    console.error('Error updating speaker mappings:', error);
    return NextResponse.json(
      { error: 'Failed to update speaker mappings' },
      { status: 500 }
    );
  }
}
