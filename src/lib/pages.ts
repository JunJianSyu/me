import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { Page, PageFrontMatter } from '@/types';
import { markdownToHtml } from './markdown';

const pagesDirectory = path.join(process.cwd(), 'content/pages');

/**
 * Get a page by slug
 */
export async function getPageBySlug(slug: string): Promise<Page | null> {
  const fullPath = path.join(pagesDirectory, `${slug}.md`);

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);
  const frontMatter = data as PageFrontMatter;
  const html = await markdownToHtml(content);

  return {
    slug,
    frontMatter: {
      title: frontMatter.title || 'Untitled',
      description: frontMatter.description,
    },
    content,
    html,
  };
}

/**
 * Get all page slugs for static generation
 */
export function getAllPageSlugs(): string[] {
  if (!fs.existsSync(pagesDirectory)) {
    return [];
  }

  return fs
    .readdirSync(pagesDirectory)
    .filter((name) => name.endsWith('.md'))
    .map((name) => name.replace(/\.md$/, ''));
}
