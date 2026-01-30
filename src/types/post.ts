export interface PostFrontMatter {
  title: string;
  date: string;
  updated?: string;
  category: string;
  tags: string[];
  excerpt?: string;
  featured?: boolean;
  draft?: boolean;
  cover?: string;
}

export interface Post {
  slug: string;
  frontMatter: PostFrontMatter;
  content: string;
  html?: string;
  readingTime: number;
  wordCount: number;
}

export interface PostListItem {
  slug: string;
  title: string;
  date: string;
  category: string;
  tags: string[];
  excerpt: string;
  featured: boolean;
  cover?: string;
  readingTime: number;
  isSeries?: false;
}

// 章节信息
export interface ChapterItem {
  slug: string; // 章节 slug，如 "01-introduction"
  title: string;
  order: number; // 从文件名提取的排序号
}

// 系列文章 frontmatter
export interface SeriesFrontMatter {
  title: string;
  date: string;
  updated?: string;
  category: string;
  tags: string[];
  description?: string;
  draft?: boolean;
  cover?: string;
}

// 系列文章列表项
export interface SeriesItem {
  slug: string; // 系列 slug，如 "react-tutorial"
  title: string;
  description?: string;
  date: string;
  category: string;
  tags: string[];
  chapters: ChapterItem[];
  cover?: string;
  isSeries: true;
}

// 系列文章详情（含内容）
export interface Series {
  slug: string;
  frontMatter: SeriesFrontMatter;
  chapters: ChapterItem[];
  content?: string; // index.md 的内容
  html?: string;
}

// 章节详情（含内容）
export interface Chapter {
  seriesSlug: string;
  slug: string;
  frontMatter: PostFrontMatter;
  content: string;
  html?: string;
  readingTime: number;
  wordCount: number;
  order: number;
  prevChapter?: ChapterItem;
  nextChapter?: ChapterItem;
}

// 联合类型：内容列表项
export type ContentItem = PostListItem | SeriesItem;
