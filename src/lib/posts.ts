import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import {
  Post,
  PostListItem,
  PostFrontMatter,
  Category,
  Tag,
  SeriesItem,
  SeriesFrontMatter,
  Series,
  Chapter,
  ChapterItem,
  ContentItem,
} from '@/types';
import { calculateReadingTime, countWords, generateExcerpt, slugify } from './utils';
import { markdownToHtml } from './markdown';

const postsDirectory = path.join(process.cwd(), 'content/posts');

/**
 * Extract order number from filename (e.g., "01-introduction.md" -> 1)
 */
function extractOrder(filename: string): number {
  const match = filename.match(/^(\d+)-/);
  return match ? parseInt(match[1], 10) : 999;
}

/**
 * Check if a path is a directory (series)
 */
function isDirectory(itemPath: string): boolean {
  return fs.existsSync(itemPath) && fs.statSync(itemPath).isDirectory();
}

/**
 * Get all single posts (not series)
 */
export function getAllPosts(): PostListItem[] {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const items = fs.readdirSync(postsDirectory);

  const posts = items
    .filter((name) => name.endsWith('.md'))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, '');
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContents);

      const frontMatter = data as PostFrontMatter;

      // Skip drafts
      if (frontMatter.draft) {
        return null;
      }

      return {
        slug,
        title: frontMatter.title || 'Untitled',
        date: frontMatter.date || new Date().toISOString().split('T')[0],
        category: frontMatter.category || 'Uncategorized',
        tags: frontMatter.tags || [],
        excerpt: frontMatter.excerpt || generateExcerpt(content),
        featured: frontMatter.featured || false,
        cover: frontMatter.cover,
        readingTime: calculateReadingTime(content),
        isSeries: false as const,
      };
    })
    .filter((post): post is NonNullable<typeof post> => post !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return posts;
}

/**
 * Get all series
 */
export function getAllSeries(): SeriesItem[] {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const items = fs.readdirSync(postsDirectory);

  const series = items
    .filter((name) => {
      const itemPath = path.join(postsDirectory, name);
      return isDirectory(itemPath);
    })
    .map((dirName) => {
      const seriesPath = path.join(postsDirectory, dirName);
      const indexPath = path.join(seriesPath, 'index.md');

      // Read series metadata from index.md
      let frontMatter: SeriesFrontMatter = {
        title: dirName,
        date: new Date().toISOString().split('T')[0],
        category: 'Uncategorized',
        tags: [],
      };

      if (fs.existsSync(indexPath)) {
        const fileContents = fs.readFileSync(indexPath, 'utf8');
        const { data } = matter(fileContents);
        frontMatter = {
          title: data.title || dirName,
          date: data.date || new Date().toISOString().split('T')[0],
          updated: data.updated,
          category: data.category || 'Uncategorized',
          tags: data.tags || [],
          description: data.description || data.excerpt,
          draft: data.draft,
          cover: data.cover,
        };
      }

      // Skip drafts
      if (frontMatter.draft) {
        return null;
      }

      // Get chapters
      const chapters = getChaptersForSeries(dirName);

      // If no chapters, skip this series
      if (chapters.length === 0) {
        return null;
      }

      return {
        slug: dirName,
        title: frontMatter.title,
        description: frontMatter.description,
        date: frontMatter.date,
        category: frontMatter.category,
        tags: frontMatter.tags,
        chapters,
        cover: frontMatter.cover,
        isSeries: true as const,
      };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return series;
}

/**
 * Get chapters for a series
 */
function getChaptersForSeries(seriesSlug: string): ChapterItem[] {
  const seriesPath = path.join(postsDirectory, seriesSlug);

  if (!fs.existsSync(seriesPath)) {
    return [];
  }

  const files = fs.readdirSync(seriesPath);

  return files
    .filter((name) => name.endsWith('.md') && name !== 'index.md')
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, '');
      const fullPath = path.join(seriesPath, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data } = matter(fileContents);

      return {
        slug,
        title: data.title || slug,
        order: extractOrder(fileName),
      };
    })
    .sort((a, b) => a.order - b.order);
}

/**
 * Get all content items (posts + series) sorted by date
 */
export function getAllContentItems(): ContentItem[] {
  const posts = getAllPosts();
  const series = getAllSeries();

  const allItems: ContentItem[] = [...posts, ...series];

  return allItems.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

/**
 * Get a single post by slug
 */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const fullPath = path.join(postsDirectory, `${slug}.md`);

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);
  const frontMatter = data as PostFrontMatter;

  const html = await markdownToHtml(content);

  return {
    slug,
    frontMatter: {
      title: frontMatter.title || 'Untitled',
      date: frontMatter.date || new Date().toISOString().split('T')[0],
      updated: frontMatter.updated,
      category: frontMatter.category || 'Uncategorized',
      tags: frontMatter.tags || [],
      excerpt: frontMatter.excerpt || generateExcerpt(content),
      featured: frontMatter.featured || false,
      draft: frontMatter.draft || false,
      cover: frontMatter.cover,
    },
    content,
    html,
    readingTime: calculateReadingTime(content),
    wordCount: countWords(content),
  };
}

/**
 * Get series by slug
 */
