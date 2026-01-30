import Link from 'next/link';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { PostListItem } from '@/types';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { formatDate, slugify } from '@/lib/utils';
import styles from './FeaturedArticle.module.css';

interface FeaturedArticleProps {
  post: PostListItem;
}

export function FeaturedArticle({ post }: FeaturedArticleProps) {
  return (
    <Card variant="featured" className={styles.featured}>
      <div className={styles.link}>
        {post.cover && (
          <div className={styles.imageWrapper}>
            <img src={post.cover} alt={post.title} className={styles.image} />
            <div className={styles.overlay} />
          </div>
        )}
        
        <div className={styles.content}>
          <div className={styles.meta}>
            <Tag href={`/categories/${slugify(post.category)}`} variant="category">
              {post.category}
            </Tag>
            <span className={styles.dot}>•</span>
            <span className={styles.metaItem}>
              <Calendar size={14} />
              {formatDate(post.date)}
            </span>
            <span className={styles.metaItem}>
              <Clock size={14} />
              {post.readingTime} 分钟阅读
            </span>
          </div>

          <Link href={`/posts/${post.slug}`} className={styles.titleLink}>
            <h2 className={styles.title}>{post.title}</h2>
          </Link>
          
          <p className={styles.excerpt}>{post.excerpt}</p>

          <div className={styles.tags}>
            {post.tags.slice(0, 3).map((tag) => (
              <Tag key={tag} href={`/tags/${slugify(tag)}`} variant="outline">
                {tag}
              </Tag>
            ))}
          </div>

          <Link href={`/posts/${post.slug}`} className={styles.readMore}>
            阅读全文 <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </Card>
  );
}

export default FeaturedArticle;
