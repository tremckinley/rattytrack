'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faChevronLeft, faChevronRight, faXmark } from '@fortawesome/free-solid-svg-icons';

interface AuditLogEntry {
    id: string;
    user_email: string | null;
    action_type: string;
    table_name: string;
    record_id: string;
    old_values: Record<string, unknown> | null;
    new_values: Record<string, unknown> | null;
    created_at: string;
}

interface AuditLogResult {
    entries: AuditLogEntry[];
    total: number;
    page: number;
    pageSize: number;
}

const ACTION_COLORS: Record<string, string> = {
    INSERT: 'bg-green-100 text-green-700',
    UPDATE: 'bg-blue-100 text-blue-700',
    DELETE: 'bg-red-100 text-red-700',
};

export default function AuditLogViewer() {
    const [data, setData] = useState<AuditLogResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    // Filters
    const [actionType, setActionType] = useState('');
    const [tableName, setTableName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [page, setPage] = useState(1);

    async function fetchLogs() {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', page.toString());
            params.set('pageSize', '15');
            if (actionType) params.set('actionType', actionType);
            if (tableName) params.set('tableName', tableName);
            if (userEmail) params.set('userEmail', userEmail);

            const res = await fetch(`/api/admin/audit-log?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const result = await res.json();
            setData(result);
        } catch (err) {
            console.error('Audit log fetch error:', err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchLogs();
    }, [page, actionType, tableName]);

    const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

    const clearFilters = () => {
        setActionType('');
        setTableName('');
        setUserEmail('');
        setPage(1);
    };

    const hasActiveFilters = actionType || tableName || userEmail;

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h3 className="font-bold text-gray-900 border-none">Audit Log</h3>
                    {data && (
                        <span className="text-xs text-gray-400">{data.total} entries</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="text-xs text-capyred hover:underline font-medium flex items-center gap-1"
                        >
                            <FontAwesomeIcon icon={faXmark} className="text-xs" />
                            Clear
                        </button>
                    )}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`text-sm px-3 py-1 rounded-lg border transition-colors ${
                            showFilters ? 'bg-rose-50 border-capyred text-capyred' : 'border-gray-200 text-gray-600 hover:border-capyred'
                        }`}
                    >
                        <FontAwesomeIcon icon={faFilter} className="mr-1" />
                        Filters
                    </button>
                </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-3">
                    <select
                        value={actionType}
                        onChange={(e) => { setActionType(e.target.value); setPage(1); }}
                        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700"
                    >
                        <option value="">All Actions</option>
                        <option value="INSERT">INSERT</option>
                        <option value="UPDATE">UPDATE</option>
                        <option value="DELETE">DELETE</option>
                    </select>
                    <input
                        type="text"
                        placeholder="Filter by table..."
                        value={tableName}
                        onChange={(e) => { setTableName(e.target.value); setPage(1); }}
                        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 w-40"
                    />
                    <input
                        type="text"
                        placeholder="Filter by email..."
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); fetchLogs(); } }}
                        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 w-48"
                    />
                    <button
                        onClick={() => { setPage(1); fetchLogs(); }}
                        className="text-sm bg-capyred text-white px-4 py-1.5 rounded-lg hover:bg-rose-900 transition-colors font-bold"
                    >
                        Search
                    </button>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 text-gray-600 text-left">
                            <th className="px-4 py-3 font-semibold">Timestamp</th>
                            <th className="px-4 py-3 font-semibold">User</th>
                            <th className="px-4 py-3 font-semibold">Action</th>
                            <th className="px-4 py-3 font-semibold">Table</th>
                            <th className="px-4 py-3 font-semibold">Record ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && !data ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-28"></div></td>
                                </tr>
                            ))
                        ) : data?.entries.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                                    No audit log entries found.
                                </td>
                            </tr>
                        ) : (
                            data?.entries.map((entry) => (
                                <>
                                    <tr
                                        key={entry.id}
                                        onClick={() => setExpandedRow(expandedRow === entry.id ? null : entry.id)}
                                        className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                                    >
                                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                                            {new Date(entry.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700 text-xs truncate max-w-[150px]">
                                            {entry.user_email || '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${ACTION_COLORS[entry.action_type] || 'bg-gray-100 text-gray-600'}`}>
                                                {entry.action_type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-700 font-mono text-xs">
                                            {entry.table_name}
                                        </td>
                                        <td className="px-4 py-3 text-gray-400 font-mono text-xs truncate max-w-[180px]">
                                            {entry.record_id}
                                        </td>
                                    </tr>
                                    {expandedRow === entry.id && (
                                        <tr key={`${entry.id}-detail`} className="bg-gray-50">
                                            <td colSpan={5} className="px-4 py-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                                    {entry.old_values && (
                                                        <div>
                                                            <p className="font-bold text-gray-600 mb-1">Old Values</p>
                                                            <pre className="bg-white p-3 rounded border border-gray-200 overflow-x-auto text-gray-700 max-h-40">
                                                                {JSON.stringify(entry.old_values, null, 2)}
                                                            </pre>
                                                        </div>
                                                    )}
                                                    {entry.new_values && (
                                                        <div>
                                                            <p className="font-bold text-gray-600 mb-1">New Values</p>
                                                            <pre className="bg-white p-3 rounded border border-gray-200 overflow-x-auto text-gray-700 max-h-40">
                                                                {JSON.stringify(entry.new_values, null, 2)}
                                                            </pre>
                                                        </div>
                                                    )}
                                                    {!entry.old_values && !entry.new_values && (
                                                        <p className="text-gray-400">No value changes recorded.</p>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                        Page {page} of {totalPages}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="px-3 py-1 text-sm border border-gray-200 rounded-lg hover:border-capyred disabled:opacity-40 transition-colors"
                        >
                            <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="px-3 py-1 text-sm border border-gray-200 rounded-lg hover:border-capyred disabled:opacity-40 transition-colors"
                        >
                            <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
