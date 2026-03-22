import { createClient } from '@/lib/utils/supabase/server';
import { getUserSubscription, isFeatureAllowed, type PremiumFeature } from '@/lib/data/subscriptions';
import UpgradeButton from '@/components/subscription/UpgradeButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock } from '@fortawesome/free-solid-svg-icons';

interface PaywallGateProps {
    feature: PremiumFeature;
    children: React.ReactNode;
    fallbackMessage?: string;
}

/**
 * Server component that conditionally renders premium content.
 * Free users see an upgrade prompt; premium users see the content.
 */
export default async function PaywallGate({
    feature,
    children,
    fallbackMessage = 'This feature requires a premium subscription.',
}: PaywallGateProps) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    const subscription = await getUserSubscription(user.id);
    const allowed = isFeatureAllowed(subscription.tier, feature, subscription.role);

    if (allowed) {
        return <>{children}</>;
    }

    return (
        <div className="border-2 border-dashed border-muted-foreground/30 p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-muted mb-4">
                <FontAwesomeIcon icon={faLock} className="text-muted-foreground text-xl" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Premium Feature</h3>
            <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
                {fallbackMessage}
            </p>
            <UpgradeButton />
        </div>
    );
}
