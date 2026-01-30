export interface NavItem {
  label: string;
  href: string;
}

export interface SocialLinks {
  github?: string;
  twitter?: string;
  email?: string;
}

export interface SiteConfig {
  title: string;
  description: string;
  author: string;
  url: string;
  language: string;
  social: SocialLinks;
  nav: NavItem[];
  home: {
    featuredCount: number;
    recentCount: number;
  };
  pagination: {
    postsPerPage: number;
  };
}
