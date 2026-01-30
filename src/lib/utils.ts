/**
 * Utility functions for the blog
 */

/**
 * Format a date string to a localized format
 */
export function formatDate(dateString: string, locale = 'zh-CN'): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Convert a string to a URL-safe slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\w\u4e00-\u9fa5-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Combine class names conditionally (similar to clsx/cn)
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Truncate text to a specified length
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + '...';
}

/**
 * Calculate reading time in minutes
 */
export function calculateReadingTime(text: string, wordsPerMinute = 200): number {
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

/**
 * Count words in text
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Generate excerpt from content
 */
export function generateExcerpt(content: string, maxLength = 150): string {
  // Remove markdown syntax
  const plainText = content
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*|__/g, '')
    .replace(/\*|_/g, '')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/>\s/g, '')
    .replace(/\n+/g, ' ')
    .trim();

  return truncate(plainText, maxLength);
}
