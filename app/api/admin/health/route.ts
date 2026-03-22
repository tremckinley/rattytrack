import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/utils/api-auth';
import { getSystemHealth } from '@/lib/data/admin/system-health';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await requireAdminApi();
        const health = await getSystemHealth();
        return NextResponse.json(health);
    } catch (error: any) {
        if (error?.message?.includes('Unauthorized') || error?.message?.includes('Admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        console.error('Health check error:', error);
        return NextResponse.json({ error: 'Health check failed' }, { status: 500 });
    }
}
