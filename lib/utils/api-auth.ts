import { createClient } from "@/lib/utils/supabase/server";
import { NextResponse } from "next/server";

/**
 * Validates the current user session for API routes.
 * Returns the authenticated user and a session-aware Supabase client.
 * Throws a NextResponse 401 if not authenticated.
 */
export async function requireAuth() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw NextResponse.json(
            { error: "Authentication required" },
            { status: 401 }
        );
    }

    return { user, supabase };
}

/**
 * Validates the current user is an authenticated admin for API routes.
 * Returns the authenticated user and a session-aware Supabase client.
 * Throws a NextResponse 401/403 if not authenticated or not admin.
 */
export async function requireAdminApi() {
    const { user, supabase } = await requireAuth();

    const { data: userData, error } = await supabase
        .from("users")
        .select("role")
        .eq("supabase_user_id", user.id)
        .single();

    if (error || userData?.role !== "admin") {
        throw NextResponse.json(
            { error: "Forbidden: Admin privileges required" },
            { status: 403 }
        );
    }

    return { user, supabase };
}
