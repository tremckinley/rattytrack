import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/utils/api-auth';
import { getAuditLogs } from '@/lib/data/admin/audit-log';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        await requireAdminApi();

        const { searchParams } = new URL(request.url);

        const filters = {
            actionType: searchParams.get('actionType') || undefined,
            tableName: searchParams.get('tableName') || undefined,
            userEmail: searchParams.get('userEmail') || undefined,
            startDate: searchParams.get('startDate') || undefined,
            endDate: searchParams.get('endDate') || undefined,
            page: parseInt(searchParams.get('page') || '1'),
            pageSize: parseInt(searchParams.get('pageSize') || '25'),
        };

        const result = await getAuditLogs(filters);
        return NextResponse.json(result);
    } catch (error: any) {
        if (error?.message?.includes('Unauthorized') || error?.message?.includes('Admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        console.error('Audit log error:', error);
        return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
    }
}
