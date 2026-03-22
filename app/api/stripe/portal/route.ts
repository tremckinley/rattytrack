import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/config';
import { requireAuth } from '@/lib/utils/api-auth';
import { getUserSubscription } from '@/lib/data/subscriptions';

export async function POST() {
    try {
        const { user } = await requireAuth();

        const subscription = await getUserSubscription(user.id);

        if (!subscription.stripeCustomerId) {
            return NextResponse.json(
                { error: 'No active subscription found' },
                { status: 400 }
            );
        }

        const session = await getStripe().billingPortal.sessions.create({
            customer: subscription.stripeCustomerId,
            return_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5000'}/`,
        });

        return NextResponse.json({ url: session.url });
    } catch (err: any) {
        if (err instanceof NextResponse) return err;
        console.error('Portal error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
