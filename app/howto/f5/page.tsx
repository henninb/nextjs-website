import { Metadata } from "next";
import { Container, Typography, Box } from "@mui/material";

export const metadata: Metadata = {
  title: "F5 Basics - How-To Guide",
  description: "Learn F5 load balancer configuration and management",
};

export default function F5Page() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box>
        <Typography variant="h2" component="h1" gutterBottom>
          F5 Basics
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This guide covers F5 load balancer configuration.
        </Typography>
      </Box>
    </Container>
  );
}
