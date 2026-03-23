import { NextRequest, NextResponse } from 'next/server';
import { 
    updateTranscriptionStatus, 
    saveTranscriptSegments,
    getTranscriptSegments
} from '@/lib/data/transcriptions';
import { AssemblyAI } from 'assemblyai';
import { formatSegments } from '@/lib/utils/assemblyai-client';
import { runIntelligencePipeline } from '@/lib/ai/intelligence-pipeline';

export const dynamic = 'force-dynamic';

const aai = new AssemblyAI({
    apiKey: process.env.ASSEMBLYAI_API_KEY || '',
});

export async function POST(request: NextRequest) {
    try {
        // Simple authentication check using the header we registered
        const authHeader = request.headers.get('x-api-key');
        if (authHeader !== process.env.ASSEMBLYAI_API_KEY) {
            return NextResponse.json({ error: 'Unauthorized webhook' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const videoId = searchParams.get('videoId');

        if (!videoId) {
            return NextResponse.json({ error: 'Missing videoId query param' }, { status: 400 });
        }

        const body = await request.json();
        const { transcript_id, status } = body;

        console.log(`[AssemblyAI Webhook] Received status '${status}' for transcript ${transcript_id} (videoId: ${videoId})`);

        if (status === 'completed') {
            // Fetch the completed transcript data from AssemblyAI
            const transcriptData = await aai.transcripts.get(transcript_id);
            
            // Format AssemblyAI utterances into our DB segment schema
            const segments = formatSegments(transcriptData.utterances || []);

            // Save to DB
            await saveTranscriptSegments(videoId, segments, 0, 'assemblyai', true);
            await updateTranscriptionStatus(videoId, 'completed');

            // Fetch segments back to get their actual DB IDs
            const dbSegments = await getTranscriptSegments(videoId);

            // Trigger the intelligence pipeline (summaries, agenda items, etc)
            await runIntelligencePipeline({
                videoId,
                segments: dbSegments.map(s => ({
                    id: s.id,
                    text: s.text,
                    start_time: s.start_time,
                    end_time: s.end_time,
                    speaker_id: s.speaker_id,
                    speaker_name: s.speaker_name
                }))
            });
            
            console.log(`[AssemblyAI Webhook] Fully processed video ${videoId}`);
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
