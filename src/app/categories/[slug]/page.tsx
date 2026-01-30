import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getAllCategories, getPostsByCategory } from '@/lib/posts';
import { ArticleList } from '@/components/blog/ArticleList';
import styles from './page.module.css';

interface PageProps {
  params: { slug: string };
}

export async function generateStaticParams() {
  const categories = getAllCategories();
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const decodedSlug = decodeURIComponent(params.slug);
  const categories = getAllCategories();
  const category = categories.find((c) => c.slug === decodedSlug);

  return {
    title: category ? `${category.name} - 分类` : '分类',
    description: category ? `浏览 ${category.name} 分类下的所有文章` : '分类页面',
  };
}

export default function CategoryPage({ params }: PageProps) {
  const decodedSlug = decodeURIComponent(params.slug);
  const categories = getAllCategories();
  const category = categories.find((c) => c.slug === decodedSlug);
  const posts = getPostsByCategory(decodedSlug);

  return (
    <div className={styles.container}>
      <Link href="/categories" className={styles.backLink}>
        <ArrowLeft size={16} />
        返回分类列表
      </Link>

      <header className={styles.header}>
        <h1 className={styles.title}>{category?.name || decodedSlug}</h1>
        <p className={styles.description}>
          共 {posts.length} 篇文章
        </p>
      </header>

      <ArticleList posts={posts} columns={3} />
    </div>
  );
}
