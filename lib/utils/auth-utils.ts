import { createClient } from "@/lib/utils/supabase/server";
import { redirect } from "next/navigation";

/**
 * Verifies if the current user is an admin.
 * Returns the user object and supabase client if successful.
 * If not an admin, it throws an error or redirects.
 */
export async function requireAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Authentication required");
    }

    const { data: userData, error } = await supabase
        .from("users")
        .select("role")
        .eq("supabase_user_id", user.id)
        .single();

    if (error || userData?.role !== "admin") {
        throw new Error("Unauthorized: Admin privileges required");
    }

    return { user, supabase };
}

/**
 * Checks if a user is an admin without throwing.
 */
export async function isAdmin() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return false;

        const { data: userData } = await supabase
            .from("users")
            .select("role")
            .eq("supabase_user_id", user.id)
            .single();

        return userData?.role === "admin";
    } catch {
        return false;
    }
}
