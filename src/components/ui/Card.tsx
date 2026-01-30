import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import styles from './Card.module.css';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  variant?: 'default' | 'featured';
}

export function Card({
  children,
  className,
  hover = true,
  variant = 'default',
}: CardProps) {
  return (
    <div
      className={cn(
        styles.card,
        hover && styles.cardHover,
        variant === 'featured' && styles.cardFeatured,
        className
      )}
    >
      {children}
    </div>
  );
}

export default Card;
