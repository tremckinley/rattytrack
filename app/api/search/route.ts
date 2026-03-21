import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/utils/api-auth';

export async function GET(request: Request) {
    try {
        const { supabase } = await requireAuth();

        const { searchParams } = new URL(request.url);
        const q = searchParams.get('q');
        const speakerId = searchParams.get('speakerId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        if (!q) {
            return NextResponse.json({ results: [] });
        }

        // 1. Fetch segments matching the query
        let segmentsQuery = supabase
            .from('transcription_segments')
            .select('id, video_id, start_time, end_time, text, speaker_name, speaker_id')
            .ilike('text', `%${q}%`)
            .limit(100);

        if (speakerId) {
            segmentsQuery = segmentsQuery.eq('speaker_id', speakerId);
        }

        const { data: segments, error: segmentsError } = await segmentsQuery;

        if (segmentsError) {
            console.error('Segments fetch error:', segmentsError);
            return NextResponse.json({ error: segmentsError.message }, { status: 500 });
        }

        if (!segments || segments.length === 0) {
            return NextResponse.json({ results: [] });
        }

        // 2. Fetch meeting and transcription metadata for these videos
        const videoIds = Array.from(new Set(segments.map(s => s.video_id)));

        const [meetingsResponse, transcriptionsResponse] = await Promise.all([
            supabase
                .from('meetings')
                .select('id, video_id, title, scheduled_start')
                .in('video_id', videoIds),
            supabase
                .from('video_transcriptions')
                .select('video_id, thumbnail_url, published_at')
                .in('video_id', videoIds)
        ]);

        const meetingsMap = new Map();
        meetingsResponse.data?.forEach(m => meetingsMap.set(m.video_id, m));

        const transcriptionsMap = new Map();
        transcriptionsResponse.data?.forEach(t => transcriptionsMap.set(t.video_id, t));

        // 3. Format results, filtering by date if necessary
        let formattedResults = segments.map((segment: any) => {
            const meeting = meetingsMap.get(segment.video_id);
            const transcription = transcriptionsMap.get(segment.video_id);

            const publishedAt = transcription?.published_at || meeting?.scheduled_start;

            return {
                id: segment.id,
                meetingId: meeting?.id || segment.video_id,
                startTime: segment.start_time,
                endTime: segment.end_time,
                text: segment.text,
                speakerName: segment.speaker_name,
                speakerId: segment.speaker_id,
                meetingTitle: meeting?.title || 'Unknown Meeting',
                publishedAt: publishedAt,
                thumbnailUrl: transcription?.thumbnail_url
            };
        });

        // 4. Apply date filters if provided
        if (startDate) {
            const start = new Date(startDate).getTime();
            formattedResults = formattedResults.filter(r => r.publishedAt && new Date(r.publishedAt).getTime() >= start);
        }
        if (endDate) {
            const end = new Date(endDate).getTime();
            formattedResults = formattedResults.filter(r => r.publishedAt && new Date(r.publishedAt).getTime() <= end);
        }

        return NextResponse.json({ results: formattedResults });
    } catch (err: any) {
        // If it's a NextResponse (from requireAuth), return it directly
        if (err instanceof NextResponse) return err;
        console.error('Unexpected search error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
