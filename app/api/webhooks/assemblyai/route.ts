import { NextRequest, NextResponse } from 'next/server';
import { 
    updateTranscriptionStatus, 
    saveTranscriptSegments,
    getTranscriptSegments
} from '@/lib/data/transcriptions';
import { AssemblyAI } from 'assemblyai';
import { formatSegments } from '@/lib/utils/assemblyai-client';
import { runIntelligencePipeline } from '@/lib/ai/intelligence-pipeline';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';

export const dynamic = 'force-dynamic';

const aai = new AssemblyAI({
    apiKey: process.env.ASSEMBLYAI_API_KEY || '',
});

export async function POST(request: NextRequest) {
    try {
        // Simple authentication check using the header we registered
        // If VERCEL_AUTOMATION_BYPASS_SECRET is used for deployment protection, AssemblyAI will send it as 'x-vercel-protection-bypass' instead of 'x-api-key'
        const authHeader = request.headers.get('x-api-key') || request.headers.get('x-vercel-protection-bypass');
        const expectedAuth = request.headers.has('x-vercel-protection-bypass') 
            ? process.env.VERCEL_AUTOMATION_BYPASS_SECRET 
            : process.env.ASSEMBLYAI_API_KEY;

        if (!authHeader || authHeader !== expectedAuth) {
            return NextResponse.json({ error: 'Unauthorized webhook' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const videoId = searchParams.get('videoId');
        const source = searchParams.get('source') || 'granicus';

        if (!videoId) {
            return NextResponse.json({ error: 'Missing videoId query param' }, { status: 400 });
        }

        const body = await request.json();
        const { transcript_id, status } = body;

        console.log(`[AssemblyAI Webhook] Received status '${status}' for transcript ${transcript_id} (videoId: ${videoId}, source: ${source})`);

        if (status === 'completed') {
            // Fetch the completed transcript data from AssemblyAI
            const transcriptData = await aai.transcripts.get(transcript_id);
            
            // Format AssemblyAI utterances into our internal format
            const segments = formatSegments(transcriptData.utterances || []);

            if (source === 'upload') {
                // Save to uploaded_meetings structure
                const dbSegments = segments.map((segment, index) => ({
                    uploaded_meeting_id: videoId,
                    segment_index: index,
                    start_time_seconds: segment.start,
                    end_time_seconds: segment.end,
                    text: segment.text,
                    speaker_id: null,
                    speaker_name: segment.speakerName
                }));

                await supabaseAdmin.from('uploaded_meeting_segments').insert(dbSegments);
                await supabaseAdmin.from('uploaded_meetings').update({
                    full_transcript: transcriptData.text,
                    video_duration_seconds: transcriptData.audio_duration,
                    transcription_status: 'completed',
                    processed_at: new Date().toISOString()
                }).eq('id', videoId);
                
                console.log(`[AssemblyAI Webhook] Fully processed direct upload ${videoId}`);
            } else {
                // Save to Granicus video_meetings structure
                await saveTranscriptSegments(videoId, segments, 0, 'assemblyai', true);
                await updateTranscriptionStatus(videoId, 'completed');

                // Fetch segments back to get their actual DB IDs for intelligence pipeline
                const dbSegments = await getTranscriptSegments(videoId);

                // Trigger the intelligence pipeline (summaries, agenda items, etc)
                // We only run this on granicus/live meetings right now.
                await runIntelligencePipeline({
                    videoId,
                    segments: dbSegments.map(s => ({
                        id: s.id,
                        text: s.text,
                        start_time: s.start_time,
                        end_time: s.end_time,
                        speaker_id: s.speaker_id,
                        speaker_name: s.speaker_name,
                        sentiment: (s as any).sentiment
                    }))
                });
                
                console.log(`[AssemblyAI Webhook] Fully processed granicus video ${videoId}`);
            }
        } else if (status === 'error') {
            await updateTranscriptionStatus(videoId, 'failed');
            console.error(`[AssemblyAI Webhook] Transcription failed for ${videoId}`);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[AssemblyAI Webhook] Handler error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
