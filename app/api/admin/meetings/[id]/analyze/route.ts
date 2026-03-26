import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/utils/auth-utils";
import { createClient } from "@/lib/utils/supabase/server";
import { getTranscriptSegments } from "@/lib/data/transcriptions";
import { runIntelligencePipeline } from "@/lib/ai/intelligence-pipeline";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAdmin();
        const { id: meetingId } = await params;
        const supabase = await createClient();

        // 1. Get the meeting to find its video_id
        const { data: meeting, error: meetingError } = await supabase
            .from("meetings")
            .select("id, video_id, title")
            .eq("id", meetingId)
            .single();

        if (meetingError || !meeting) {
            return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
        }

        if (!meeting.video_id) {
            return NextResponse.json({ error: "Meeting has no associated video" }, { status: 400 });
        }

        // 2. Fetch transcript segments
        const segments = await getTranscriptSegments(meeting.video_id);
        
        if (!segments || segments.length === 0) {
            return NextResponse.json({ error: "No transcript segments found. Transcribe the video first." }, { status: 400 });
        }

        console.log(`[Manual Analysis] Starting intelligence pipeline for ${meeting.title} (${meeting.video_id})...`);

        // 3. Update status to 'processing'
        await supabase
            .from("meetings")
            .update({ analysis_status: "processing" })
            .eq("id", meetingId);

        // 4. Run the intelligence pipeline (orchestrates Robert's Rules, Votes, Quotes, etc.)
        const result = await runIntelligencePipeline({
            videoId: meeting.video_id,
            segments: segments.map(s => ({
                id: s.id,
                text: s.text,
                start_time: s.start_time,
                end_time: s.end_time,
                speaker_id: s.speaker_id,
                speaker_name: s.speaker_name
            }))
        });

        // 5. Update status to 'completed'
        await supabase
            .from("meetings")
            .update({ analysis_status: "completed" })
            .eq("id", meetingId);

        console.log(`[Manual Analysis] Successfully processed ${meeting.title}`);

        return NextResponse.json({ 
            success: true, 
            message: "Intelligence pipeline completed successfully",
            stats: {
                agendaItems: result.savedAgendaItems,
                quotes: result.savedQuotes,
                positions: result.savedPositions
            }
        });
    } catch (error: any) {
        console.error("Error in manual analysis API:", error);
        
        // Try to reset status on failure
        try {
            const { id: meetingId } = await params;
            const supabase = await createClient();
            await supabase
                .from("meetings")
                .update({ analysis_status: "error" })
                .eq("id", meetingId);
        } catch (e) {}

        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
