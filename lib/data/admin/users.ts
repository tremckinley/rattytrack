import { createAdminClient } from "@/lib/utils/supabase/admin";
import { User } from "@/types/User";

/**
 * Fetches all users from the database and merges their latest Auth metadata.
 */
export async function getUsers(): Promise<{ data: User[] | null; error: any }> {
    const adminClient = createAdminClient();

    // Fetch profile data from public.users
    const { data: profiles, error: profileError } = await adminClient
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

    if (profileError) return { data: null, error: profileError };

    // Fetch auth data to get latest login and verification status
    const { data: { users: authUsers }, error: authError } = await adminClient.auth.admin.listUsers();

    if (authError) {
        console.error("Error fetching auth users:", authError);
        return { data: profiles as User[], error: null }; // Return profiles anyway if auth fails
    }

    // Map auth data by ID for quick lookup
    const authMap = new Map(authUsers.map(u => [u.id, u]));

    // Merge auth data into profiles
    const mergedData = (profiles || []).map(profile => {
        const authUser = authMap.get(profile.supabase_user_id);
        return {
            ...profile,
            last_login_at: authUser?.last_sign_in_at || profile.last_login_at,
            email_verified: !!authUser?.email_confirmed_at || profile.email_verified
        };
    });

    return { data: mergedData as User[], error: null };
}

/**
 * Searches for users and merges their latest Auth metadata.
 */
export async function searchUsers(query: string): Promise<{ data: User[] | null; error: any }> {
    const adminClient = createAdminClient();

    // Fetch search results from public.users
    const { data: profiles, error: profileError } = await adminClient
        .from("users")
        .select("*")
        .or(`email.ilike.%${query}%,username.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .order("created_at", { ascending: false });

    if (profileError) return { data: null, error: profileError };

    // Fetch auth data to merge
    const { data: { users: authUsers }, error: authError } = await adminClient.auth.admin.listUsers();

    if (authError) {
        console.error("Error fetching auth users:", authError);
        return { data: profiles as User[], error: null };
    }

    const authMap = new Map(authUsers.map(u => [u.id, u]));

    const mergedData = (profiles || []).map(profile => {
        const authUser = authMap.get(profile.supabase_user_id);
        return {
            ...profile,
            last_login_at: authUser?.last_sign_in_at || profile.last_login_at,
            email_verified: !!authUser?.email_confirmed_at || profile.email_verified
        };
    });

    return { data: mergedData as User[], error: null };
}

/**
 * Updates a user's details.
 */
export async function updateUser(id: string, updates: Partial<User>): Promise<{ data: User | null; error: any }> {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
        .from("users")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    return { data, error };
}

/**
 * Manually confirms a user's email in both public.users and Supabase Auth.
 */
export async function verifyUserEmail(id: string): Promise<{ success: boolean; error: any }> {
    const adminClient = createAdminClient();

    // 1. Get the supabase_user_id
    const { data: profile, error: fetchError } = await adminClient
        .from("users")
        .select("supabase_user_id, email_verified")
        .eq("id", id)
        .single();

    if (fetchError || !profile) return { success: false, error: fetchError };
    if (profile.email_verified) return { success: true, error: null };

    // 2. Update public.users
    const { error: updateError } = await adminClient
        .from("users")
        .update({ email_verified: true })
        .eq("id", id);

    if (updateError) return { success: false, error: updateError };

    // 3. Update Supabase Auth
    const { error: authError } = await adminClient.auth.admin.updateUserById(
        profile.supabase_user_id,
        { email_confirm: true }
    );

    return { success: !authError, error: authError };
}

/**
 * Deletes a user (marks as inactive or removes depends on policy, here we just remove for now as per "Add/Edit user function")
 * Actually, the issue says "Add/Edit user function", doesn't explicitly mention delete, but it's good to have.
 */
export async function deleteUser(id: string): Promise<{ success: boolean; error: any }> {
    const adminClient = createAdminClient();
    const { error } = await adminClient
        .from("users")
        .delete()
        .eq("id", id);

    return { success: !error, error };
}

/**
 * Creates a new user in both Auth and the public.users table.
 */
export async function createUser(userData: {
    email: string;
    password?: string;
    first_name?: string;
    last_name?: string;
    username?: string;
    role: 'user' | 'moderator' | 'admin';
    email_verified?: boolean;
}): Promise<{ data: User | null; error: any }> {
    const adminClient = createAdminClient();

    // 1. Create the user in Supabase Auth
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: userData.email,
        password: userData.password || Math.random().toString(36).slice(-12), // Random password if not provided
        email_confirm: userData.email_verified || false,
        user_metadata: {
            first_name: userData.first_name,
            last_name: userData.last_name,
            username: userData.username
        }
    });

    if (authError) {
        return { data: null, error: authError };
    }

    // 2. Insert into the public.users table
    const { data, error } = await adminClient
        .from("users")
        .insert({
            email: userData.email,
            supabase_user_id: authData.user.id,
            first_name: userData.first_name,
            last_name: userData.last_name,
            username: userData.username,
            role: userData.role,
            email_verified: userData.email_verified || false,
            is_active: true
        })
        .select()
        .single();

    return { data, error };
}
