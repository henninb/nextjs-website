import React from "react";
import { GetStaticProps, GetStaticPaths } from "next";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import Head from "next/head";
import Link from "next/link";
import { ParsedUrlQuery } from "querystring";
import { getAllPostSlugs, getPostBySlug } from "../../components/blog";
import { format } from "date-fns";
import { ThemeProvider } from "@mui/material/styles";
import { blogTheme } from "../../themes/blogTheme";

import {
  Container,
  Typography,
  Box,
  Chip,
  Avatar,
  Divider,
  Button,
  Paper,
  Stack,
  IconButton,
  Breadcrumbs,
  useTheme,
} from "@mui/material";
import {
  CalendarToday,
  Person,
  Schedule,
  ArrowBack,
  Share,
  BookmarkBorder,
  Twitter,
  LinkedIn,
  Facebook,
} from "@mui/icons-material";

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
  const theme = useTheme();
  const estimatedReadTime = Math.ceil(
    post.content.compiledSource.length / 5000,
  ); // Rough estimate

  return (
    <ThemeProvider theme={blogTheme}>
      <Head>
        <title>{`${post.title} | Professional Development Blog`}</title>
        <meta name="description" content={post.excerpt} />
        <meta name="keywords" content={post.tags?.join(", ")} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:image" content={post.coverImage} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.excerpt} />
        <meta name="twitter:image" content={post.coverImage} />
      </Head>

      {/* Hero Section */}
      <Box
        sx={{
          background:
            "linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.03) 100%)",
          py: { xs: 4, md: 6 },
          position: "relative",
        }}
      >
        <Container maxWidth="md">
          <Breadcrumbs
            aria-label="breadcrumb"
            sx={{
              mb: 3,
              "& .MuiBreadcrumbs-separator": {
                color: "text.secondary",
              },
            }}
          >
            <Link
              href="/blog"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <Typography
                color="text.secondary"
                sx={{
                  "&:hover": {
                    color: "primary.main",
                    textDecoration: "underline",
                  },
                }}
              >
                Blog
              </Typography>
            </Link>
            <Typography color="text.primary" fontWeight={500}>
              Article
            </Typography>
          </Breadcrumbs>

          {post.tags && post.tags.length > 0 && (
            <Box sx={{ mb: 3 }}>
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/blog/topics/${tag}`}
                  passHref
                  style={{ textDecoration: "none", marginRight: "8px" }}
                >
                  <Chip
                    label={tag}
                    size="small"
                    clickable
                    sx={{
                      textTransform: "capitalize",
                      fontWeight: 500,
                      "&:hover": {
                        transform: "translateY(-1px)",
                        boxShadow: "0 4px 8px rgba(99, 102, 241, 0.3)",
                      },
                    }}
                  />
                </Link>
              ))}
            </Box>
          )}

          <Typography
            variant="h1"
            component="h1"
            sx={{
              mb: 4,
              fontWeight: 800,
              lineHeight: 1.1,
              fontSize: { xs: "2.5rem", md: "3.5rem" },
            }}
          >
            {post.title}
          </Typography>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={3}
            alignItems={{ xs: "flex-start", sm: "center" }}
            sx={{ mb: 4 }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              {post.author && (
                <>
                  <Avatar
                    sx={{
                      bgcolor: "primary.main",
                      width: 40,
                      height: 40,
                      fontSize: "1rem",
                      fontWeight: 600,
                    }}
                  >
                    {post.author
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color="text.primary"
                    >
                      {post.author}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Author
                    </Typography>
                  </Box>
                </>
              )}
            </Stack>

            <Stack direction="row" spacing={2} alignItems="center">
              <CalendarToday
                sx={{ fontSize: "1rem", color: "text.secondary" }}
              />
              <Typography variant="body2" color="text.secondary">
                {format(new Date(post.date), "MMMM dd, yyyy")}
              </Typography>

              <Divider orientation="vertical" flexItem />

              <Schedule sx={{ fontSize: "1rem", color: "text.secondary" }} />
              <Typography variant="body2" color="text.secondary">
                {estimatedReadTime} min read
              </Typography>
            </Stack>
          </Stack>

          {/* Social Share Buttons */}
          <Stack direction="row" spacing={1}>
            <IconButton
              size="small"
              sx={{ color: "text.secondary" }}
              onClick={() =>
                navigator.share?.({
                  title: post.title,
                  url: window.location.href,
                })
              }
            >
              <Share fontSize="small" />
            </IconButton>
            <IconButton size="small" sx={{ color: "text.secondary" }}>
              <BookmarkBorder fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              sx={{ color: "#1da1f2" }}
              onClick={() =>
                window.open(
                  `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`,
                  "_blank",
                )
              }
            >
              <Twitter fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              sx={{ color: "#0077b5" }}
              onClick={() =>
                window.open(
                  `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`,
                  "_blank",
                )
              }
            >
              <LinkedIn fontSize="small" />
            </IconButton>
          </Stack>
        </Container>
      </Box>

      {/* Cover Image */}
      {post.coverImage && (
        <Box sx={{ py: { xs: 2, md: 4 } }}>
          <Container maxWidth="lg">
            <Box
              sx={{
                borderRadius: "20px",
                overflow: "hidden",
                boxShadow: "0 16px 48px rgba(0, 0, 0, 0.3)",
                position: "relative",
                "&::after": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background:
                    "linear-gradient(45deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))",
                  zIndex: 1,
                  pointerEvents: "none",
                },
              }}
            >
              <img
                src={post.coverImage}
                alt={post.title}
                style={{
                  width: "100%",
                  height: "auto",
                  maxHeight: "500px",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </Box>
          </Container>
        </Box>
      )}

      {/* Article Content */}
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            backgroundColor: "transparent",
            border: "none",
          }}
        >
          <Box
            className="blog-content"
            sx={{ fontSize: "1.125rem", lineHeight: 1.8 }}
          >
            <MDXRemote {...post.content} />
          </Box>
        </Paper>

        {/* Article Footer */}
        <Box
          sx={{ mt: 8, pt: 4, borderTop: "1px solid", borderColor: "divider" }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={3}
          >
            <Box>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Share this article
              </Typography>
              <Stack direction="row" spacing={1}>
                <IconButton
                  sx={{ color: "#1da1f2" }}
                  onClick={() =>
                    window.open(
                      `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`,
                      "_blank",
                    )
                  }
                >
                  <Twitter />
                </IconButton>
                <IconButton
                  sx={{ color: "#0077b5" }}
                  onClick={() =>
                    window.open(
                      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`,
                      "_blank",
                    )
                  }
                >
                  <LinkedIn />
                </IconButton>
                <IconButton
                  sx={{ color: "#1877f2" }}
                  onClick={() =>
                    window.open(
                      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
                      "_blank",
                    )
                  }
                >
                  <Facebook />
                </IconButton>
              </Stack>
            </Box>

            <Button
              component={Link}
              href="/blog"
              variant="outlined"
              size="large"
              startIcon={<ArrowBack />}
              sx={{
                borderRadius: "25px",
                px: 3,
                py: 1.5,
                fontWeight: 600,
                textTransform: "none",
              }}
            >
              Back to Blog
            </Button>
          </Stack>
        </Box>
      </Container>
    </ThemeProvider>
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