export async function getSeriesBySlug(slug: string): Promise<Series | null> {
  const seriesPath = path.join(postsDirectory, slug);

  if (!fs.existsSync(seriesPath) || !isDirectory(seriesPath)) {
    return null;
  }

  const indexPath = path.join(seriesPath, 'index.md');

  let frontMatter: SeriesFrontMatter = {
    title: slug,
    date: new Date().toISOString().split('T')[0],
    category: 'Uncategorized',
    tags: [],
  };
  let content = '';
  let html = '';

  if (fs.existsSync(indexPath)) {
    const fileContents = fs.readFileSync(indexPath, 'utf8');
    const parsed = matter(fileContents);
    content = parsed.content;
    html = await markdownToHtml(content);

    frontMatter = {
      title: parsed.data.title || slug,
      date: parsed.data.date || new Date().toISOString().split('T')[0],
      updated: parsed.data.updated,
      category: parsed.data.category || 'Uncategorized',
      tags: parsed.data.tags || [],
      description: parsed.data.description || parsed.data.excerpt,
      draft: parsed.data.draft,
      cover: parsed.data.cover,
    };
  }

  const chapters = getChaptersForSeries(slug);

  return {
    slug,
    frontMatter,
    chapters,
    content,
    html,
  };
}

/**
 * Get chapter by series slug and chapter slug
 */
export async function getChapterBySlug(
  seriesSlug: string,
  chapterSlug: string
): Promise<Chapter | null> {
  const chapterPath = path.join(postsDirectory, seriesSlug, `${chapterSlug}.md`);

  if (!fs.existsSync(chapterPath)) {
    return null;
  }

  const fileContents = fs.readFileSync(chapterPath, 'utf8');
  const { data, content } = matter(fileContents);
  const frontMatter = data as PostFrontMatter;

  const html = await markdownToHtml(content);

  // Get all chapters for navigation
  const chapters = getChaptersForSeries(seriesSlug);
  const currentIndex = chapters.findIndex((c) => c.slug === chapterSlug);
  const currentOrder = extractOrder(`${chapterSlug}.md`);

  return {
    seriesSlug,
    slug: chapterSlug,
    frontMatter: {
      title: frontMatter.title || chapterSlug,
      date: frontMatter.date || new Date().toISOString().split('T')[0],
      updated: frontMatter.updated,
      category: frontMatter.category || 'Uncategorized',
      tags: frontMatter.tags || [],
      excerpt: frontMatter.excerpt || generateExcerpt(content),
      featured: frontMatter.featured || false,
      draft: frontMatter.draft || false,
      cover: frontMatter.cover,
    },
    content,
    html,
    readingTime: calculateReadingTime(content),
    wordCount: countWords(content),
    order: currentOrder,
    prevChapter: currentIndex > 0 ? chapters[currentIndex - 1] : undefined,
    nextChapter:
      currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : undefined,
  };
}

/**
 * Check if a slug is a series
 */
export function isSeries(slug: string): boolean {
  const itemPath = path.join(postsDirectory, slug);
  return isDirectory(itemPath);
}

/**
 * Get all unique categories with post counts
 */
export function getAllCategories(): Category[] {
  const items = getAllContentItems();
  const categoryMap = new Map<string, number>();

  items.forEach((item) => {
    const count = categoryMap.get(item.category) || 0;
    categoryMap.set(item.category, count + 1);
  });

  return Array.from(categoryMap.entries())
    .map(([name, count]) => ({
      name,
      slug: slugify(name),
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get all unique tags with post counts
 */
export function getAllTags(): Tag[] {
  const items = getAllContentItems();
  const tagMap = new Map<string, number>();

  items.forEach((item) => {
    item.tags.forEach((tag) => {
      const count = tagMap.get(tag) || 0;
      tagMap.set(tag, count + 1);
    });
  });

  return Array.from(tagMap.entries())
    .map(([name, count]) => ({
      name,
      slug: slugify(name),
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get posts by category (includes series)
 */
export function getPostsByCategory(category: string): ContentItem[] {
  const items = getAllContentItems();
  return items.filter((item) => slugify(item.category) === slugify(category));
}

/**
 * Get posts by tag (includes series)
 */
export function getPostsByTag(tag: string): ContentItem[] {
  const items = getAllContentItems();
  return items.filter((item) =>
    item.tags.some((t) => slugify(t) === slugify(tag))
  );
}

/**
 * Get featured posts
 */
export function getFeaturedPosts(limit?: number): PostListItem[] {
  const posts = getAllPosts().filter((post) => post.featured);
  return limit ? posts.slice(0, limit) : posts;
}

/**
 * Get all slugs for static generation (includes series and chapters)
 */
export function getAllPostSlugs(): string[][] {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const slugs: string[][] = [];
  const items = fs.readdirSync(postsDirectory);

  items.forEach((item) => {
    const itemPath = path.join(postsDirectory, item);

    if (item.endsWith('.md')) {
      // Single post
      slugs.push([item.replace(/\.md$/, '')]);
    } else if (isDirectory(itemPath)) {
      // Series - add series index page
      slugs.push([item]);

      // Add each chapter
      const files = fs.readdirSync(itemPath);
      files
        .filter((f) => f.endsWith('.md') && f !== 'index.md')
        .forEach((f) => {
          slugs.push([item, f.replace(/\.md$/, '')]);
        });
    }
  });

  return slugs;
}
