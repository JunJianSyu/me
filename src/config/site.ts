import { SiteConfig } from '@/types';

export const siteConfig: SiteConfig = {
  title: 'Childlike',
  description: '博客',
  author: 'JunJianSyu',
  url: 'https://github.com/JunJianSyu/me',
  language: 'zh-CN',

  social: {
    github: 'https://github.com/JunJianSyu',
    email: 'email@example.com',
  },

  nav: [
    { label: '首页', href: '/' },
    { label: '文章', href: '/posts' },
    { label: '分类', href: '/categories' },
    { label: '标签', href: '/tags' },
    { label: '关于', href: '/about' },
  ],

  home: {
    featuredCount: 1,
    recentCount: 6,
  },

  pagination: {
    postsPerPage: 10,
  },
};
