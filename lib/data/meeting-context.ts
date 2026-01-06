/**
 * Meeting Context Provider
 * Retrieves agenda documents and other context for AI-assisted transcription
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Document type priority for context building
 * Lower number = included first in context
 */
const DOCUMENT_PRIORITY: Record<string, number> = {
    'regular_agenda': 1,
    'committee_agenda': 2,
    'regular_docs': 3,
    'committee_docs': 4,
    'pz_regular_docs': 5,
    'pz_committee_docs': 6,
    'minutes': 7,
    'additional': 8
};

/**
 * Retrieved document with extracted text
 */
export interface MeetingDocument {
    id: string;
    title: string;
    documentType: string;
    meetingDate: string;
    extractedText: string;
    pageCount: number | null;
    sourceUrl: string;
}

/**
 * Get agenda context for a specific meeting date
 * Combines relevant documents into a context string for AI consumption
 * 
 * @param meetingDate - The date of the meeting
 * @param options - Configuration options
 * @returns Combined context string and metadata
 */
export async function getAgendaContext(
    meetingDate: Date,
    options: {
        maxCharacters?: number;
        documentTypes?: string[];
        includeAllDates?: boolean;
    } = {}
): Promise<{
    context: string;
    documents: MeetingDocument[];
    totalCharacters: number;
    truncated: boolean;
}> {
    const {
        maxCharacters = 50000, // ~12k tokens
        documentTypes,
        includeAllDates = false
    } = options;

    // Format date for query
    const dateStr = meetingDate.toISOString().split('T')[0];

    // Build query
    let query = supabase
        .from('meeting_documents')
        .select('id, title, document_type, meeting_date, extracted_text, page_count, source_url')
        .eq('text_extraction_status', 'completed')
        .not('extracted_text', 'is', null);

    // Filter by date unless including all
    if (!includeAllDates) {
        // Include documents from the same week (meeting might span multiple days)
        const weekStart = new Date(meetingDate);
        weekStart.setDate(weekStart.getDate() - 3);
        const weekEnd = new Date(meetingDate);
        weekEnd.setDate(weekEnd.getDate() + 3);

        query = query
            .gte('meeting_date', weekStart.toISOString().split('T')[0])
            .lte('meeting_date', weekEnd.toISOString().split('T')[0]);
    }

    // Filter by document types if specified
    if (documentTypes && documentTypes.length > 0) {
        query = query.in('document_type', documentTypes);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching meeting documents:', error);
        return {
            context: '',
            documents: [],
            totalCharacters: 0,
            truncated: false
        };
    }

    if (!data || data.length === 0) {
        return {
            context: '',
            documents: [],
            totalCharacters: 0,
            truncated: false
        };
    }

    // Sort by priority and date
    const sortedDocs = data.sort((a, b) => {
        const priorityA = DOCUMENT_PRIORITY[a.document_type] || 99;
        const priorityB = DOCUMENT_PRIORITY[b.document_type] || 99;
        if (priorityA !== priorityB) return priorityA - priorityB;

        // Within same type, prefer exact date match
        const dateA = new Date(a.meeting_date).getTime();
        const dateB = new Date(b.meeting_date).getTime();
        const targetDate = meetingDate.getTime();
        return Math.abs(dateA - targetDate) - Math.abs(dateB - targetDate);
    });

    // Build context string, respecting character limit
    let context = '';
    let totalCharacters = 0;
    let truncated = false;
    const includedDocs: MeetingDocument[] = [];

    for (const doc of sortedDocs) {
        const docHeader = `\n\n=== ${doc.title} (${doc.document_type}) ===\n`;
        const docText = doc.extracted_text || '';
        const docSection = docHeader + docText;

        if (totalCharacters + docSection.length > maxCharacters) {
            // Try to include at least partial content
            const remainingSpace = maxCharacters - totalCharacters - docHeader.length - 100;
            if (remainingSpace > 500) {
                context += docHeader + docText.substring(0, remainingSpace) + '\n\n[...truncated...]';
                truncated = true;
            }
            break;
        }

        context += docSection;
        totalCharacters += docSection.length;

        includedDocs.push({
            id: doc.id,
            title: doc.title,
            documentType: doc.document_type,
            meetingDate: doc.meeting_date,
            extractedText: doc.extracted_text || '',
            pageCount: doc.page_count,
            sourceUrl: doc.source_url
        });
    }

    return {
        context: context.trim(),
        documents: includedDocs,
        totalCharacters,
        truncated
    };
}

/**
 * Get just the agenda items for a meeting (simplified context)
 * Useful when you only need the agenda, not supporting documents
 */
export async function getAgendaItems(meetingDate: Date): Promise<string> {
    const result = await getAgendaContext(meetingDate, {
        documentTypes: ['regular_agenda', 'committee_agenda'],
        maxCharacters: 20000
    });

    return result.context;
}

/**
 * Check if we have context available for a meeting date
 */
export async function hasContextForDate(meetingDate: Date): Promise<boolean> {
    const dateStr = meetingDate.toISOString().split('T')[0];

    const { count, error } = await supabase
        .from('meeting_documents')
        .select('id', { count: 'exact', head: true })
        .eq('meeting_date', dateStr)
        .eq('text_extraction_status', 'completed');

    if (error) {
        console.error('Error checking context availability:', error);
        return false;
    }

    return (count || 0) > 0;
}

/**
 * Get available meeting dates with documents
 */
export async function getAvailableMeetingDates(): Promise<string[]> {
    const { data, error } = await supabase
        .from('meeting_documents')
        .select('meeting_date')
        .eq('text_extraction_status', 'completed')
        .order('meeting_date', { ascending: false });

    if (error || !data) {
        return [];
    }

    // Get unique dates
    const uniqueDates = [...new Set(data.map(d => d.meeting_date))];
    return uniqueDates;
}

/**
 * Format context for AI prompt injection
 * Wraps the context in appropriate markers for the AI to understand
 */
export function formatContextForPrompt(context: string): string {
    if (!context || context.trim().length === 0) {
        return '';
    }

    return `
<meeting_context>
The following is extracted text from official meeting documents (agendas, supporting documents) 
that provide context for this city council meeting. Use this information to:
- Identify agenda items being discussed
- Recognize references to resolutions, ordinances, and bill numbers
- Understand the context of votes and decisions
- Identify speakers when they reference specific agenda items

${context}
</meeting_context>
`.trim();
}
