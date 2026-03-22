import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/utils/supabase/server";
import { createAdminClient } from "@/lib/utils/supabase/admin";
import { requireAdmin } from "@/lib/utils/auth-utils";

// GET — Public: returns the current banner state
export async function GET() {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from("announcement_banner")
            .select("*")
            .eq("id", 1)
            .single();

        if (error) throw error;
        return NextResponse.json({ banner: data });
    } catch (error: any) {
        console.error("Error fetching banner:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch banner" },
            { status: 500 }
        );
    }
}

// PUT — Admin only: update banner settings
export async function PUT(request: NextRequest) {
    try {
        await requireAdmin();

        const body = await request.json();
        const { message, type, enabled } = body;

        // Validate type
        if (type && !["info", "warning"].includes(type)) {
            return NextResponse.json(
                { error: "Invalid banner type. Must be 'info' or 'warning'." },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from("announcement_banner")
            .update({
                ...(message !== undefined && { message }),
                ...(type !== undefined && { type }),
                ...(enabled !== undefined && { enabled }),
                updated_at: new Date().toISOString(),
            })
            .eq("id", 1)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ banner: data });
    } catch (error: any) {
        console.error("Error updating banner:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update banner" },
            { status: 500 }
        );
    }
}
