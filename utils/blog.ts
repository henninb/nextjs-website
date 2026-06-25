import fs from "fs";
import path from "path";
import { parse } from "yaml";
import { BlogPost } from "../model/BlogPost";

const postsDirectory = path.join(process.cwd(), "content/blog");

function parseFrontmatter(fileContent: string): {
  data: Record<string, unknown>;
  content: string;
} {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(
    fileContent,
  );
  if (!match) {
    return { data: {}, content: fileContent };
  }
  return { data: parse(match[1]) as Record<string, unknown>, content: match[2] };
}

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

  const { data, content } = parseFrontmatter(fileContents);

  return {
    slug,
    title: data.title as string,
    date: data.date as string,
    excerpt: (data.excerpt as string) || "",
    content,
    author: (data.author as string) || "",
    tags: (data.tags as string[]) || [],
    coverImage: (data.coverImage as string) || "",
  };
}

export function getAllPosts(): BlogPost[] {
  const slugs = getAllPostSlugs();
  const posts = slugs
    .map(({ params }) => getPostBySlug(params.slug))
    .sort((post1, post2) =>
      new Date(post1.date) > new Date(post2.date) ? -1 : 1,
    );

  return posts;
}
