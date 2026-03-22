import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/utils/api-auth';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';

export const dynamic = 'force-dynamic';

/**
 * GET: List meetings with transcriptions for QA review.
 */
export async function GET(request: NextRequest) {
    try {
        await requireAdminApi();

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'all';
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '20');
        const offset = (page - 1) * pageSize;

        // Get meetings that have transcriptions
        let query = supabaseAdmin
            .from('video_transcriptions')
            .select(`
                video_id,
                title,
                status,
                created_at,
                transcription_segments (count)
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + pageSize - 1);

        if (status !== 'all') {
            query = query.eq('status', status);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('QA list error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            transcriptions: data || [],
            total: count ?? 0,
            page,
            pageSize,
        });
    } catch (error: any) {
        if (error?.message?.includes('Unauthorized') || error?.message?.includes('Admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        return NextResponse.json({ error: 'Failed to fetch QA queue' }, { status: 500 });
    }
}

/**
 * PATCH: Update a transcript segment (text, speaker, reviewed status).
 */
export async function PATCH(request: NextRequest) {
    try {
        await requireAdminApi();

        const body = await request.json();
        const { segmentId, text, speakerName, speakerId, isReviewed } = body;

        if (!segmentId) {
            return NextResponse.json({ error: 'segmentId is required' }, { status: 400 });
        }

        const updates: Record<string, unknown> = {};
        if (text !== undefined) updates.text = text;
        if (speakerName !== undefined) updates.speaker_name = speakerName;
        if (speakerId !== undefined) updates.speaker_id = speakerId;
        if (isReviewed !== undefined) updates.is_reviewed = isReviewed;

        const { data, error } = await supabaseAdmin
            .from('transcription_segments')
            .update(updates)
            .eq('id', segmentId)
            .select()
            .single();

        if (error) {
            console.error('QA update error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ segment: data });
    } catch (error: any) {
        if (error?.message?.includes('Unauthorized') || error?.message?.includes('Admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        return NextResponse.json({ error: 'Failed to update segment' }, { status: 500 });
    }
}
