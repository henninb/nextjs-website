import React from "react";
import { GetStaticProps, GetStaticPaths } from "next";
import Head from "next/head";
import Link from "next/link";
import { getAllPosts } from "../../../components/blog";
import { format } from "date-fns";
import { BlogPost } from "../../../model/BlogPost";
import { ThemeProvider } from "@mui/material/styles";
import { blogTheme } from "../../../themes/blogTheme";

import {
  Container,
  Typography,
  Box,
  Card,
  Grid,
  CardContent,
  Chip,
  Button,
  Stack,
  alpha,
  useTheme,
  CardMedia,
  Fade,
  Breadcrumbs,
} from "@mui/material";
import {
  CalendarToday,
  Person,
  ArrowBack,
  Code,
  RocketLaunch,
  Web,
  Storage,
  Psychology,
} from "@mui/icons-material";

interface TopicPageProps {
  posts: BlogPost[];
  topic: string;
}

const TOPIC_CONFIG = {
  nextjs: {
    title: "Next.js",
    description:
      "Build production-ready React applications with Next.js. Learn about SSR, SSG, API routes, and performance optimization.",
    icon: RocketLaunch,
    color: "#000000",
    gradient: "linear-gradient(135deg, #000000 0%, #1f1f1f 50%, #333333 100%)",
  },
  typescript: {
    title: "TypeScript",
    description:
      "Master TypeScript for better code quality, enhanced developer experience, and robust application architecture.",
    icon: Code,
    color: "#3178c6",
    gradient: "linear-gradient(135deg, #3178c6 0%, #235a97 100%)",
  },
  webdev: {
    title: "Web Development",
    description:
      "Explore modern web development practices, tools, and techniques to build outstanding web experiences.",
    icon: Web,
    color: "#61dafb",
    gradient: "linear-gradient(135deg, #61dafb 0%, #21759b 100%)",
  },
  docker: {
    title: "Docker",
    description:
      "Learn containerization with Docker. From basic concepts to advanced orchestration, deployment strategies, and production best practices.",
    icon: Storage,
    color: "#2496ed",
    gradient: "linear-gradient(135deg, #2496ed 0%, #0db7ed 100%)",
  },
  ai: {
    title: "AI & Machine Learning",
    description:
      "Discover artificial intelligence, machine learning, and modern AI tools. Build intelligent applications and understand AI infrastructure.",
    icon: Psychology,
    color: "#ff6b6b",
    gradient: "linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)",
  },
};

