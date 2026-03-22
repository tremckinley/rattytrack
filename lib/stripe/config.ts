import Stripe from 'stripe';

let _stripe: Stripe | null = null;

/**
 * Lazily initialized Stripe instance.
 * This prevents build-time crashes when STRIPE_SECRET_KEY is not yet configured.
 */
export function getStripe(): Stripe {
    if (!_stripe) {
        const key = process.env.STRIPE_SECRET_KEY;
        if (!key) {
            throw new Error(
                'STRIPE_SECRET_KEY is not set. Add it to your .env.local file.'
            );
        }
        _stripe = new Stripe(key, {
            typescript: true,
        });
    }
    return _stripe;
}

// Stripe price IDs — set these after creating products in the Stripe Dashboard
export const STRIPE_PRICES = {
    premium_monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY || '',
    premium_yearly: process.env.STRIPE_PRICE_PREMIUM_YEARLY || '',
} as const;

export const SUBSCRIPTION_TIERS = {
    free: 'free',
    premium: 'premium',
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;
