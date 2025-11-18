import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { BlogPost } from "../model/BlogPost";

// Path to our blog posts
const postsDirectory = path.join(process.cwd(), "content/blog");

export function getAllPostSlugs() {
  const fileNames = fs.readdirSync(postsDirectory);

  return fileNames.map((fileName) => {
    return {
      params: {
        slug: fileName.replace(/\.mdx$/, ""),
      },
    };
  });
}

export function getPostBySlug(slug: string): BlogPost {
  const fullPath = path.join(postsDirectory, `${slug}.mdx`);
  const fileContents = fs.readFileSync(fullPath, "utf8");

  // Use gray-matter to parse the post metadata section
  const { data, content } = matter(fileContents);

  return {
    slug,
    title: data.title,
    date: data.date,
    excerpt: data.excerpt || "",
    content,
    author: data.author || "",
    tags: data.tags || [],
    coverImage: data.coverImage || "",
  };
}

export function getAllPosts(): BlogPost[] {
  const slugs = getAllPostSlugs();
  const posts = slugs
    .map(({ params }) => getPostBySlug(params.slug))
    // Sort posts by date
    .sort((post1, post2) =>
      new Date(post1.date) > new Date(post2.date) ? -1 : 1,
    );

  return posts;
}
