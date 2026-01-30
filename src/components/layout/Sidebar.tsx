'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  FileText,
  Folder,
  Tag,
  User,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  BookOpen,
} from 'lucide-react';
import { Logo } from '@/components/svg/Logo';
import { ThemeToggle } from './ThemeToggle';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';
import { ContentItem, Category, Tag as TagType } from '@/types';
import styles from './Sidebar.module.css';

interface SidebarProps {
  posts: ContentItem[];
  categories: Category[];
  tags: TagType[];
}

export function Sidebar({ posts, categories, tags }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['posts']);
  const [expandedSeries, setExpandedSeries] = useState<string[]>([]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const toggleSeries = (seriesSlug: string) => {
    setExpandedSeries((prev) =>
      prev.includes(seriesSlug)
        ? prev.filter((s) => s !== seriesSlug)
        : [...prev, seriesSlug]
    );
  };

  const isExpanded = (section: string) => expandedSections.includes(section);
  const isSeriesExpanded = (seriesSlug: string) =>
    expandedSeries.includes(seriesSlug);

  // Check if current path is within a series
  const isInSeries = (seriesSlug: string) => {
    return pathname.startsWith(`/posts/${seriesSlug}`);
  };

  // Auto-expand series if we're viewing it
  const shouldShowSeriesExpanded = (seriesSlug: string) => {
    return isSeriesExpanded(seriesSlug) || isInSeries(seriesSlug);
  };

  const navItems = [
    { href: '/', label: '首页', icon: Home },
    { href: '/about', label: '关于', icon: User },
  ];

  // Count total items (posts + series)
  const totalCount = posts.length;

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className={styles.mobileToggle}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div className={styles.overlay} onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(styles.sidebar, isOpen && styles.sidebarOpen)}>
        {/* Logo & Site Name */}
        <div className={styles.header}>
          <Link href="/" className={styles.logoLink}>
            <Logo size={32} />
            <span className={styles.siteName}>{siteConfig.title}</span>
          </Link>

          {/* Theme Toggle */}
          <ThemeToggle />
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {/* Main Nav Items */}
          <ul className={styles.navList}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(styles.navItem, isActive && styles.navItemActive)}
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Posts Section */}
          <div className={styles.section}>
            <button
              className={styles.sectionHeader}
              onClick={() => toggleSection('posts')}
            >
              <FileText size={18} />
              <span>文章</span>
              <span className={styles.badge}>{totalCount}</span>
              {isExpanded('posts') ? (
                <ChevronDown size={16} className={styles.chevron} />
              ) : (
                <ChevronRight size={16} className={styles.chevron} />
              )}
            </button>
            {isExpanded('posts') && (
              <ul className={styles.subList}>
                {posts.slice(0, 15).map((item) => {
                  if (item.isSeries) {
                    // Series item with nested chapters
                    const isActive = pathname === `/posts/${item.slug}`;
                    const expanded = shouldShowSeriesExpanded(item.slug);

                    return (
                      <li key={item.slug} className={styles.seriesItem}>
                        <div className={styles.seriesHeader}>
                          <button
                            className={styles.seriesToggle}
                            onClick={() => toggleSeries(item.slug)}
                            aria-label={expanded ? 'Collapse' : 'Expand'}
                          >
                            {expanded ? (
                              <ChevronDown size={14} />
                            ) : (
                              <ChevronRight size={14} />
                            )}
                          </button>
                          <Link
                            href={`/posts/${item.slug}`}
                            className={cn(
                              styles.seriesLink,
                              isActive && styles.seriesLinkActive
                            )}
                            onClick={() => setIsOpen(false)}
                          >
                            <BookOpen size={14} className={styles.seriesIcon} />
                            <span>{item.title}</span>
                            <span className={styles.chapterCount}>
                              {item.chapters.length}
                            </span>
                          </Link>
                        </div>

                        {/* Chapter list */}
                        {expanded && (
                          <ul className={styles.chapterList}>
                            {item.chapters.map((chapter, index) => {
                              const chapterActive =
                                pathname === `/posts/${item.slug}/${chapter.slug}`;
                              return (
                                <li key={chapter.slug}>
                                  <Link
                                    href={`/posts/${item.slug}/${chapter.slug}`}
                                    className={cn(
                                      styles.chapterItem,
                                      chapterActive && styles.chapterItemActive
                                    )}
                                    onClick={() => setIsOpen(false)}
                                  >
                                    <span className={styles.chapterNumber}>
                                      {index + 1}
                                    </span>
                                    <span className={styles.chapterTitle}>
                                      {chapter.title}
                                    </span>
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </li>
                    );
                  } else {
                    // Single post
                    const isActive = pathname === `/posts/${item.slug}`;
                    return (
                      <li key={item.slug}>
                        <Link
                          href={`/posts/${item.slug}`}
                          className={cn(
                            styles.subItem,
                            isActive && styles.subItemActive
                          )}
                          onClick={() => setIsOpen(false)}
                        >
                          {item.title}
                        </Link>
                      </li>
                    );
                  }
                })}
                {posts.length > 15 && (
                  <li>
                    <Link
                      href="/posts"
                      className={styles.viewAll}
                      onClick={() => setIsOpen(false)}
                    >
                      查看全部 ({posts.length})
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </div>

          {/* Categories Section */}
          <div className={styles.section}>
            <button
              className={styles.sectionHeader}
              onClick={() => toggleSection('categories')}
            >
              <Folder size={18} />
              <span>分类</span>
              <span className={styles.badge}>{categories.length}</span>
              {isExpanded('categories') ? (
                <ChevronDown size={16} className={styles.chevron} />
              ) : (
                <ChevronRight size={16} className={styles.chevron} />
              )}
            </button>
            {isExpanded('categories') && (
              <ul className={styles.subList}>
                {categories.map((category) => {
                  const isActive = pathname === `/categories/${category.slug}`;
                  return (
                    <li key={category.slug}>
                      <Link
                        href={`/categories/${category.slug}`}
                        className={cn(
                          styles.subItem,
                          isActive && styles.subItemActive
                        )}
                        onClick={() => setIsOpen(false)}
                      >
                        {category.name}
                        <span className={styles.count}>({category.count})</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Tags Section */}
          <div className={styles.section}>
            <button
              className={styles.sectionHeader}
              onClick={() => toggleSection('tags')}
            >
              <Tag size={18} />
              <span>标签</span>
              <span className={styles.badge}>{tags.length}</span>
              {isExpanded('tags') ? (
                <ChevronDown size={16} className={styles.chevron} />
              ) : (
                <ChevronRight size={16} className={styles.chevron} />
              )}
            </button>
            {isExpanded('tags') && (
              <ul className={styles.subList}>
                {tags.slice(0, 8).map((tag) => {
                  const isActive = pathname === `/tags/${tag.slug}`;
                  return (
                    <li key={tag.slug}>
                      <Link
                        href={`/tags/${tag.slug}`}
                        className={cn(
                          styles.subItem,
                          isActive && styles.subItemActive
                        )}
                        onClick={() => setIsOpen(false)}
                      >
                        #{tag.name}
                        <span className={styles.count}>({tag.count})</span>
                      </Link>
                    </li>
                  );
                })}
                {tags.length > 8 && (
                  <li>
                    <Link
                      href="/tags"
                      className={styles.viewAll}
                      onClick={() => setIsOpen(false)}
                    >
                      查看全部 ({tags.length})
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </div>
        </nav>

        {/* Footer */}
        <div className={styles.footer}>
          <p>© 2026 {siteConfig.author}</p>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
