"use server";

import { createClient } from "@/lib/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
    const supabase = await createClient();

    const data = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
    };

    const { error } = await supabase.auth.signInWithPassword(data);

    if (error) {
        redirect("/login?error=" + encodeURIComponent(error.message));
    }

    revalidatePath("/", "layout");
    redirect("/");
}

export async function signup(formData: FormData) {
    const supabase = await createClient();

    const data = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
    };

    const { error } = await supabase.auth.signUp(data);

    if (error) {
        redirect("/signup?error=" + encodeURIComponent(error.message));
    }

    revalidatePath("/", "layout");
    redirect("/login?message=Check your email to continue the registration process.");
}

export async function signOut() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath("/", "layout");
    redirect("/");
}

export async function resetPasswordForEmail(formData: FormData) {
    const supabase = await createClient();
    const email = formData.get("email") as string;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5000'}/auth/update-password`,
    });

    if (error) {
        redirect("/login?error=" + encodeURIComponent(error.message));
    }

    redirect("/login?message=Check your email for the password reset link.");
}

export async function updatePassword(formData: FormData) {
    const supabase = await createClient();
    const password = formData.get("password") as string;

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
        redirect("/auth/update-password?error=" + encodeURIComponent(error.message));
    }

    redirect("/login?message=Password updated successfully. You can now sign in.");
}

export async function getIsAdminAction() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return false;

    const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("supabase_user_id", user.id)
        .maybeSingle();

    if (error) {
        console.error("Action error fetching role:", error);
        return false;
    }

    return data?.role === "admin";
}
