"use client";

import dynamic from "next/dynamic";
import { Box, CircularProgress } from "@mui/material";
import { MDXRemoteSerializeResult } from "next-mdx-remote";

const BlogPostClient = dynamic(() => import("./BlogPostClient"), {
  ssr: false,
  loading: () => (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="50vh"
    >
      <CircularProgress />
    </Box>
  ),
});

interface BlogPostClientWrapperProps {
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

export default function BlogPostClientWrapper({
  post,
}: BlogPostClientWrapperProps) {
  return <BlogPostClient post={post} />;
}
