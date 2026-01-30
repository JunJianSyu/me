import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getAllTags, getPostsByTag } from '@/lib/posts';
import { ArticleList } from '@/components/blog/ArticleList';
import styles from './page.module.css';

interface PageProps {
  params: { slug: string };
}

export async function generateStaticParams() {
  const tags = getAllTags();
  return tags.map((tag) => ({ slug: tag.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const decodedSlug = decodeURIComponent(params.slug);
  const tags = getAllTags();
  const tag = tags.find((t) => t.slug === decodedSlug);

  return {
    title: tag ? `${tag.name} - 标签` : '标签',
    description: tag ? `浏览标签 ${tag.name} 下的所有文章` : '标签页面',
  };
}

export default function TagPage({ params }: PageProps) {
  const decodedSlug = decodeURIComponent(params.slug);
  const tags = getAllTags();
  const tag = tags.find((t) => t.slug === decodedSlug);
  const posts = getPostsByTag(decodedSlug);

  return (
    <div className={styles.container}>
      <Link href="/tags" className={styles.backLink}>
        <ArrowLeft size={16} />
        返回标签列表
      </Link>

      <header className={styles.header}>
        <h1 className={styles.title}>#{tag?.name || decodedSlug}</h1>
        <p className={styles.description}>
          共 {posts.length} 篇文章
        </p>
      </header>

      <ArticleList posts={posts} columns={3} />
    </div>
  );
}
