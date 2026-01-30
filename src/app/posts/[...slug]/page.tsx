import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Calendar,
  Clock,
  ArrowLeft,
  ArrowRight,
  Tag as TagIcon,
  BookOpen,
  List,
} from 'lucide-react';
import {
  getPostBySlug,
  getSeriesBySlug,
  getChapterBySlug,
  getAllPostSlugs,
  isSeries,
} from '@/lib/posts';
import { Tag } from '@/components/ui/Tag';
import { formatDate, slugify } from '@/lib/utils';
import { siteConfig } from '@/config/site';
import styles from './page.module.css';

interface PageProps {
  params: { slug: string[] };
}

export async function generateStaticParams() {
  const slugs = getAllPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = params;

  if (slug.length === 1) {
    // Single post or series index
    if (isSeries(slug[0])) {
      const series = await getSeriesBySlug(slug[0]);
      if (!series) {
        return { title: 'Not Found' };
      }
      return {
        title: series.frontMatter.title,
        description: series.frontMatter.description,
      };
    } else {
      const post = await getPostBySlug(slug[0]);
      if (!post) {
        return { title: 'Not Found' };
      }
      return {
        title: post.frontMatter.title,
        description: post.frontMatter.excerpt,
        openGraph: {
          title: post.frontMatter.title,
          description: post.frontMatter.excerpt,
          type: 'article',
          publishedTime: post.frontMatter.date,
          modifiedTime: post.frontMatter.updated,
          authors: [siteConfig.author],
          images: post.frontMatter.cover ? [post.frontMatter.cover] : undefined,
        },
      };
    }
  } else if (slug.length === 2) {
    // Chapter page
    const chapter = await getChapterBySlug(slug[0], slug[1]);
    if (!chapter) {
      return { title: 'Not Found' };
    }
    return {
      title: chapter.frontMatter.title,
      description: chapter.frontMatter.excerpt,
      openGraph: {
        title: chapter.frontMatter.title,
        description: chapter.frontMatter.excerpt,
        type: 'article',
        publishedTime: chapter.frontMatter.date,
        modifiedTime: chapter.frontMatter.updated,
        authors: [siteConfig.author],
      },
    };
  }

  return { title: 'Not Found' };
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = params;

  if (slug.length === 1) {
    // Check if it's a series or single post
    if (isSeries(slug[0])) {
      return <SeriesIndexPage seriesSlug={slug[0]} />;
    } else {
      return <SinglePostPage slug={slug[0]} />;
    }
  } else if (slug.length === 2) {
    return <ChapterPage seriesSlug={slug[0]} chapterSlug={slug[1]} />;
  }

  notFound();
}

// Single Post Component
async function SinglePostPage({ slug }: { slug: string }) {
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <article className={styles.article}>
      <Link href="/posts" className={styles.backLink}>
        <ArrowLeft size={16} />
        返回文章列表
      </Link>

      <header className={styles.header}>
        <div className={styles.meta}>
          <Tag
            href={`/categories/${slugify(post.frontMatter.category)}`}
            variant="category"
          >
            {post.frontMatter.category}
          </Tag>
          <span className={styles.metaItem}>
            <Calendar size={16} />
            {formatDate(post.frontMatter.date)}
          </span>
          <span className={styles.metaItem}>
            <Clock size={16} />
            {post.readingTime} 分钟阅读
          </span>
        </div>

        <h1 className={styles.title}>{post.frontMatter.title}</h1>

        {post.frontMatter.excerpt && (
          <p className={styles.excerpt}>{post.frontMatter.excerpt}</p>
        )}

        {post.frontMatter.tags.length > 0 && (
          <div className={styles.tags}>
            <TagIcon size={16} className={styles.tagIcon} />
            {post.frontMatter.tags.map((tag) => (
              <Tag key={tag} href={`/tags/${slugify(tag)}`} variant="outline">
                {tag}
              </Tag>
            ))}
          </div>
        )}
      </header>

      {post.frontMatter.cover && (
        <div className={styles.coverWrapper}>
          <img
            src={post.frontMatter.cover}
            alt={post.frontMatter.title}
            className={styles.cover}
          />
        </div>
      )}

      <div
        className={styles.content}
        dangerouslySetInnerHTML={{ __html: post.html || '' }}
      />

      <footer className={styles.footer}>
        {post.frontMatter.updated && (
          <p className={styles.updated}>
            最后更新于 {formatDate(post.frontMatter.updated)}
          </p>
        )}
      </footer>
    </article>
  );
}

