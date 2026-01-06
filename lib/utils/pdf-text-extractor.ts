/**
 * PDF Text Extractor
 * Extracts text content from PDF files for AI context
 */

import { PDFParse } from 'pdf-parse';

/**
 * Extract text from a PDF buffer
 * @param pdfBuffer - Buffer containing PDF data
 * @returns Extracted text and metadata
 */
export async function extractTextFromPdf(pdfBuffer: Buffer): Promise<{
    text: string;
    pageCount: number;
    info: Record<string, unknown>;
}> {

    try {
        const parser = new PDFParse({ data: pdfBuffer });
        const data = await parser.getText();

        return {
            text: cleanExtractedText(data.text),
            pageCount: data.total,
            info: {}
        };
    } catch (error) {
        console.error('PDF text extraction failed:', error);
        throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Extract text from a PDF URL
 * @param url - URL to the PDF file
 * @returns Extracted text and metadata
 */
export async function extractTextFromPdfUrl(url: string): Promise<{
    text: string;
    pageCount: number;
    fileSize: number;
    info: Record<string, unknown>;
}> {
    console.log(`Downloading PDF from: ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to download PDF: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileSize = buffer.length;

    console.log(`Downloaded ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

    const result = await extractTextFromPdf(buffer);

    return {
        ...result,
        fileSize
    };
}

/**
 * Clean extracted text for better AI consumption
 * - Normalize whitespace
 * - Remove excessive line breaks
 * - Clean up common PDF artifacts
 */
function cleanExtractedText(text: string): string {
    return text
        // Normalize line endings
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        // Remove multiple consecutive blank lines
        .replace(/\n{3,}/g, '\n\n')
        // Normalize multiple spaces
        .replace(/[ \t]+/g, ' ')
        // Remove leading/trailing whitespace from lines
        .split('\n')
        .map(line => line.trim())
        .join('\n')
        // Remove common PDF artifacts like page numbers at start of lines
        .replace(/^\d+\s*$/gm, '')
        // Remove form feed characters
        .replace(/\f/g, '\n')
        // Final trim
        .trim();
}

/**
 * Check if text extraction produced usable content
 * @param text - Extracted text to validate
 * @returns true if text appears valid
 */
export function isValidExtractedText(text: string): boolean {
    if (!text || text.trim().length < 50) {
        return false;
    }

    // Check if it's mostly readable characters (not garbled)
    const readableChars = text.match(/[a-zA-Z0-9\s.,;:!?'"()-]/g) || [];
    const ratio = readableChars.length / text.length;

    return ratio > 0.7; // At least 70% readable characters
}

/**
 * Summarize document for logging purposes
 */
export function summarizeExtractedText(text: string): string {
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const wordCount = text.split(/\s+/).length;
    const preview = text.substring(0, 200).replace(/\n/g, ' ').trim();

    return `${wordCount} words, ${lines.length} lines. Preview: "${preview}..."`;
}
