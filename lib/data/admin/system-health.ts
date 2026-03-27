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
        anthropic: { status: 'operational' | 'degraded' | 'down'; latencyMs: number };
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
 * Check Anthropic API reachability.
 */
async function checkAnthropic(): Promise<{ status: 'operational' | 'degraded' | 'down'; latencyMs: number }> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return { status: 'down', latencyMs: 0 };

    const start = Date.now();
    try {
        // A simple GET request will inherently return a 404/405 from the Anthropic router 
        // if the network is up, taking <100ms and proving reachability.
        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'GET',
            headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
            signal: AbortSignal.timeout(5000),
        });
        const latencyMs = Date.now() - start;

        // 404 or 405 means the API router is online and rejecting the GET, which is expected.
        if (res.status === 404 || res.status === 405) return { status: 'operational', latencyMs };
        
        // If we get 401, the network is up but key might be invalid, we'll call it degraded.
        if (res.status === 401) return { status: 'degraded', latencyMs };
        
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
    const anthropic = await checkAnthropic();

    // Stripe is considered operational if the key is set
    const stripeStatus = process.env.STRIPE_SECRET_KEY ? 'operational' : 'down';

    return {
        database: {
            status: 'connected',
            latencyMs: dbLatency,
            counts: { meetings, transcriptions, segments, legislators, users, bills },
        },
        services: {
            anthropic,
            stripe: { status: stripeStatus as 'operational' | 'degraded' | 'down' },
        },
        storage: {
            status: 'available',
        },
    };
}
