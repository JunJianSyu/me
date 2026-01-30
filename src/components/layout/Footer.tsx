'use client';

import Link from 'next/link';
import { Github, Mail } from 'lucide-react';
import { siteConfig } from '@/config/site';
import styles from './Footer.module.css';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.content}>
          {/* Brand */}
          <div className={styles.brand}>
            <h3 className={styles.brandName}>{siteConfig.title}</h3>
            <p className={styles.brandDesc}>{siteConfig.description}</p>
          </div>

          {/* Quick Links */}
          <div className={styles.links}>
            <h4 className={styles.linksTitle}>快速链接</h4>
            <nav className={styles.linkList}>
              {siteConfig.nav.slice(0, 4).map((item) => (
                <Link key={item.href} href={item.href} className={styles.link}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Social Links */}
          <div className={styles.social}>
            <h4 className={styles.socialTitle}>关注我</h4>
            <div className={styles.socialLinks}>
              {siteConfig.social.github && (
                <a
                  href={siteConfig.social.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                  aria-label="GitHub"
                >
                  <Github size={20} />
                </a>
              )}
              {siteConfig.social.email && (
                <a
                  href={`mailto:${siteConfig.social.email}`}
                  className={styles.socialLink}
                  aria-label="Email"
                >
                  <Mail size={20} />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className={styles.copyright}>
          <p>
            © {currentYear} {siteConfig.author}. All rights reserved.
          </p>
          <p className={styles.poweredBy}>
            Built with Next.js & React
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
