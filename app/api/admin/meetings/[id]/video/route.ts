import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/utils/auth-utils";
import { supabaseAdmin as supabase } from "@/lib/utils/supabase-admin";

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

        // Update the meeting with the new Granicus video ID
        const normalizedId = videoId.trim();
        const { data, error } = await supabase
            .from("meetings")
            .update({ 
                video_id: normalizedId,
                video_url: `https://memphis.granicus.com/MediaPlayer.php?view_id=6&clip_id=${normalizedId}`,
                video_platform: 'granicus'
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
