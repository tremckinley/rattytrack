'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faDatabase,
    faCloud,
    faCreditCard,
    faHardDrive,
    faCircle,
    faRotateRight,
    faGear,
} from '@fortawesome/free-solid-svg-icons';


interface SystemHealthData {
    database: {
        status: 'connected' | 'error';
        latencyMs: number;
        counts: {
            meetings: number;
            transcriptions: number;
            segments: number;
            legislators: number;
            users: number;
            bills: number;
        };
    };
    services: {
        anthropic: { status: 'operational' | 'degraded' | 'down'; latencyMs: number };
        stripe: { status: 'operational' | 'degraded' | 'down' };
    };
    storage: {
        status: 'available' | 'error';
    };
}

const STATUS_COLORS: Record<string, string> = {
    connected: 'text-green-500',
    operational: 'text-green-500',
    available: 'text-green-500',
    degraded: 'text-yellow-500',
    error: 'text-red-500',
    down: 'text-red-500',
};

const STATUS_BG: Record<string, string> = {
    connected: 'bg-green-100 text-green-700',
    operational: 'bg-green-100 text-green-700',
    available: 'bg-green-100 text-green-700',
    degraded: 'bg-yellow-100 text-yellow-700',
    error: 'bg-red-100 text-red-700',
    down: 'bg-red-100 text-red-700',
};

function StatusBadge({ status }: { status: string }) {
    return (
        <span className={`px-2 py-0.5 text-xs font-bold rounded-full capitalize ${STATUS_BG[status] || 'bg-gray-100 text-gray-600'}`}>
            <FontAwesomeIcon icon={faCircle} className={`text-[6px] mr-1 ${STATUS_COLORS[status] || 'text-gray-400'}`} />
            {status}
        </span>
    );
}

export default function SystemHealth() {
    const [health, setHealth] = useState<SystemHealthData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastFetched, setLastFetched] = useState<Date | null>(null);

    async function fetchHealth() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/health');
            if (!res.ok) throw new Error('Failed to fetch health data');
            const data = await res.json();
            setHealth(data);
            setLastFetched(new Date());
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchHealth();
    }, []);

    if (loading && !health) {
        return (
            <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error && !health) {
        return (
            <div className="bg-red-50 rounded-xl p-6 border border-red-200">
                <p className="text-red-700 font-bold">Health Check Failed</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
                <button
                    onClick={fetchHealth}
                    className="mt-3 text-sm text-capyred hover:underline font-bold"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!health) return null;

    const countItems = [
        { label: 'Meetings', value: health.database.counts.meetings },
        { label: 'Transcriptions', value: health.database.counts.transcriptions },
        { label: 'Segments', value: health.database.counts.segments },
        { label: 'Legislators', value: health.database.counts.legislators },
        { label: 'Users', value: health.database.counts.users },
        { label: 'Bills', value: health.database.counts.bills },
    ];

    return (
        <div className="space-y-6">
            {/* Services Status */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2 border-none">
                        <FontAwesomeIcon icon={faGear} className="text-lg" />
                        System Status
                    </h3>
                    <button
                        onClick={fetchHealth}
                        disabled={loading}
                        className="text-gray-400 hover:text-capyred transition-colors disabled:opacity-50"
                        title="Refresh"
                    >
                        <FontAwesomeIcon icon={faRotateRight} className={`text-sm ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                        <span className="text-sm text-gray-600 flex items-center gap-2">
                            <FontAwesomeIcon icon={faDatabase} className="text-blue-500 w-4" />
                            Database
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{health.database.latencyMs}ms</span>
                            <StatusBadge status={health.database.status} />
                        </div>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                        <span className="text-sm text-gray-600 flex items-center gap-2">
                            <FontAwesomeIcon icon={faCloud} className="text-purple-500 w-4" />
                            Anthropic
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{health.services.anthropic.latencyMs}ms</span>
                            <StatusBadge status={health.services.anthropic.status} />
                        </div>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                        <span className="text-sm text-gray-600 flex items-center gap-2">
                            <FontAwesomeIcon icon={faCreditCard} className="text-green-500 w-4" />
                            Stripe
                        </span>
                        <StatusBadge status={health.services.stripe.status} />
                    </div>
                    <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-600 flex items-center gap-2">
                            <FontAwesomeIcon icon={faHardDrive} className="text-orange-500 w-4" />
                            Storage
                        </span>
                        <StatusBadge status={health.storage.status} />
                    </div>
                </div>
                {lastFetched && (
                    <p className="text-[10px] text-gray-400 mt-3 text-right">
                        Last checked: {lastFetched.toLocaleTimeString()}
                    </p>
                )}
            </div>

            {/* Database Metrics */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4 border-none">Database Metrics</h3>
                <div className="grid grid-cols-2 gap-3">
                    {countItems.map((item) => (
                        <div key={item.label} className="bg-gray-50 rounded-lg p-3 text-center">
                            <p className="text-xl font-bold text-gray-900">{item.value.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">{item.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Admin Notice */}
            <div className="bg-rose-950 rounded-xl shadow-lg p-6 text-white">
                <h3 className="font-bold mb-2 border-none">Admin Notice</h3>
                <p className="text-sm text-rose-100 leading-relaxed">
                    Scripts executed here interact directly with production data and external APIs.
                    Please ensure you have verified any changes before running batch updates.
                </p>
            </div>
        </div>
    );
}
