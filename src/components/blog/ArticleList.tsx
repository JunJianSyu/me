import { ContentItem } from '@/types';
import { ArticleCard } from './ArticleCard';
import styles from './ArticleList.module.css';

interface ArticleListProps {
  posts: ContentItem[];
  columns?: 2 | 3;
}

export function ArticleList({ posts, columns = 2 }: ArticleListProps) {
  if (posts.length === 0) {
    return (
      <div className={styles.empty}>
        <p>暂无文章</p>
      </div>
    );
  }

  return (
    <div className={`${styles.grid} ${styles[`cols${columns}`]}`}>
      {posts.map((post) => (
        <ArticleCard key={post.slug} post={post} />
      ))}
    </div>
  );
}

export default ArticleList;
