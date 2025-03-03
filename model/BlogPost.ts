// 1. Install dependencies
// Run these commands in your project root:
// npm install gray-matter next-mdx-remote date-fns

// 2. Create a types file: types/blog.ts
export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  author?: string;
  tags?: string[];
  coverImage?: string;
};
