'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCrown, faSpinner } from '@fortawesome/free-solid-svg-icons';

interface UpgradeButtonProps {
    label?: string;
    priceType?: 'monthly' | 'yearly';
    className?: string;
}

export default function UpgradeButton({
    label = 'Upgrade to Premium',
    priceType = 'monthly',
    className = '',
}: UpgradeButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleUpgrade = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceType }),
            });

            const data = await response.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                console.error('No checkout URL returned:', data.error);
                setLoading(false);
            }
        } catch (error) {
            console.error('Upgrade error:', error);
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleUpgrade}
            disabled={loading}
            className={`inline-flex items-center gap-2 px-6 py-2.5 bg-capyred text-white font-semibold hover:bg-rose-800 transition-colors disabled:opacity-50 ${className}`}
        >
            <FontAwesomeIcon icon={loading ? faSpinner : faCrown} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Redirecting...' : label}
        </button>
    );
}
