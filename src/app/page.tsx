import { getAllContentItems } from '@/lib/posts';
import { ArticleCard } from '@/components/blog/ArticleCard';
import styles from './page.module.css';

export default function HomePage() {
  const posts = getAllContentItems();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>最新文章</h1>
        <p className={styles.description}>
          共 {posts.length} 篇文章
        </p>
      </header>

      {posts.length === 0 ? (
        <div className={styles.empty}>
          <p>暂无文章，开始写作吧！</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {posts.map((post) => (
            <ArticleCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
