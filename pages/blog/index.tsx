import React, { useState, useMemo } from "react";
import { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { getAllPosts } from "../../components/blog";
import { format } from "date-fns";
import { BlogPost } from "../../model/BlogPost";
import { ThemeProvider } from "@mui/material/styles";
import { blogTheme } from "../../themes/blogTheme";

import {
  Container,
  Typography,
  Box,
  Card,
  Grid,
  CardContent,
  Chip,
  Button,
  Avatar,
  Stack,
  alpha,
  useTheme,
  CardMedia,
  Fade,
  IconButton,
} from "@mui/material";
import {
  CalendarToday,
  Person,
  ArrowForward,
  BookmarkBorder,
  Share,
} from "@mui/icons-material";

interface BlogIndexProps {
  posts: BlogPost[];
}

const TOPICS = [
  { label: "All", value: "all" },
  { label: "Next.js", value: "nextjs" },
  { label: "TypeScript", value: "typescript" },
  { label: "Web Dev", value: "webdev" },
];

export default function BlogIndex({ posts }: BlogIndexProps) {
  const [selectedTopic, setSelectedTopic] = useState("all");
  const theme = useTheme();

  const filteredPosts = useMemo(() => {
    if (selectedTopic === "all") return posts;
    return posts.filter((post) => post.tags?.includes(selectedTopic));
  }, [posts, selectedTopic]);

  const featuredPost = posts[0]; // Most recent post as featured

  return (
    <ThemeProvider theme={blogTheme}>
      <Head>
        <title>Blog | Professional Development Insights</title>
        <meta
          name="description"
          content="Explore cutting-edge articles on Next.js, TypeScript, and modern web development. Stay updated with the latest trends and best practices."
        />
        <meta
          name="keywords"
          content="nextjs, typescript, web development, react, javascript, programming"
        />
      </Head>

      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          py: { xs: 8, md: 12 },
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.05) 0%, transparent 70%)",
            zIndex: 0,
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
          <Box textAlign="center" mb={6}>
            <Typography
              variant="h1"
              component="h1"
              sx={{
                mb: 3,
                background:
                  "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Dev Insights
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                maxWidth: "600px",
                mx: "auto",
                mb: 4,
                color: "text.secondary",
                fontSize: "1.25rem",
              }}
            >
              Dive deep into modern web development, explore cutting-edge
              technologies, and discover best practices that shape the future of
              development.
            </Typography>

            {/* Topic Filter Buttons */}
            <Stack
              direction="row"
              spacing={2}
              justifyContent="center"
              flexWrap="wrap"
              sx={{ gap: 2 }}
            >
              {TOPICS.map((topic) =>
                topic.value === "all" ? (
                  <Button
                    key={topic.value}
                    variant={
                      selectedTopic === topic.value ? "contained" : "outlined"
                    }
                    onClick={() => setSelectedTopic(topic.value)}
                    sx={{
                      borderRadius: "25px",
                      px: 3,
                      py: 1,
                      fontWeight: 600,
                      textTransform: "none",
                    }}
                  >
                    {topic.label}
                  </Button>
                ) : (
                  <Button
                    key={topic.value}
                    component={Link}
                    href={`/blog/topics/${topic.value}`}
                    variant="outlined"
                    sx={{
                      borderRadius: "25px",
                      px: 3,
                      py: 1,
                      fontWeight: 600,
                      textTransform: "none",
                    }}
                  >
                    {topic.label}
                  </Button>
                ),
              )}
            </Stack>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        {/* Featured Post */}
        {featuredPost && selectedTopic === "all" && (
          <Fade in={true}>
            <Box mb={8}>
              <Typography
                variant="h4"
                sx={{
                  mb: 4,
                  fontWeight: 700,
                  color: "text.primary",
                  position: "relative",
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    bottom: "-8px",
                    left: 0,
                    width: "80px",
                    height: "3px",
                    background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
                    borderRadius: "2px",
                  },
                }}
              >
                Featured Article
              </Typography>

              <Link
                href={`/blog/${featuredPost.slug}`}
                passHref
                style={{ textDecoration: "none" }}
              >
                <Card
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    minHeight: { md: 400 },
                    cursor: "pointer",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      transform: "translateY(-8px)",
                      boxShadow:
                        "0 20px 60px rgba(0, 0, 0, 0.4), 0 8px 24px rgba(99, 102, 241, 0.2)",
                    },
                  }}
                >
                  {featuredPost.coverImage && (
                    <CardMedia
                      component="img"
                      sx={{
                        width: { xs: "100%", md: "50%" },
                        height: { xs: 250, md: "auto" },
                        objectFit: "cover",
                      }}
                      image={featuredPost.coverImage}
                      alt={featuredPost.title}
                    />
                  )}

                  <Box
                    sx={{ display: "flex", flexDirection: "column", flex: 1 }}
                  >
                    <CardContent sx={{ flex: 1, p: 4 }}>
                      <Box display="flex" alignItems="center" mb={2}>
                        <CalendarToday
                          sx={{
                            mr: 1,
                            fontSize: "1rem",
                            color: "text.secondary",
                          }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {format(new Date(featuredPost.date), "MMMM dd, yyyy")}
                        </Typography>
                        {featuredPost.author && (
                          <>
                            <Box
                              sx={{
                                mx: 2,
                                width: 4,
                                height: 4,
                                backgroundColor: "text.secondary",
                                borderRadius: "50%",
                              }}
                            />
                            <Person
                              sx={{
                                mr: 1,
                                fontSize: "1rem",
                                color: "text.secondary",
                              }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              {featuredPost.author}
                            </Typography>
                          </>
                        )}
                      </Box>

                      <Typography
                        variant="h3"
                        component="h2"
                        sx={{
                          mb: 2,
                          fontWeight: 700,
                          color: "text.primary",
                          lineHeight: 1.2,
                        }}
                      >
                        {featuredPost.title}
                      </Typography>

                      <Typography
                        variant="body1"
                        sx={{
                          mb: 3,
                          color: "text.secondary",
                          lineHeight: 1.6,
                        }}
                      >
                        {featuredPost.excerpt}
                      </Typography>

                      {featuredPost.tags && featuredPost.tags.length > 0 && (
                        <Box
                          sx={{
                            display: "flex",
                            gap: 1,
                            flexWrap: "wrap",
                            mb: 3,
                          }}
                        >
                          {featuredPost.tags.map((tag) => (
                            <Chip
                              key={tag}
                              label={tag}
                              size="small"
                              sx={{
                                textTransform: "capitalize",
                                fontWeight: 500,
                              }}
                            />
                          ))}
                        </Box>
                      )}

                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Button
                          endIcon={<ArrowForward />}
                          sx={{
                            fontWeight: 600,
                            color: "primary.main",
                            "&:hover": {
                              backgroundColor: "transparent",
                            },
                          }}
                        >
                          Read Full Article
                        </Button>

                        <Box>
                          <IconButton size="small" sx={{ mr: 1 }}>
                            <BookmarkBorder fontSize="small" />
                          </IconButton>
                          <IconButton size="small">
                            <Share fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Box>
                </Card>
              </Link>
            </Box>
          </Fade>
        )}

        {/* Posts Grid */}
        <Box>
          <Typography
            variant="h4"
            sx={{
              mb: 4,
              fontWeight: 700,
              color: "text.primary",
            }}
          >
            {selectedTopic === "all"
              ? "Latest Articles"
              : `${TOPICS.find((t) => t.value === selectedTopic)?.label} Articles`}
          </Typography>

          <Grid container spacing={4}>
            {filteredPosts
              .slice(selectedTopic === "all" ? 1 : 0)
              .map((post, index) => (
                <Grid size={{ xs: 12, md: 6, lg: 4 }} key={post.slug}>
                  <Fade
                    in={true}
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
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
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
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
        </Box>

        {filteredPosts.length === 0 && (
          <Box textAlign="center" py={8}>
            <Typography variant="h5" color="text.secondary" gutterBottom>
              No articles found
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              No articles match the selected topic. Try selecting a different
              topic.
            </Typography>
            <Button variant="outlined" onClick={() => setSelectedTopic("all")}>
              View All Articles
            </Button>
          </Box>
        )}
      </Container>
    </ThemeProvider>
  );
}

export const getStaticProps: GetStaticProps<BlogIndexProps> = async () => {
  const posts = getAllPosts();

  return {
    props: {
      posts,
    },
    revalidate: 3600, // Revalidate every hour
  };
};
