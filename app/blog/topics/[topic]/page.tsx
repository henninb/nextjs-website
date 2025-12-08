import { Metadata } from "next";
import { getAllPosts } from "../../../../utils/blog";
import BlogTopicClient from "./BlogTopicClient";

const TOPICS = ["nextjs", "typescript", "webdev", "docker", "ai"];

export const revalidate = 3600; // Revalidate every hour

export async function generateStaticParams() {
  return TOPICS.map((topic) => ({
    topic,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ topic: string }>;
}): Promise<Metadata> {
  const { topic } = await params;
  const topicTitles: Record<string, string> = {
    nextjs: "Next.js",
    typescript: "TypeScript",
    webdev: "Web Development",
    docker: "Docker",
    ai: "AI & Machine Learning",
  };

  const title = topicTitles[topic] || topic;

  return {
    title: `${title} Articles | Professional Development Blog`,
    description: `Explore articles about ${title}. Learn best practices, tips, and advanced techniques.`,
  };
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
  const allPosts = getAllPosts();
  const posts = allPosts.filter((post) => post.tags?.includes(topic));

  return <BlogTopicClient posts={posts} topic={topic} />;
}
