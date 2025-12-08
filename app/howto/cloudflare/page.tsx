import { Metadata } from "next";
import { Container, Typography, Box } from "@mui/material";

export const metadata: Metadata = {
  title: "Cloudflare Basics - How-To Guide",
  description: "Learn Cloudflare CDN, DNS, and security configuration",
};

export default function CloudflarePage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box>
        <Typography variant="h2" component="h1" gutterBottom>
          Cloudflare Basics
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This guide covers Cloudflare CDN, DNS, and security features.
        </Typography>
      </Box>
    </Container>
  );
}
