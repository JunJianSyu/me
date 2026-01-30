'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/svg/Logo';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';
import styles from './Header.module.css';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Logo */}
        <Link href="/" className={styles.logoLink} aria-label="Home">
          <Logo size={36} />
          <span className={styles.siteName}>{siteConfig.title}</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className={styles.desktopNav} aria-label="Main navigation">
          {siteConfig.nav.map((item) => (
            <Link key={item.href} href={item.href} className={styles.navLink}>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className={styles.menuButton}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Navigation */}
        <nav
          className={cn(styles.mobileNav, isMenuOpen && styles.mobileNavOpen)}
          aria-label="Mobile navigation"
        >
          {siteConfig.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={styles.mobileNavLink}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default Header;
