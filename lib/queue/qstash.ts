import { Client } from '@upstash/qstash';

let qstashClient: Client | null = null;

export function getQStash(): Client | null {
    if (!process.env.QSTASH_TOKEN) {
        return null;
    }
    if (!qstashClient) {
        qstashClient = new Client({ token: process.env.QSTASH_TOKEN });
    }
    return qstashClient;
}

export type QueueEventParams = {
    url: string; // The fully qualified URL of the webhook receiver
    payload: any;
    delay?: number; // Delay in seconds
};

export async function publishQueueEvent({ url, payload, delay }: QueueEventParams) {
    const qstash = getQStash();
    const isLocalhost = url.includes('localhost') || url.includes('127.0.0.1') || url.includes('::1');

    if (!qstash || isLocalhost) {
        console.warn(`[QStash] Bypass: ${isLocalhost ? 'Localhost detected' : 'Token missing'}. Firing queue execution synchronously.`);
        // Fallback for local dev: fetch the URL interactively and strictly await it to prevent Next.js 15 context garbage collection
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-simulated-qstash': 'true' },
                body: JSON.stringify(payload)
            });
            const text = await res.text();
            console.log('[QStash Bypass Result]:', text);
        } catch (err: any) {
            console.error('[QStash Bypass Error]:', err.message);
        }
        
        return { messageId: 'simulated-' + Date.now() };
    }

    const res = await qstash.publishJSON({
        url,
        body: payload,
        delay,
    });

    console.log(`QStash published event to ${url}: ${res.messageId}`);
    return res;
}
