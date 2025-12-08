import { Metadata } from "next";
import { Container, Typography, Box } from "@mui/material";

export const metadata: Metadata = {
  title: "Debian Basics - How-To Guide",
  description: "Learn Debian Linux system administration and package management",
};

export default function DebianPage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box>
        <Typography variant="h2" component="h1" gutterBottom>
          Debian Basics
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This guide covers Debian Linux system administration.
        </Typography>
      </Box>
    </Container>
  );
}
