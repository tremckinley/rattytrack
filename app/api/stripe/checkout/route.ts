import { NextResponse } from 'next/server';
import { getStripe, STRIPE_PRICES } from '@/lib/stripe/config';
import { requireAuth } from '@/lib/utils/api-auth';
import { getUserSubscription, linkStripeCustomer } from '@/lib/data/subscriptions';

export async function POST(request: Request) {
    try {
        const { user } = await requireAuth();
        const { priceType = 'monthly' } = await request.json();

        const priceId = priceType === 'yearly'
            ? STRIPE_PRICES.premium_yearly
            : STRIPE_PRICES.premium_monthly;

        if (!priceId) {
            return NextResponse.json(
                { error: 'Stripe price not configured. Please set STRIPE_PRICE_PREMIUM_MONTHLY in env.' },
                { status: 500 }
            );
        }

        // Check if user already has a Stripe customer ID
        const subscription = await getUserSubscription(user.id);
        let customerId = subscription.stripeCustomerId;

        // Create a new Stripe customer if needed
        if (!customerId) {
            const customer = await getStripe().customers.create({
                email: user.email!,
                metadata: {
                    supabase_user_id: user.id,
                },
            });
            customerId = customer.id;
            await linkStripeCustomer(user.id, customerId);
        }

        // Create checkout session
        const session = await getStripe().checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5000'}/?upgraded=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5000'}/?canceled=true`,
            metadata: {
                supabase_user_id: user.id,
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (err: any) {
        if (err instanceof NextResponse) return err;
        console.error('Checkout error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
