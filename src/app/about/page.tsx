import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPageBySlug } from '@/lib/pages';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: '关于',
  description: '了解这个博客和作者',
};

export default async function AboutPage() {
  const page = await getPageBySlug('about');

  if (!page) {
    notFound();
  }

  return (
    <div className={styles.container}>
      <article className={styles.article}>
        <div
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: page.html || '' }}
        />
      </article>
    </div>
  );
}
