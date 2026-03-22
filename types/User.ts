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

    // Subscription fields
    subscription_tier: 'free' | 'premium';
    stripe_customer_id: string | null;
    subscription_status: 'inactive' | 'active' | 'past_due' | 'canceled' | 'trialing';
    subscription_expires_at: string | null;
}
