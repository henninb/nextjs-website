import { Metadata } from "next";
import { Container, Typography, Box } from "@mui/material";

export const metadata: Metadata = {
  title: "Gentoo Basics - How-To Guide",
  description: "Learn Gentoo Linux installation and configuration",
};

export default function GentooPage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box>
        <Typography variant="h2" component="h1" gutterBottom>
          Gentoo Basics
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This guide covers Gentoo Linux installation and configuration.
        </Typography>
      </Box>
    </Container>
  );
}
