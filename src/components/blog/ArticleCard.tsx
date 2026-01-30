import Link from 'next/link';
import { Calendar, Clock, BookOpen, List } from 'lucide-react';
import { ContentItem } from '@/types';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { formatDate, slugify } from '@/lib/utils';
import styles from './ArticleCard.module.css';

interface ArticleCardProps {
  post: ContentItem;
  showImage?: boolean;
}

export function ArticleCard({ post, showImage = true }: ArticleCardProps) {
  const isSeries = post.isSeries;
  const href = `/posts/${post.slug}`;

  return (
    <Card className={styles.card}>
      <article className={styles.article}>
        {showImage && post.cover && (
          <Link href={href} className={styles.imageWrapper}>
            <img src={post.cover} alt={post.title} className={styles.image} />
            {isSeries && (
              <div className={styles.seriesBadge}>
                <BookOpen size={12} />
                系列
              </div>
            )}
          </Link>
        )}

        <div className={styles.content}>
          <div className={styles.meta}>
            <Tag href={`/categories/${slugify(post.category)}`} size="sm">
              {post.category}
            </Tag>
            {isSeries && !post.cover && (
              <span className={styles.seriesTag}>
                <BookOpen size={12} />
                系列文章
              </span>
            )}
          </div>

          <Link href={href} className={styles.titleLink}>
            <h3 className={styles.title}>{post.title}</h3>
          </Link>

          <p className={styles.excerpt}>
            {isSeries ? post.description || `共 ${post.chapters.length} 章节` : post.excerpt}
          </p>

          <div className={styles.footer}>
            <span className={styles.date}>
              <Calendar size={14} />
              {formatDate(post.date)}
            </span>
            {isSeries ? (
              <span className={styles.readTime}>
                <List size={14} />
                {post.chapters.length} 章
              </span>
            ) : (
              <span className={styles.readTime}>
                <Clock size={14} />
                {post.readingTime} min
              </span>
            )}
          </div>
        </div>
      </article>
    </Card>
  );
}

export default ArticleCard;
