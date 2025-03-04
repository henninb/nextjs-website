import React from "react";
import { GetStaticProps, GetStaticPaths } from "next";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import Head from "next/head";
import { ParsedUrlQuery } from "querystring";
import { getAllPostSlugs, getPostBySlug } from "../../components/blog";
import { format } from "date-fns";

import { Container, Typography, Box, Chip } from "@mui/material";

interface BlogPostProps {
  post: {
    slug: string;
    title: string;
    date: string;
    excerpt: string;
    author?: string;
    tags?: string[];
    coverImage?: string;
    content: MDXRemoteSerializeResult;
  };
}

interface Params extends ParsedUrlQuery {
  slug: string;
}

export default function BlogPost({ post }: BlogPostProps) {
  return (
    <>
      <Head>
        <title>{`${post.title} | Your Blog Name`}</title>
        <meta name="description" content={post.excerpt} />
      </Head>

      <Container maxWidth="md" sx={{ py: 4 }}>
        {post.coverImage && (
          <Box sx={{ mb: 4, borderRadius: 1, overflow: "hidden" }}>
            <img
              src={post.coverImage}
              alt={post.title}
              style={{ width: "100%", height: "auto" }}
            />
          </Box>
        )}

        <Typography variant="h3" component="h1" gutterBottom>
          {post.title}
        </Typography>

        <Box sx={{ display: "flex", gap: 2, mb: 2, alignItems: "center" }}>
          <Typography variant="body2" color="text.secondary">
            {format(new Date(post.date), "MMMM dd, yyyy")}
          </Typography>

          {post.author && (
            <Typography variant="body2" color="text.secondary">
              By {post.author}
            </Typography>
          )}
        </Box>

        {post.tags && post.tags.length > 0 && (
          <Box sx={{ display: "flex", gap: 1, mb: 4, flexWrap: "wrap" }}>
            {post.tags.map((tag) => (
              <Chip key={tag} label={tag} size="small" />
            ))}
          </Box>
        )}

        <Box className="blog-content">
          <MDXRemote {...post.content} />
        </Box>
      </Container>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = getAllPostSlugs();
  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<BlogPostProps, Params> = async ({
  params,
}) => {
  const post = getPostBySlug(params!.slug);
  const mdxSource = await serialize(post.content);

  return {
    props: {
      post: {
        ...post,
        content: mdxSource,
      },
    },
  };
};
