import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/utils/auth-utils';
import { runScraperAgent } from '@/lib/ai/scraper-agent';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow Vercel up to 60s for the scraper

export async function POST(request: NextRequest) {
    try {
        await requireAdmin();

        const body = await request.json();
        const { targetUrl, prompt } = body;

        if (!targetUrl) {
            return NextResponse.json({ error: 'targetUrl is required' }, { status: 400 });
        }

        const extractionResult = await runScraperAgent({ targetUrl, prompt });

        return NextResponse.json({
            success: true,
            data: extractionResult
        });
    } catch (error: any) {
        console.error('[Admin Scrape API] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
