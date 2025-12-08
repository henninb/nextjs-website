import { Metadata } from "next";
import { getAllPostSlugs, getPostBySlug } from "../../../utils/blog";
import { serialize } from "next-mdx-remote/serialize";
import BlogPostClientWrapper from "./BlogPostClientWrapper";

export const revalidate = 3600; // Revalidate every hour

export async function generateStaticParams() {
  const slugs = getAllPostSlugs();
  return slugs.map(({ params }) => ({
    slug: params.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  return {
    title: `${post.title} | Professional Development Blog`,
    description: post.excerpt,
    keywords: post.tags?.join(", "),
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.coverImage ? [post.coverImage] : [],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: post.coverImage ? [post.coverImage] : [],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  const mdxSource = await serialize(post.content);

  const postData = {
    ...post,
    content: mdxSource,
  };

  return <BlogPostClientWrapper post={postData} />;
}
