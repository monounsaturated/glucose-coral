import type { DocumentExtraction } from '@glucose/types';

/**
 * Extract text content from uploaded document files.
 * Supports .txt, .md, and text-based .pdf files.
 */
export async function extractDocumentText(
    content: Buffer | string,
    fileName: string,
): Promise<DocumentExtraction> {
    const ext = fileName.toLowerCase().split('.').pop() ?? '';

    if (ext === 'txt' || ext === 'md') {
        const text = typeof content === 'string' ? content : content.toString('utf-8');
        return {
            text,
            fileName,
            fileType: ext as 'txt' | 'md',
        };
    }

    if (ext === 'pdf') {
        return extractPdfText(content, fileName);
    }

    throw new Error(`Unsupported file type: .${ext}. Supported: .txt, .md, .pdf`);
}

async function extractPdfText(
    content: Buffer | string,
    fileName: string,
): Promise<DocumentExtraction> {
    // Dynamic import to keep pdf-parse optional for environments that don't need it
    let parsePdf: (dataBuffer: Buffer) => Promise<{ text: string; numpages: number }>;
    try {
        const pdfParseModule = await import('pdf-parse');
        parsePdf = (pdfParseModule as { default: (dataBuffer: Buffer) => Promise<{ text: string; numpages: number }> }).default;
    } catch {
        throw new Error(
            'PDF parsing requires the pdf-parse package. Install it with: npm install pdf-parse',
        );
    }

    const buffer = typeof content === 'string' ? Buffer.from(content, 'base64') : content;

    try {
        const data = await parsePdf(buffer);

        if (!data.text || data.text.trim().length === 0) {
            throw new Error(
                `The PDF "${fileName}" appears to contain no extractable text. ` +
                'This may be an image-based or scanned PDF. ' +
                'Please use a text-based PDF, or try .txt or .md format instead.',
            );
        }

        return {
            text: data.text,
            fileName,
            fileType: 'pdf',
            pageCount: data.numpages,
        };
    } catch (err) {
        if (err instanceof Error && err.message.includes('no extractable text')) {
            throw err;
        }
        throw new Error(`Failed to parse PDF "${fileName}": ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
}
