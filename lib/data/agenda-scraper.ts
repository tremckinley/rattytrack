/**
 * Memphis City Council Agenda Scraper
 * Parses the Memphis City Council website to extract meeting document links
 */

import * as cheerio from 'cheerio';

// Base URL for the Memphis City Council agenda page
const AGENDA_PAGE_URL = 'https://memphistn.gov/city-council-meeting-agenda/';
const BASE_URL = 'https://memphistn.gov';

/**
 * Document type classification
 */
export type DocumentType =
    | 'regular_agenda'
    | 'regular_docs'
    | 'committee_agenda'
    | 'committee_docs'
    | 'pz_regular_docs'
    | 'pz_committee_docs'
    | 'minutes'
    | 'budget'
    | 'additional';

/**
 * Parsed document link from the agenda page
 */
export interface ScrapedDocument {
    title: string;
    url: string;
    documentType: DocumentType;
    meetingDate: Date | null;
    rawLinkText: string;
}

/**
 * Fetch and parse the Memphis City Council agenda page
 * @returns Array of scraped document links
 */
export async function scrapeAgendaPage(): Promise<ScrapedDocument[]> {
    console.log(`Fetching agenda page: ${AGENDA_PAGE_URL}`);

    const response = await fetch(AGENDA_PAGE_URL);

    if (!response.ok) {
        throw new Error(`Failed to fetch agenda page: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    return parseAgendaHtml(html);
}

/**
 * Parse HTML content to extract document links
 */
export function parseAgendaHtml(html: string): ScrapedDocument[] {
    const $ = cheerio.load(html);
    const documents: ScrapedDocument[] = [];

    // The page structure typically uses tables or divs with headers
    // Let's look for table rows first as that seems to be the current structure
    $('tr').each((_, row) => {
        const $row = $(row);
        const $tds = $row.find('td');

        if ($tds.length < 2) return;

        // Try to find a date in the first column
        const firstColText = $tds.first().text().trim();
        const rowDate = extractMeetingDate(firstColText, '');

        if (rowDate) {
            // Find all PDF links in this row
            $row.find('a[href*=".pdf"]').each((_, element) => {
                const $link = $(element);
                const href = $link.attr('href');
                const linkText = $link.text().trim();

                if (!href) return;

                const url = normalizeUrl(href);
                if (!url) return;

                // Skip duplicates
                if (documents.some(d => d.url === url)) return;

                // For these links, we trust the row date as the meeting date
                // unless it's a Minutes document which might have its own date
                let meetingDate = rowDate;
                if (linkText.toLowerCase().includes('minutes')) {
                    const minutesDate = extractMeetingDate(linkText, url);
                    if (minutesDate) meetingDate = minutesDate;
                }

                const documentType = classifyDocument(linkText, url);

                documents.push({
                    title: linkText || 'Unnamed Document',
                    url,
                    documentType,
                    meetingDate,
                    rawLinkText: linkText
                });
            });
        }
    });

    // Fallback for any PDF links not in a row with a date
    $('a[href*=".pdf"]').each((_, element) => {
        const $link = $(element);
        const href = $link.attr('href');
        const linkText = $link.text().trim();

        if (!href) return;

        const url = normalizeUrl(href);
        if (!url) return;

        // Skip if already found in row processing
        if (documents.some(d => d.url === url)) return;

        const meetingDate = extractMeetingDate(linkText, url);
        const documentType = classifyDocument(linkText, url);

        documents.push({
            title: linkText || 'Unnamed Document',
            url,
            documentType,
            meetingDate,
            rawLinkText: linkText
        });
    });

    console.log(`Found ${documents.length} document links`);
    return documents;
}

/**
 * Normalize URL to absolute path
 */
function normalizeUrl(href: string): string | null {
    try {
        if (href.startsWith('http')) {
            return href;
        }
        if (href.startsWith('/')) {
            return BASE_URL + href;
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Classify document type based on link text and URL
 */
function classifyDocument(linkText: string, url: string): DocumentType {
    const text = linkText.toLowerCase();
    const urlLower = url.toLowerCase();

    // Minutes
    if (text.includes('minutes')) {
        return 'minutes';
    }

    // Budget
    if (text.includes('budget')) {
        return 'budget';
    }

    // Planning & Zoning Committee
    if (text.includes('planning') && text.includes('zoning') && text.includes('committee')) {
        return 'pz_committee_docs';
    }

    // Planning & Zoning Regular
    if ((text.includes('planning') && text.includes('zoning')) || text.startsWith('pz-')) {
        return 'pz_regular_docs';
    }

    // Committee Agenda
    if (text.includes('committee') && text.includes('agenda')) {
        return 'committee_agenda';
    }

    // Committee Documents
    if (text.includes('committee') && (text.includes('document') || text.includes('docs'))) {
        return 'committee_docs';
    }

    // Regular Agenda
    if (text.includes('regular') && text.includes('agenda')) {
        return 'regular_agenda';
    }

    // Regular Documents
    if (text.includes('regular') && (text.includes('document') || text.includes('docs'))) {
        return 'regular_docs';
    }

    // Fallback checks based on URL patterns
    if (urlLower.includes('committee-agenda')) {
        return 'committee_agenda';
    }
    if (urlLower.includes('committee-docs') || urlLower.includes('committe-docs')) {
        return 'committee_docs';
    }
    if (urlLower.includes('regular-agenda')) {
        return 'regular_agenda';
    }
    if (urlLower.includes('regular-docs')) {
        return 'regular_docs';
    }
    if (urlLower.includes('minutes')) {
        return 'minutes';
    }

    // Default to additional for unclassified documents
    return 'additional';
}

/**
 * Extract meeting date from link text or URL
 */
function extractMeetingDate(linkText: string, url: string): Date | null {
    // Try to extract date from common patterns

    // Pattern: "7 Jan, 2025" or "21 Oct, 2025" or "January 13, 2026"
    const pattern1 = linkText.match(/(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*,?\s+(\d{4})/i);
    if (pattern1) {
        const [, day, month, year] = pattern1;
        return parseDate(day, month, year);
    }

    // Reverse Pattern: "January 13, 2026"
    const pattern1Rev = linkText.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[laryuubpchteocmbeh]*\s+(\d{1,2}),?\s+(\d{4})/i);
    if (pattern1Rev) {
        const [, month, day, year] = pattern1Rev;
        return parseDate(day, month, year);
    }

    // Pattern: "01-07-2025" or "12-16-2025" or "01.13.2026" in text
    const pattern2 = linkText.match(/(\d{1,2})[.-](\d{1,2})[.-](\d{4})/);
    if (pattern2) {
        const [, month, day, year] = pattern2;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    // Strip the uploads path to avoid false positives with YYYY/MM directories
    const filename = url.split('/').pop() || url;

    // Try to extract from filename: patterns like "01.07.2025" or "01-07-2025" or "1-7-2025"
    const urlPattern1 = filename.match(/(\d{1,2})[.-](\d{1,2})[.-](\d{4})/);
    if (urlPattern1) {
        const [, month, day, year] = urlPattern1;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    // Pattern for encoded dates in filenames like 11326 (Jan 13, 2026)
    // Only match if it's likely a date (M DD YY or MM DD YY)
    const urlPatternShort = filename.match(/[^\d]?(\d{1,2})(\d{2})(\d{2})[^\d]?/);
    if (urlPatternShort) {
        let [, month, day, yearShort] = urlPatternShort;
        // If first match group has 3 digits, it might be M DD or MM D?
        // But our regex says \d{1,2} \d{2} \d{2}

        const year = parseInt(yearShort) < 30 ? 2000 + parseInt(yearShort) : 1900 + parseInt(yearShort);
        const m = parseInt(month);
        const d = parseInt(day);

        // Basic validation: month 1-12, day 1-31
        if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
            return new Date(year, m - 1, d);
        }
    }

    // Fallback URL pattern: uploads/YYYY/MM/filename
    const urlPattern2 = url.match(/uploads\/(\d{4})\/(\d{2})\//);
    if (urlPattern2) {
        // Can't get exact day from this, use first of month
        const [, year, month] = urlPattern2;
        return new Date(parseInt(year), parseInt(month) - 1, 1);
    }

    return null;
}

/**
 * Parse date from components
 */
function parseDate(day: string, month: string, year: string): Date {
    const monthMap: Record<string, number> = {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
        jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };

    const monthNum = monthMap[month.toLowerCase().substring(0, 3)];
    return new Date(parseInt(year), monthNum, parseInt(day));
}

/**
 * Get documents for a specific date range
 */
export async function getDocumentsForDateRange(
    startDate: Date,
    endDate: Date
): Promise<ScrapedDocument[]> {
    const allDocs = await scrapeAgendaPage();

    return allDocs.filter(doc => {
        if (!doc.meetingDate) return false;
        return doc.meetingDate >= startDate && doc.meetingDate <= endDate;
    });
}

/**
 * Get the most recent documents (likely for upcoming meeting)
 */
export async function getMostRecentDocuments(limit: number = 10): Promise<ScrapedDocument[]> {
    const allDocs = await scrapeAgendaPage();

    // Sort by date descending, null dates last
    return allDocs
        .sort((a, b) => {
            if (!a.meetingDate && !b.meetingDate) return 0;
            if (!a.meetingDate) return 1;
            if (!b.meetingDate) return -1;
            return b.meetingDate.getTime() - a.meetingDate.getTime();
        })
        .slice(0, limit);
}
