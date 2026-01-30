import Link from 'next/link';
import { cn } from '@/lib/utils';
import styles from './Tag.module.css';

interface TagProps {
  children: string;
  href?: string;
  variant?: 'default' | 'category' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export function Tag({
  children,
  href,
  variant = 'default',
  size = 'sm',
  className,
}: TagProps) {
  const tagClassName = cn(
    styles.tag,
    styles[variant],
    styles[size],
    className
  );

  if (href) {
    return (
      <Link href={href} className={tagClassName}>
        {children}
      </Link>
    );
  }

  return <span className={tagClassName}>{children}</span>;
}

export default Tag;