// Series Index Page Component
async function SeriesIndexPage({ seriesSlug }: { seriesSlug: string }) {
  const series = await getSeriesBySlug(seriesSlug);

  if (!series) {
    notFound();
  }

  return (
    <article className={styles.article}>
      <Link href="/posts" className={styles.backLink}>
        <ArrowLeft size={16} />
        返回文章列表
      </Link>

      <header className={styles.header}>
        <div className={styles.seriesBadge}>
          <BookOpen size={16} />
          <span>系列文章</span>
        </div>

        <div className={styles.meta}>
          <Tag
            href={`/categories/${slugify(series.frontMatter.category)}`}
            variant="category"
          >
            {series.frontMatter.category}
          </Tag>
          <span className={styles.metaItem}>
            <Calendar size={16} />
            {formatDate(series.frontMatter.date)}
          </span>
          <span className={styles.metaItem}>
            <List size={16} />
            {series.chapters.length} 章节
          </span>
        </div>

        <h1 className={styles.title}>{series.frontMatter.title}</h1>

        {series.frontMatter.description && (
          <p className={styles.excerpt}>{series.frontMatter.description}</p>
        )}

        {series.frontMatter.tags && series.frontMatter.tags.length > 0 && (
          <div className={styles.tags}>
            <TagIcon size={16} className={styles.tagIcon} />
            {series.frontMatter.tags.map((tag) => (
              <Tag key={tag} href={`/tags/${slugify(tag)}`} variant="outline">
                {tag}
              </Tag>
            ))}
          </div>
        )}
      </header>

      {series.frontMatter.cover && (
        <div className={styles.coverWrapper}>
          <img
            src={series.frontMatter.cover}
            alt={series.frontMatter.title}
            className={styles.cover}
          />
        </div>
      )}

      {/* Series content from index.md */}
      {series.html && (
        <div
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: series.html }}
        />
      )}

      {/* Chapter List */}
      <div className={styles.chapterList}>
        <h2 className={styles.chapterListTitle}>
          <List size={20} />
          章节目录
        </h2>
        <ol className={styles.chapters}>
          {series.chapters.map((chapter, index) => (
            <li key={chapter.slug} className={styles.chapterItem}>
              <Link
                href={`/posts/${seriesSlug}/${chapter.slug}`}
                className={styles.chapterLink}
              >
                <span className={styles.chapterNumber}>{index + 1}</span>
                <span className={styles.chapterTitle}>{chapter.title}</span>
                <ArrowRight size={16} className={styles.chapterArrow} />
              </Link>
            </li>
          ))}
        </ol>
      </div>

      {/* Start Reading Button */}
      {series.chapters.length > 0 && (
        <div className={styles.startReading}>
          <Link
            href={`/posts/${seriesSlug}/${series.chapters[0].slug}`}
            className={styles.startButton}
          >
            开始阅读
            <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </article>
  );
}

// Chapter Page Component
async function ChapterPage({
  seriesSlug,
  chapterSlug,
}: {
  seriesSlug: string;
  chapterSlug: string;
}) {
  const [chapter, series] = await Promise.all([
    getChapterBySlug(seriesSlug, chapterSlug),
    getSeriesBySlug(seriesSlug),
  ]);

  if (!chapter || !series) {
    notFound();
  }

  const currentIndex = series.chapters.findIndex((c) => c.slug === chapterSlug);

  return (
    <article className={styles.article}>
      <Link href={`/posts/${seriesSlug}`} className={styles.backLink}>
        <ArrowLeft size={16} />
        返回系列目录
      </Link>

      <header className={styles.header}>
        <div className={styles.chapterBreadcrumb}>
          <span className={styles.chapterIndex}>
            第 {currentIndex + 1} 章 / 共 {series.chapters.length} 章
          </span>
        </div>

        <div className={styles.meta}>
          <span className={styles.metaItem}>
            <Calendar size={16} />
            {formatDate(chapter.frontMatter.date)}
          </span>
          <span className={styles.metaItem}>
            <Clock size={16} />
            {chapter.readingTime} 分钟阅读
          </span>
        </div>

        <h1 className={styles.title}>{chapter.frontMatter.title}</h1>

        {chapter.frontMatter.excerpt && (
          <p className={styles.excerpt}>{chapter.frontMatter.excerpt}</p>
        )}
      </header>

      <div
        className={styles.content}
        dangerouslySetInnerHTML={{ __html: chapter.html || '' }}
      />

      {/* Chapter Navigation */}
      <nav className={styles.chapterPagination}>
        {chapter.prevChapter ? (
          <Link
            href={`/posts/${seriesSlug}/${chapter.prevChapter.slug}`}
            className={styles.prevChapter}
          >
            <ArrowLeft size={16} />
            <div>
              <span className={styles.paginationLabel}>上一章</span>
              <span className={styles.paginationTitle}>
                {chapter.prevChapter.title}
              </span>
            </div>
          </Link>
        ) : (
          <div />
        )}

        {chapter.nextChapter ? (
          <Link
            href={`/posts/${seriesSlug}/${chapter.nextChapter.slug}`}
            className={styles.nextChapter}
          >
            <div>
              <span className={styles.paginationLabel}>下一章</span>
              <span className={styles.paginationTitle}>
                {chapter.nextChapter.title}
              </span>
            </div>
            <ArrowRight size={16} />
          </Link>
        ) : (
          <div />
        )}
      </nav>

      <footer className={styles.footer}>
        {chapter.frontMatter.updated && (
          <p className={styles.updated}>
            最后更新于 {formatDate(chapter.frontMatter.updated)}
          </p>
        )}
      </footer>
    </article>
  );
}
