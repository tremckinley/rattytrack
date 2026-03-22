import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/config';
import { updateSubscription, linkStripeCustomer } from '@/lib/data/subscriptions';
import Stripe from 'stripe';

// Disable body parsing — Stripe webhooks need the raw body
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = getStripe().webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const supabaseUserId = session.metadata?.supabase_user_id;
                const customerId = session.customer as string;

                if (supabaseUserId && customerId) {
                    await linkStripeCustomer(supabaseUserId, customerId);
                }

                if (customerId) {
                    await updateSubscription(customerId, {
                        tier: 'premium',
                        status: 'active',
                    });
                }
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;

                const tier = subscription.status === 'active' || subscription.status === 'trialing'
                    ? 'premium'
                    : 'free';

                await updateSubscription(customerId, {
                    tier,
                    status: subscription.status,
                    expiresAt: new Date((subscription as any).current_period_end * 1000).toISOString(),
                });
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;

                await updateSubscription(customerId, {
                    tier: 'free',
                    status: 'canceled',
                    expiresAt: new Date((subscription as any).current_period_end * 1000).toISOString(),
                });
                break;
            }

            default:
                console.log(`Unhandled Stripe event: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (err: any) {
        console.error('Webhook handler error:', err);
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
    }
}
