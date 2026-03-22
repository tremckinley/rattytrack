import { createClient } from '@/lib/utils/supabase/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';
import type { SubscriptionTier } from '@/lib/stripe/config';

export type PremiumFeature =
    | 'transcript_search'
    | 'ai_summaries'
    | 'legislator_deep_dive'
    | 'key_quotes'
    | 'voting_records'
    | 'sentiment_analysis';

const PREMIUM_FEATURES: Set<PremiumFeature> = new Set([
    'transcript_search',
    'ai_summaries',
    'legislator_deep_dive',
    'key_quotes',
    'voting_records',
    'sentiment_analysis',
]);

/**
 * Get the current user's subscription info.
 */
export async function getUserSubscription(supabaseUserId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('users')
        .select('subscription_tier, subscription_status, subscription_expires_at, stripe_customer_id, role')
        .eq('supabase_user_id', supabaseUserId)
        .single();

    if (error || !data) {
        return {
            tier: 'free' as SubscriptionTier,
            status: 'inactive' as const,
            expiresAt: null,
            stripeCustomerId: null,
            role: null,
        };
    }

    return {
        tier: (data.subscription_tier || 'free') as SubscriptionTier,
        status: data.subscription_status || 'inactive',
        expiresAt: data.subscription_expires_at,
        stripeCustomerId: data.stripe_customer_id,
        role: data.role,
    };
}

/**
 * Update a user's subscription after a Stripe webhook event.
 * Uses the admin client to bypass RLS.
 */
export async function updateSubscription(
    stripeCustomerId: string,
    updates: {
        tier: SubscriptionTier;
        status: string;
        expiresAt?: string | null;
    }
) {
    const { error } = await supabaseAdmin
        .from('users')
        .update({
            subscription_tier: updates.tier,
            subscription_status: updates.status,
            subscription_expires_at: updates.expiresAt || null,
        })
        .eq('stripe_customer_id', stripeCustomerId);

    if (error) {
        console.error('Error updating subscription:', error);
        throw error;
    }
}

/**
 * Link a Stripe customer ID to a user.
 */
export async function linkStripeCustomer(supabaseUserId: string, stripeCustomerId: string) {
    const { error } = await supabaseAdmin
        .from('users')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('supabase_user_id', supabaseUserId);

    if (error) {
        console.error('Error linking Stripe customer:', error);
        throw error;
    }
}

/**
 * Check if a specific feature is available for a user's subscription tier.
 */
export function isFeatureAllowed(tier: SubscriptionTier, feature: PremiumFeature, role?: string | null): boolean {
    if (role === 'admin') return true;
    if (tier === 'premium') return true;
    // Free tier only gets access to non-premium features
    return !PREMIUM_FEATURES.has(feature);
}
