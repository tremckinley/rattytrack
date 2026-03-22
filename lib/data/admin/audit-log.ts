import { supabaseAdmin } from '@/lib/utils/supabase-admin';

export interface AuditLogEntry {
    id: string;
    user_id: string | null;
    user_email: string | null;
    action_type: string;
    table_name: string;
    record_id: string;
    old_values: Record<string, unknown> | null;
    new_values: Record<string, unknown> | null;
    created_at: string;
}

export interface AuditLogFilters {
    actionType?: string;
    tableName?: string;
    userEmail?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
}

export interface AuditLogResult {
    entries: AuditLogEntry[];
    total: number;
    page: number;
    pageSize: number;
}

/**
 * Fetch paginated audit logs with optional filters.
 */
export async function getAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLogResult> {
    const {
        actionType,
        tableName,
        userEmail,
        startDate,
        endDate,
        page = 1,
        pageSize = 25,
    } = filters;

    const offset = (page - 1) * pageSize;

    let query = supabaseAdmin
        .from('audit_log')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

    if (actionType) {
        query = query.eq('action_type', actionType);
    }
    if (tableName) {
        query = query.eq('table_name', tableName);
    }
    if (userEmail) {
        query = query.ilike('user_email', `%${userEmail}%`);
    }
    if (startDate) {
        query = query.gte('created_at', startDate);
    }
    if (endDate) {
        query = query.lte('created_at', endDate);
    }

    const { data, error, count } = await query;

    if (error) {
        console.error('Error fetching audit logs:', error);
        throw error;
    }

    return {
        entries: (data || []) as AuditLogEntry[],
        total: count ?? 0,
        page,
        pageSize,
    };
}

/**
 * Get the distinct action types and table names for filter dropdowns.
 */
export async function getAuditLogFilterOptions(): Promise<{
    actionTypes: string[];
    tableNames: string[];
}> {
    const [actionsRes, tablesRes] = await Promise.all([
        supabaseAdmin.from('audit_log').select('action_type').limit(100),
        supabaseAdmin.from('audit_log').select('table_name').limit(100),
    ]);

    const actionTypes = [...new Set((actionsRes.data || []).map((r: any) => r.action_type))].sort();
    const tableNames = [...new Set((tablesRes.data || []).map((r: any) => r.table_name))].sort();

    return { actionTypes, tableNames };
}
