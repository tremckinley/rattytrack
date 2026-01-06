/**
 * Memphis City Council Document Scraper Script
 * 
 * Scrapes meeting documents from the Memphis City Council website,
 * extracts text from PDFs, and stores them in Supabase for AI context.
 * 
 * Usage: npx tsx scripts/scrape-council-documents.ts [--dry-run] [--limit N] [--reprocess]
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { scrapeAgendaPage, type ScrapedDocument, type DocumentType } from '../lib/data/agenda-scraper';
import {
    extractTextFromPdfUrl,
    isValidExtractedText,
    summarizeExtractedText
} from '../lib/utils/pdf-text-extractor';

// Environment validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isReprocess = args.includes('--reprocess');
const limitIndex = args.indexOf('--limit');
const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1]) : undefined;

interface MeetingDocument {
    id?: string;
    meeting_id?: string;
    meeting_date: string;
    document_type: DocumentType;
    title: string;
    source_url: string;
    file_size_bytes?: number;
    extracted_text?: string;
    text_extraction_status: 'pending' | 'completed' | 'failed';
    text_extraction_error?: string;
    page_count?: number;
    scraped_at: string;
    metadata?: Record<string, unknown>;
}

/**
 * Check if a document URL already exists in the database
 */
async function documentExists(sourceUrl: string): Promise<boolean> {
    const { data, error } = await supabase
        .from('meeting_documents')
        .select('id')
        .eq('source_url', sourceUrl)
        .maybeSingle();

    if (error) {
        console.error(`Error checking document existence: ${error.message}`);
        return false;
    }

    return data !== null;
}

/**
 * Insert a new document record
 */
async function insertDocument(doc: MeetingDocument): Promise<string | null> {
    const { data, error } = await supabase
        .from('meeting_documents')
        .insert(doc)
        .select('id')
        .single();

    if (error) {
        console.error(`Error inserting document: ${error.message}`);
        return null;
    }

    return data?.id || null;
}

/**
 * Update document with extracted text
 */
async function updateDocumentText(
    id: string,
    text: string,
    pageCount: number,
    fileSize: number
): Promise<boolean> {
    const { error } = await supabase
        .from('meeting_documents')
        .update({
            extracted_text: text,
            text_extraction_status: 'completed',
            page_count: pageCount,
            file_size_bytes: fileSize,
            updated_at: new Date().toISOString()
        })
        .eq('id', id);

    if (error) {
        console.error(`Error updating document text: ${error.message}`);
        return false;
    }

    return true;
}

/**
 * Mark document text extraction as failed
 */
async function markExtractionFailed(id: string, errorMessage: string): Promise<void> {
    const { error } = await supabase
        .from('meeting_documents')
        .update({
            text_extraction_status: 'failed',
            text_extraction_error: errorMessage,
            updated_at: new Date().toISOString()
        })
        .eq('id', id);

    if (error) {
        console.error(`Error marking extraction failed: ${error.message}`);
    }
}

/**
 * Get documents with pending or failed text extraction
 */
async function getDocumentsNeedingExtraction(limitCount?: number): Promise<Array<{
    id: string;
    title: string;
    source_url: string;
    document_type: string;
    meeting_date: string;
}>> {
    let query = supabase
        .from('meeting_documents')
        .select('id, title, source_url, document_type, meeting_date')
        .in('text_extraction_status', ['pending', 'failed'])
        .order('meeting_date', { ascending: false });

    if (limitCount && limitCount > 0) {
        query = query.limit(limitCount);
    }

    const { data, error } = await query;

    if (error) {
        console.error(`Error fetching documents: ${error.message}`);
        return [];
    }

    return data || [];
}

/**
 * Reprocess text extraction for existing document
 */
