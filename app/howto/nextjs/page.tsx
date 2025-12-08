import { Metadata } from "next";
import { Container, Typography, Box } from "@mui/material";

export const metadata: Metadata = {
  title: "NextJS Basics - How-To Guide",
  description: "Learn Next.js fundamentals, features, and best practices",
};

export default function NextjsPage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box>
        <Typography variant="h2" component="h1" gutterBottom>
          NextJS Basics
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This guide covers Next.js fundamentals and best practices.
        </Typography>
      </Box>
    </Container>
  );
}
