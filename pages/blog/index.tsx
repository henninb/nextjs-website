import { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { getAllPosts } from "../../components/blog";
import { format } from "date-fns";
import { BlogPost } from "../../model/BlogPost";

import {
  Container,
  Typography,
  Box,
  Card,
  Grid2,
  CardContent,
  Chip,
} from "@mui/material";

interface BlogIndexProps {
  posts: BlogPost[];
}

export default function BlogIndex({ posts }: BlogIndexProps) {
  return (
    <>
      <Head>
        <title>Blog | Your Website</title>
        <meta name="description" content="Latest articles and posts" />
      </Head>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Blog
        </Typography>

        <Grid2 container spacing={4}>
          {posts.map((post) => (
            // <Grid2 item xs={12} sm={6} md={4} key={post.slug}>
            <Grid2 key={post.slug} component="div">
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
                  }}
                >
                  {post.coverImage && (
                    <Box sx={{ pt: "56.25%", position: "relative" }}>
                      <img
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "50%",
                          height: "50%",
                          objectFit: "cover",
                        }}
                        src={post.coverImage}
                        alt={post.title}
                      />
                    </Box>
                  )}

                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h5" component="h2">
                      {post.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      {format(new Date(post.date), "MMMM dd, yyyy")}
                    </Typography>

                    <Typography variant="body2">{post.excerpt}</Typography>

                    {post.tags && post.tags.length > 0 && (
                      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                        {post.tags.map((tag) => (
                          <Chip key={tag} label={tag} size="small" />
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Link>
            </Grid2>
          ))}
        </Grid2>
      </Container>
    </>
  );
}

export const getStaticProps: GetStaticProps<BlogIndexProps> = async () => {
  const posts = getAllPosts();

  return {
    props: {
      posts,
    },
  };
};
