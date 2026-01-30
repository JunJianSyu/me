import type { Metadata } from 'next';
import { Sidebar } from '@/components/layout/Sidebar';
import { getAllContentItems, getAllCategories, getAllTags } from '@/lib/posts';
import { siteConfig } from '@/config/site';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.title}`,
  },
  description: siteConfig.description,
  authors: [{ name: siteConfig.author }],
  creator: siteConfig.author,
  openGraph: {
    type: 'website',
    locale: siteConfig.language,
    url: siteConfig.url,
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: siteConfig.title,
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.title,
    description: siteConfig.description,
  },
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const posts = getAllContentItems();
  const categories = getAllCategories();
  const tags = getAllTags();

  return (
    <html lang={siteConfig.language} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://cdn.jsdmirror.com" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') || 
                  (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
                document.documentElement.setAttribute('data-theme', theme);
              })();
            `,
          }}
        />
      </head>
      <body>
        <div className="app-layout">
          <Sidebar posts={posts} categories={categories} tags={tags} />
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
