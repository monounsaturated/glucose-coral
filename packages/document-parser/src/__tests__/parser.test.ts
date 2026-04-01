import { describe, it, expect } from 'vitest';
import { extractDocumentText } from '../index';

describe('extractDocumentText', () => {
    it('extracts text from .txt files', async () => {
        const content = 'Hello world\nLine 2';
        const result = await extractDocumentText(content, 'notes.txt');
        expect(result.text).toBe(content);
        expect(result.fileType).toBe('txt');
    });

    it('extracts text from .md files', async () => {
        const content = '# Title\n\nSome content';
        const result = await extractDocumentText(Buffer.from(content), 'notes.md');
        expect(result.text).toBe(content);
        expect(result.fileType).toBe('md');
    });

    it('throws for unsupported file types', async () => {
        await expect(
            extractDocumentText('content', 'file.jpg')
        ).rejects.toThrow('Unsupported file type');
    });
});
