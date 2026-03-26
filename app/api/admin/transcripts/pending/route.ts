import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/utils/auth-utils";
import { createClient } from "@/lib/utils/supabase/server";

export async function GET() {
    try {
        await requireAdmin();
        const supabase = await createClient();

        // 1. Get all meetings
        const { data: meetings, error: meetingsError } = await supabase
            .from("meetings")
            .select("id, title, scheduled_start, video_id, transcription_status, analysis_status")
            .order("scheduled_start", { ascending: false });

        if (meetingsError) throw meetingsError;

        // 2. Get all completed transcriptions
        const { data: transcriptions, error: transError } = await supabase
            .from("video_transcriptions")
            .select("video_id, status");

        if (transError) throw transError;

        const completedVideoIds = new Set(
            transcriptions
                .filter((t) => t.status === "completed")
                .map((t) => t.video_id)
        );

        const processingVideoIds = new Set(
            transcriptions
                .filter((t) => t.status === "processing")
                .map((t) => t.video_id)
        );

        // 3. Filter meetings that don't have completed transcripts OR analyses
        const pendingMeetings = meetings.map((m) => {
            const hasTranscript = m.video_id && completedVideoIds.has(m.video_id);
            const isTranscribing = m.video_id && processingVideoIds.has(m.video_id);
            const transcription_status = hasTranscript ? "completed" : (isTranscribing ? "processing" : (m.transcription_status || "idle"));
            
            return {
                id: m.id,
                title: m.title,
                date: m.scheduled_start,
                videoId: m.video_id,
                transcriptionStatus: transcription_status,
                analysisStatus: m.analysis_status || "idle",
                // Combined status for legacy UI compatibility if needed, but we'll use specific ones
                status: transcription_status === "completed" && m.analysis_status === "completed" ? "completed" : "idle"
            };
        }).filter(m => m.transcriptionStatus !== "completed" || m.analysisStatus !== "completed");

        return NextResponse.json({ meetings: pendingMeetings });
    } catch (error: any) {
        console.error("Error in pending transcripts API:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: error.message?.includes("Unauthorized") ? 403 : 500 }
        );
    }
}
