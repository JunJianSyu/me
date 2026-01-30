import { Metadata } from 'next';
import { getAllTags } from '@/lib/posts';
import { TagCloud } from '@/components/blog/TagCloud';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: '标签',
  description: '浏览所有文章标签',
};

export default function TagsPage() {
  const tags = getAllTags();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>标签</h1>
        <p className={styles.description}>
          共 {tags.length} 个标签
        </p>
      </header>

      <div className={styles.content}>
        <TagCloud tags={tags} />
      </div>
    </div>
  );
}
