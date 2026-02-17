// Meeting Documents Section Component
// Displays links to agendas, minutes, and other meeting documents

import { MeetingDocument } from '@/lib/data/meetings';

interface MeetingDocumentsSectionProps {
    documents: MeetingDocument[];
    agendaUrl: string | null;
    minutesUrl: string | null;
}

// Document type display names and icons
const DOCUMENT_TYPE_INFO: Record<string, { label: string; icon: string }> = {
    'regular_agenda': { label: 'Regular Meeting Agenda', icon: '📋' },
    'regular_docs': { label: 'Regular Meeting Documents', icon: '📄' },
    'committee_agenda': { label: 'Committee Meeting Agenda', icon: '📋' },
    'committee_docs': { label: 'Committee Meeting Documents', icon: '📄' },
    'pz_regular_docs': { label: 'Planning & Zoning Documents', icon: '🏗️' },
    'pz_committee_docs': { label: 'P&Z Committee Documents', icon: '🏗️' },
    'minutes': { label: 'Meeting Minutes', icon: '📝' },
    'budget': { label: 'Budget Presentations', icon: '💰' },
    'additional': { label: 'Additional Documents', icon: '📎' },
};

export default function MeetingDocumentsSection({
    documents,
    agendaUrl,
    minutesUrl
}: MeetingDocumentsSectionProps) {
    // Combine scraped documents with direct URL links
    const hasContent = documents.length > 0 || agendaUrl || minutesUrl;

    if (!hasContent) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Meeting Documents</h3>
                <p className="text-gray-500 text-sm">No documents available for this meeting.</p>
            </div>
        );
    }

    // Group documents by type
    const documentsByType = documents.reduce((acc, doc) => {
        const type = doc.document_type || 'additional';
        if (!acc[type]) {
            acc[type] = [];
        }
        acc[type].push(doc);
        return acc;
    }, {} as Record<string, MeetingDocument[]>);

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Meeting Documents</h3>

            <div className="space-y-4">
                {/* Direct URLs from meeting record */}
                {agendaUrl && (
                    <DocumentLink
                        url={agendaUrl}
                        label="Agenda"
                        icon="📋"
                    />
                )}
                {minutesUrl && (
                    <DocumentLink
                        url={minutesUrl}
                        label="Minutes"
                        icon="📝"
                    />
                )}

                {/* Scraped documents grouped by type */}
                {Object.entries(documentsByType).map(([type, docs]) => {
                    const typeInfo = DOCUMENT_TYPE_INFO[type] || { label: type, icon: '📄' };

                    return (
                        <div key={type}>
                            <h4 className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                                <span>{typeInfo.icon}</span>
                                {typeInfo.label}
                            </h4>
                            <div className="space-y-2 pl-6">
                                {docs.map(doc => (
                                    <DocumentLink
                                        key={doc.id}
                                        url={doc.source_url}
                                        label={doc.title}
                                        size={doc.file_size_bytes}
                                        pageCount={doc.page_count}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

interface DocumentLinkProps {
    url: string;
    label: string;
    icon?: string;
    size?: number | null;
    pageCount?: number | null;
}

function DocumentLink({ url, label, icon, size, pageCount }: DocumentLinkProps) {
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline text-sm group"
        >
            {icon && <span>{icon}</span>}
            <span className="group-hover:underline">{label}</span>
            <span className="text-gray-400 text-xs">↗</span>
            {(size || pageCount) && (
                <span className="text-gray-400 text-xs">
                    {pageCount && `${pageCount} pages`}
                    {size && pageCount && ' • '}
                    {size && formatFileSize(size)}
                </span>
            )}
        </a>
    );
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
