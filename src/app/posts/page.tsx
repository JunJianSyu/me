import { Metadata } from 'next';
import { getAllContentItems } from '@/lib/posts';
import { ArticleList } from '@/components/blog/ArticleList';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: '全部文章',
  description: '浏览所有博客文章',
};

export default function PostsPage() {
  const posts = getAllContentItems();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>全部文章</h1>
        <p className={styles.description}>
          共 {posts.length} 篇文章
        </p>
      </header>

      <ArticleList posts={posts} columns={3} />
    </div>
  );
}
