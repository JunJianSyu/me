import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkHtml from 'remark-html';

/**
 * Convert Markdown content to HTML
 */
export async function markdownToHtml(markdown: string): Promise<string> {
  const result = await remark()
    .use(remarkGfm)
    .use(remarkHtml, { sanitize: false })
    .process(markdown);

  return result.toString();
}

/**
 * Strip Markdown syntax to get plain text
 */
export function stripMarkdown(markdown: string): string {
  return markdown
    // Remove headers
    .replace(/#{1,6}\s/g, '')
    // Remove bold/italic
    .replace(/\*\*|__/g, '')
    .replace(/\*|_/g, '')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code
    .replace(/`[^`]*`/g, '')
    // Remove links but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove images
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    // Remove blockquotes
    .replace(/^>\s?/gm, '')
    // Remove horizontal rules
    .replace(/^[-*_]{3,}\s*$/gm, '')
    // Remove list markers
    .replace(/^[\s]*[-*+]\s/gm, '')
    .replace(/^[\s]*\d+\.\s/gm, '')
    // Clean up whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
