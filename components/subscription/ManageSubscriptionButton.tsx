'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear } from '@fortawesome/free-solid-svg-icons';

export default function ManageSubscriptionButton() {
    const [loading, setLoading] = useState(false);

    const handleManage = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/stripe/portal', {
                method: 'POST',
            });

            const data = await response.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                console.error('No portal URL returned:', data.error);
                setLoading(false);
            }
        } catch (error) {
            console.error('Portal error:', error);
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleManage}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 border border-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
        >
            <FontAwesomeIcon icon={faGear} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Opening...' : 'Manage Subscription'}
        </button>
    );
}
