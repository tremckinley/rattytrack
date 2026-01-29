import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/utils/auth-utils";
import { getUsers, searchUsers, updateUser, createUser, verifyUserEmail } from "@/lib/data/admin/users";

export async function GET(request: NextRequest) {
    try {
        await requireAdmin();
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("query");

        if (query) {
            const { data, error } = await searchUsers(query);
            if (error) throw error;
            return NextResponse.json({ users: data });
        } else {
            const { data, error } = await getUsers();
            if (error) throw error;
            return NextResponse.json({ users: data });
        }
    } catch (error: any) {
        console.error("Error in users API:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        await requireAdmin();
        const body = await request.json();

        const { data, error } = await createUser(body);
        if (error) throw error;

        return NextResponse.json({ user: data });
    } catch (error: any) {
        console.error("Error creating user:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    try {
        await requireAdmin();
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        // Special handling for email verification to sync with Auth
        if (updates.email_verified === true) {
            const { error: verifyError } = await verifyUserEmail(id);
            if (verifyError) throw verifyError;

            // Remove from updates to avoid redundant DB call for this field specifically if needed
            // But updateUser handles Partial safely.
        }

        const { data, error } = await updateUser(id, updates);
        if (error) throw error;

        return NextResponse.json({ user: data });
    } catch (error: any) {
        console.error("Error updating user:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
