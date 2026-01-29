export interface User {
    id: string;
    email: string;
    username: string | null;
    supabase_user_id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    role: 'user' | 'moderator' | 'admin';
    is_active: boolean;
    email_verified: boolean;
    last_login_at: string | null;
    created_at: string;
    updated_at: string;
}