async function reprocessDocument(doc: {
    id: string;
    title: string;
    source_url: string;
}): Promise<boolean> {
    try {
        console.log(`  📄 Extracting text from PDF...`);
        const extracted = await extractTextFromPdfUrl(doc.source_url);

        if (isValidExtractedText(extracted.text)) {
            await updateDocumentText(doc.id, extracted.text, extracted.pageCount, extracted.fileSize);
            console.log(`  ✅ Text extracted: ${summarizeExtractedText(extracted.text)}`);
            return true;
        } else {
            await markExtractionFailed(doc.id, 'Extracted text did not pass validation');
            console.log(`  ⚠️ Text extraction produced invalid content`);
            return false;
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await markExtractionFailed(doc.id, errorMessage);
        console.log(`  ❌ Text extraction failed: ${errorMessage}`);
        return false;
    }
}

/**
 * Process a single document
 */
async function processDocument(doc: ScrapedDocument): Promise<{
    status: 'new' | 'exists' | 'error';
    extracted: boolean;
}> {
    // Check if already exists
    const exists = await documentExists(doc.url);
    if (exists) {
        return { status: 'exists', extracted: false };
    }

    if (isDryRun) {
        console.log(`  [DRY RUN] Would process: ${doc.title}`);
        return { status: 'new', extracted: false };
    }

    // Create document record
    const meetingDate = doc.meetingDate
        ? doc.meetingDate.toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0]; // Fallback to today

    const docRecord: MeetingDocument = {
        meeting_date: meetingDate,
        document_type: doc.documentType,
        title: doc.title,
        source_url: doc.url,
        text_extraction_status: 'pending',
        scraped_at: new Date().toISOString(),
        metadata: {
            rawLinkText: doc.rawLinkText
        }
    };

    const docId = await insertDocument(docRecord);
    if (!docId) {
        return { status: 'error', extracted: false };
    }

    console.log(`  ✅ Added document: ${doc.title}`);

    // Extract text from PDF
    try {
        console.log(`  📄 Extracting text from PDF...`);
        const extracted = await extractTextFromPdfUrl(doc.url);

        if (isValidExtractedText(extracted.text)) {
            await updateDocumentText(docId, extracted.text, extracted.pageCount, extracted.fileSize);
            console.log(`  ✅ Text extracted: ${summarizeExtractedText(extracted.text)}`);
            return { status: 'new', extracted: true };
        } else {
            await markExtractionFailed(docId, 'Extracted text did not pass validation');
            console.log(`  ⚠️ Text extraction produced invalid content`);
            return { status: 'new', extracted: false };
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await markExtractionFailed(docId, errorMessage);
        console.log(`  ❌ Text extraction failed: ${errorMessage}`);
        return { status: 'new', extracted: false };
    }
}

/**
 * Main scraping function
 */
async function main(): Promise<void> {
    console.log('🏛️ Memphis City Council Document Scraper');
    console.log('=========================================');
    console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}`);
    console.log(`Reprocess: ${isReprocess ? 'YES' : 'NO'}`);
    console.log(`Limit: ${limit || 'None'}`);
    console.log('');

    // If reprocess mode, just extract text from pending documents
    if (isReprocess) {
        console.log('📄 Finding documents needing text extraction...');
        const pendingDocs = await getDocumentsNeedingExtraction(limit);
        console.log(`Found ${pendingDocs.length} documents to reprocess\n`);

        let extracted = 0;
        for (const doc of pendingDocs) {
            console.log(`\n📄 ${doc.title}`);
            console.log(`   Type: ${doc.document_type}`);
            console.log(`   Date: ${doc.meeting_date}`);
            console.log(`   URL: ${doc.source_url}`);

            if (isDryRun) {
                console.log(`  [DRY RUN] Would extract text`);
            } else {
                const success = await reprocessDocument(doc);
                if (success) extracted++;
            }

            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log('\n📊 Summary');
        console.log('==========');
        console.log(`Documents processed: ${pendingDocs.length}`);
        console.log(`Text extracted:      ${extracted}`);
        return;
    }

    // Scrape the agenda page
    console.log('📥 Fetching agenda page...');
    let documents: ScrapedDocument[];

    try {
        documents = await scrapeAgendaPage();
    } catch (error) {
        console.error('❌ Failed to scrape agenda page:', error);
        process.exit(1);
    }

    console.log(`Found ${documents.length} documents on the page`);
    console.log('');

    // Apply limit if specified
    if (limit && limit > 0) {
        documents = documents.slice(0, limit);
        console.log(`Processing first ${limit} documents`);
    }

    // Process documents
    const stats = {
        total: documents.length,
        new: 0,
        exists: 0,
        errors: 0,
        extracted: 0
    };

    for (const doc of documents) {
        console.log(`\n📄 ${doc.title}`);
        console.log(`   Type: ${doc.documentType}`);
        console.log(`   Date: ${doc.meetingDate?.toLocaleDateString() || 'Unknown'}`);
        console.log(`   URL: ${doc.url}`);

        const result = await processDocument(doc);

        switch (result.status) {
            case 'new':
                stats.new++;
                break;
            case 'exists':
                stats.exists++;
                console.log(`  ⏭️ Already in database`);
                break;
            case 'error':
                stats.errors++;
                break;
        }

        if (result.extracted) {
            stats.extracted++;
        }

        // Small delay between requests to be nice to the server
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Summary
    console.log('\n');
    console.log('📊 Summary');
    console.log('==========');
    console.log(`Total documents:       ${stats.total}`);
    console.log(`New documents added:   ${stats.new}`);
    console.log(`Already existed:       ${stats.exists}`);
    console.log(`Errors:                ${stats.errors}`);
    console.log(`Text extracted:        ${stats.extracted}`);

    if (isDryRun) {
        console.log('\n⚠️ This was a dry run - no changes were made');
    }
}

// Run the script
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
