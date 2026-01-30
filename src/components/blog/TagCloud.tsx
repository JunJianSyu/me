import { Tag as TagType } from '@/types';
import { Tag } from '@/components/ui/Tag';
import styles from './TagCloud.module.css';

interface TagCloudProps {
  tags: TagType[];
}

export function TagCloud({ tags }: TagCloudProps) {
  if (tags.length === 0) {
    return (
      <div className={styles.empty}>
        <p>暂无标签</p>
      </div>
    );
  }

  // Calculate tag sizes based on count
  const maxCount = Math.max(...tags.map((t) => t.count));
  const minCount = Math.min(...tags.map((t) => t.count));

  const getSize = (count: number): 'sm' | 'md' => {
    if (maxCount === minCount) return 'md';
    const ratio = (count - minCount) / (maxCount - minCount);
    return ratio > 0.5 ? 'md' : 'sm';
  };

  return (
    <div className={styles.cloud}>
      {tags.map((tag) => (
        <Tag
          key={tag.slug}
          href={`/tags/${tag.slug}`}
          size={getSize(tag.count)}
          variant="outline"
          className={styles.tag}
        >
          {`${tag.name} (${tag.count})`}
        </Tag>
      ))}
    </div>
  );
}

export default TagCloud;
