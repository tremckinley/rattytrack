// API route for updating speaker-to-legislator mappings
// Updates all segments with a given speaker label to point to a legislator

import { NextRequest, NextResponse } from 'next/server';
import { updateSpeakerMapping } from '@/lib/data/youtube_transcriptions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoId, speakerLabel, legislatorId } = body;

    if (!videoId || !speakerLabel) {
      return NextResponse.json(
        { error: 'Missing required fields: videoId, speakerLabel' },
        { status: 400 }
      );
    }

    // Update speaker mapping (legislatorId can be null to unassign)
    const result = await updateSpeakerMapping(videoId, speakerLabel, legislatorId || null);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update speaker mapping' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in map-speaker API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
