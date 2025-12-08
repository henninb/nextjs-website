"use client";

import React from "react";
import Link from "next/link";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  useTheme,
  alpha,
  CardActionArea,
} from "@mui/material";
import {
  CloudQueue,
  Computer,
  Security,
  Terminal,
  Code,
  Router,
  StorageRounded,
  Dns,
} from "@mui/icons-material";

interface HowToGuide {
  title: string;
  href: string;
  description: string;
  icon: React.ReactNode;
  color: "primary" | "secondary" | "success" | "info" | "warning" | "error";
}

export default function HowtoPage() {
  const theme = useTheme();

  const guides: HowToGuide[] = [
    {
      title: "Docker",
      href: "/howto/docker",
      description: "Containerization and Docker deployment guides",
      icon: <Dns />,
      color: "info",
    },
    {
      title: "Cloudflare",
      href: "/howto/cloudflare",
      description: "CDN, DNS, and security configuration",
      icon: <CloudQueue />,
      color: "warning",
    },
    {
      title: "Debian",
      href: "/howto/debian",
      description: "Debian Linux system administration",
      icon: <Computer />,
      color: "error",
    },
    {
      title: "F5",
      href: "/howto/f5",
      description: "F5 load balancer configuration",
      icon: <Security />,
      color: "secondary",
    },
    {
      title: "Gentoo",
      href: "/howto/gentoo",
      description: "Gentoo Linux installation and configuration",
      icon: <Terminal />,
      color: "primary",
    },
    {
      title: "NextJS",
      href: "/howto/nextjs",
      description: "Next.js development and deployment",
      icon: <Code />,
      color: "success",
    },
    {
      title: "Proxmox",
      href: "/howto/proxmox",
      description: "Proxmox virtualization platform",
      icon: <StorageRounded />,
      color: "info",
    },
    {
      title: "pfSense",
      href: "/howto/pfsense",
      description: "pfSense firewall and router setup",
      icon: <Router />,
      color: "warning",
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ textAlign: "center", mb: 6 }}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 700,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            mb: 2,
          }}
        >
          How-To Guides
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          Technical guides and tutorials for modern infrastructure and
          development
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {guides.map((guide, index) => (
          // @ts-expect-error - MUI v7 Grid type issue with item prop
          <Grid item xs={12} sm={6} md={4} lg={3} key={guide.href}>
            <Link
              href={guide.href}
              passHref
              style={{ textDecoration: "none" }}
              legacyBehavior
            >
              <Card
                elevation={4}
                sx={{
                  height: "100%",
                  background: `linear-gradient(135deg, ${alpha(theme.palette[guide.color].main, 0.05)} 0%, ${alpha(theme.palette[guide.color].main, 0.1)} 100%)`,
                  border: `1px solid ${alpha(theme.palette[guide.color].main, 0.2)}`,
                  transition: "all 0.3s ease-in-out",
                  "&:hover": {
                    transform: "translateY(-8px)",
                    boxShadow: theme.shadows[12],
                    border: `1px solid ${alpha(theme.palette[guide.color].main, 0.4)}`,
                  },
                }}
              >
                <CardActionArea sx={{ height: "100%" }}>
                  <CardContent
                    sx={{
                      p: 3,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                    }}
                  >
                    <Box
                      sx={{
                        mb: 2,
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: alpha(
                          theme.palette[guide.color].main,
                          0.1,
                        ),
                        color: theme.palette[guide.color].main,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 48,
                      }}
                    >
                      {guide.icon}
                    </Box>
                    <Typography
                      variant="h5"
                      component="h2"
                      fontWeight={600}
                      sx={{ mb: 1.5, color: "text.primary" }}
                    >
                      {guide.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ lineHeight: 1.6 }}
                    >
                      {guide.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Link>
          </Grid>
        ))}
      </Grid>

      <Box
        sx={{
          mt: 6,
          p: 3,
          textAlign: "center",
          background: `linear-gradient(135deg, ${alpha(theme.palette.grey[500], 0.05)} 0%, ${alpha(theme.palette.grey[500], 0.1)} 100%)`,
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.grey[500], 0.2)}`,
        }}
      >
        <Typography variant="h6" gutterBottom fontWeight={600}>
          More Guides Coming Soon
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Technical documentation for infrastructure, DevOps, and system
          administration
        </Typography>
      </Box>
    </Container>
  );
}
