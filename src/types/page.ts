export interface PageFrontMatter {
  title: string;
  description?: string;
}

export interface Page {
  slug: string;
  frontMatter: PageFrontMatter;
  content: string;
  html?: string;
}
