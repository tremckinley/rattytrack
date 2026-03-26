import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/utils/auth-utils";
import { createClient } from "@/lib/utils/supabase/server";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAdmin();
        const { id } = await params;
        const { videoId } = await request.json();

        if (!videoId) {
            return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
        }

        const supabase = await createClient();

        // Check if getting youtube URL vs ID
        let normalizedId = videoId;
        if (videoId.includes('youtube.com') || videoId.includes('youtu.be')) {
            const match = videoId.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?]+)/);
            if (match) normalizedId = match[1];
        }

        // Update the meeting with the new video ID
        const { data, error } = await supabase
            .from("meetings")
            .update({ 
                video_id: normalizedId,
                video_url: /^\d+$/.test(normalizedId) 
                    ? `https://memphis.granicus.com/MediaPlayer.php?view_id=6&clip_id=${normalizedId}`
                    : `https://www.youtube.com/watch?v=${normalizedId}`,
                video_platform: /^\d+$/.test(normalizedId) ? 'granicus' : 'youtube'
            })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("Error updating meeting video:", error);
            return NextResponse.json({ error: "Failed to update meeting video" }, { status: 500 });
        }

        return NextResponse.json({ success: true, meeting: data });
    } catch (error: any) {
        console.error("Error in update meeting video API:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: error.message?.includes("Unauthorized") ? 403 : 500 }
        );
    }
}
