import { supabaseAdmin } from '@/lib/utils/supabase-admin';

export interface SystemHealthData {
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
        openai: { status: 'operational' | 'degraded' | 'down'; latencyMs: number };
        stripe: { status: 'operational' | 'degraded' | 'down' };
    };
    storage: {
        status: 'available' | 'error';
    };
}

async function countRows(table: string): Promise<number> {
    const { count, error } = await supabaseAdmin
        .from(table)
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error(`Error counting ${table}:`, error.message);
        return 0;
    }
    return count ?? 0;
}

/**
 * Check OpenAI API reachability by listing models (lightweight call).
 */
async function checkOpenAI(): Promise<{ status: 'operational' | 'degraded' | 'down'; latencyMs: number }> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return { status: 'down', latencyMs: 0 };

    const start = Date.now();
    try {
        const res = await fetch('https://api.openai.com/v1/models', {
            method: 'GET',
            headers: { Authorization: `Bearer ${apiKey}` },
            signal: AbortSignal.timeout(5000),
        });
        const latencyMs = Date.now() - start;

        if (res.ok) return { status: 'operational', latencyMs };
        return { status: 'degraded', latencyMs };
    } catch {
        return { status: 'down', latencyMs: Date.now() - start };
    }
}

/**
 * Gather all system health metrics.
 */
export async function getSystemHealth(): Promise<SystemHealthData> {
    const dbStart = Date.now();

    // Run all count queries in parallel
    const [meetings, transcriptions, segments, legislators, users, bills] = await Promise.all([
        countRows('meetings'),
        countRows('video_transcriptions'),
        countRows('transcription_segments'),
        countRows('legislators'),
        countRows('users'),
        countRows('bills'),
    ]);

    const dbLatency = Date.now() - dbStart;

    // Check external services in parallel
    const openai = await checkOpenAI();

    // Stripe is considered operational if the key is set
    const stripeStatus = process.env.STRIPE_SECRET_KEY ? 'operational' : 'down';

    return {
        database: {
            status: 'connected',
            latencyMs: dbLatency,
            counts: { meetings, transcriptions, segments, legislators, users, bills },
        },
        services: {
            openai,
            stripe: { status: stripeStatus as 'operational' | 'degraded' | 'down' },
        },
        storage: {
            status: 'available',
        },
    };
}