export default function TopicPage({ posts, topic }: TopicPageProps) {
  const theme = useTheme();
  const config = TOPIC_CONFIG[topic as keyof typeof TOPIC_CONFIG];

  if (!config) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: "center" }}>
        <Typography variant="h4" gutterBottom>
          Topic Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          The topic you're looking for doesn't exist.
        </Typography>
        <Button
          component={Link}
          href="/blog"
          variant="contained"
          startIcon={<ArrowBack />}
        >
          Back to Blog
        </Button>
      </Container>
    );
  }

  const Icon = config.icon;

  return (
    <ThemeProvider theme={blogTheme}>
      <Head>
        <title>{`${config.title} Articles | Professional Development Blog`}</title>
        <meta
          name="description"
          content={`${config.description} Browse our collection of ${config.title.toLowerCase()} articles and tutorials.`}
        />
        <meta
          name="keywords"
          content={`${topic}, ${config.title.toLowerCase()}, web development, programming, tutorials`}
        />
      </Head>

      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${alpha(config.color, 0.1)} 0%, ${alpha(config.color, 0.05)} 100%)`,
          py: { xs: 6, md: 10 },
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(circle at 30% 70%, ${alpha(config.color, 0.08)} 0%, transparent 50%)`,
            zIndex: 0,
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
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
              {config.title}
            </Typography>
          </Breadcrumbs>

          <Box display="flex" alignItems="center" mb={4}>
            <Box
              sx={{
                p: 2,
                borderRadius: "16px",
                background: config.gradient,
                mr: 3,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon sx={{ fontSize: 40, color: "white" }} />
            </Box>

            <Box>
              <Typography
                variant="h2"
                component="h1"
                sx={{
                  fontWeight: 800,
                  mb: 1,
                  background: config.gradient,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {config.title}
              </Typography>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ fontWeight: 400 }}
              >
                {posts.length} {posts.length === 1 ? "article" : "articles"}{" "}
                available
              </Typography>
            </Box>
          </Box>

          <Typography
            variant="body1"
            sx={{
              maxWidth: "800px",
              color: "text.secondary",
              fontSize: "1.125rem",
              lineHeight: 1.6,
            }}
          >
            {config.description}
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        {posts.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Icon sx={{ fontSize: 80, color: "text.secondary", mb: 3 }} />
            <Typography variant="h5" color="text.secondary" gutterBottom>
              No {config.title} articles yet
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Stay tuned! We're working on some great{" "}
              {config.title.toLowerCase()} content.
            </Typography>
            <Button
              component={Link}
              href="/blog"
              variant="outlined"
              startIcon={<ArrowBack />}
            >
              Browse All Articles
            </Button>
          </Box>
        ) : (
          <Grid container spacing={4}>
            {posts.map((post, index) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={post.slug}>
                <Fade in={true} style={{ transitionDelay: `${index * 100}ms` }}>
                  <Link
                    href={`/blog/${post.slug}`}
                    passHref
                    style={{ textDecoration: "none" }}
                  >
                    <Card
                      sx={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        cursor: "pointer",
                        position: "relative",
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          height: "4px",
                          background: config.gradient,
                          borderRadius: "20px 20px 0 0",
                        },
                      }}
                    >
                      {post.coverImage && (
                        <CardMedia
                          component="img"
                          height={200}
                          image={post.coverImage}
                          alt={post.title}
                          sx={{
                            objectFit: "cover",
                            mt: "4px", // Account for the top border
                          }}
                        />
                      )}

                      <CardContent sx={{ flexGrow: 1, p: 3 }}>
                        <Box display="flex" alignItems="center" mb={2}>
                          <CalendarToday
                            sx={{
                              mr: 1,
                              fontSize: "0.875rem",
                              color: "text.secondary",
                            }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {format(new Date(post.date), "MMM dd, yyyy")}
                          </Typography>
                          {post.author && (
                            <>
                              <Box
                                sx={{
                                  mx: 1.5,
                                  width: 3,
                                  height: 3,
                                  backgroundColor: "text.secondary",
                                  borderRadius: "50%",
                                }}
                              />
                              <Person
                                sx={{
                                  mr: 0.5,
                                  fontSize: "0.75rem",
                                  color: "text.secondary",
                                }}
                              />
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {post.author}
                              </Typography>
                            </>
                          )}
                        </Box>

                        <Typography
                          gutterBottom
                          variant="h5"
                          component="h2"
                          sx={{
                            fontWeight: 600,
                            color: "text.primary",
                            mb: 2,
                            lineHeight: 1.3,
                          }}
                        >
                          {post.title}
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 3,
                            lineHeight: 1.6,
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {post.excerpt}
                        </Typography>

                        {post.tags && post.tags.length > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              gap: 0.5,
                              flexWrap: "wrap",
                              mt: "auto",
                            }}
                          >
                            {post.tags.slice(0, 3).map((tag) => (
                              <Chip
                                key={tag}
                                label={tag}
                                size="small"
                                sx={{
                                  textTransform: "capitalize",
                                  fontSize: "0.75rem",
                                  ...(tag === topic && {
                                    background: config.gradient,
                                    color: "white",
                                    fontWeight: 600,
                                  }),
                                }}
                              />
                            ))}
                            {post.tags.length > 3 && (
                              <Chip
                                label={`+${post.tags.length - 3}`}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: "0.75rem" }}
                              />
                            )}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                </Fade>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Back to Blog Button */}
        <Box textAlign="center" mt={8}>
          <Button
            component={Link}
            href="/blog"
            variant="outlined"
            size="large"
            startIcon={<ArrowBack />}
            sx={{
              borderRadius: "25px",
              px: 4,
              py: 1.5,
              fontWeight: 600,
              textTransform: "none",
            }}
          >
            Browse All Articles
          </Button>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const topics = ["nextjs", "typescript", "webdev", "docker", "ai"];

  return {
    paths: topics.map((topic) => ({
      params: { topic },
    })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<TopicPageProps> = async ({
  params,
}) => {
  const topic = params?.topic as string;
  const allPosts = getAllPosts();

  // Filter posts by topic
  const posts = allPosts.filter((post) => post.tags?.includes(topic));

  return {
    props: {
      posts,
      topic,
    },
    revalidate: 3600, // Revalidate every hour
  };
};
