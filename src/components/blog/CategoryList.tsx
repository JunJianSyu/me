import Link from 'next/link';
import { Folder } from 'lucide-react';
import { Category } from '@/types';
import styles from './CategoryList.module.css';

interface CategoryListProps {
  categories: Category[];
}

export function CategoryList({ categories }: CategoryListProps) {
  if (categories.length === 0) {
    return (
      <div className={styles.empty}>
        <p>暂无分类</p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {categories.map((category) => (
        <Link
          key={category.slug}
          href={`/categories/${category.slug}`}
          className={styles.item}
        >
          <div className={styles.icon}>
            <Folder size={24} />
          </div>
          <div className={styles.info}>
            <h3 className={styles.name}>{category.name}</h3>
            <p className={styles.count}>{category.count} 篇文章</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default CategoryList;
