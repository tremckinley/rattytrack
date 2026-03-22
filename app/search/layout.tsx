import PaywallGate from '@/components/subscription/PaywallGate';

export default function SearchLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <PaywallGate feature="transcript_search" fallbackMessage="Upgrade to Premium to search across all council meeting transcripts.">
            {children}
        </PaywallGate>
    );
}
