import { Metadata } from "next";
import { getAllPosts } from "../../utils/blog";
import BlogIndexClient from "./BlogIndexClient";

export const metadata: Metadata = {
  title: "Blog | Professional Development Insights",
  description:
    "Explore cutting-edge articles on Next.js, TypeScript, and modern web development. Stay updated with the latest trends and best practices.",
  keywords:
    "nextjs, typescript, web development, react, javascript, programming",
};

export const revalidate = 3600; // Revalidate every hour

export default async function BlogPage() {
  const posts = getAllPosts();

  return <BlogIndexClient posts={posts} />;
}
