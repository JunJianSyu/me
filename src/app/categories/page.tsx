import { Metadata } from 'next';
import { getAllCategories } from '@/lib/posts';
import { CategoryList } from '@/components/blog/CategoryList';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: '分类',
  description: '浏览所有文章分类',
};

export default function CategoriesPage() {
  const categories = getAllCategories();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>分类</h1>
        <p className={styles.description}>
          共 {categories.length} 个分类
        </p>
      </header>

      <CategoryList categories={categories} />
    </div>
  );
}
