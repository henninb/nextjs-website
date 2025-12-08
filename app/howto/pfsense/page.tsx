import { Metadata } from "next";
import { Container, Typography, Box } from "@mui/material";

export const metadata: Metadata = {
  title: "pfSense Basics - How-To Guide",
  description: "Learn pfSense firewall and router configuration",
};

export default function PfsensePage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box>
        <Typography variant="h2" component="h1" gutterBottom>
          pfSense Basics
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This guide covers pfSense firewall and router setup.
        </Typography>
      </Box>
    </Container>
  );
}
