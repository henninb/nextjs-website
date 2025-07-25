import React from "react";
import Head from "next/head";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  useTheme,
  alpha,
  Stack,
  Link,
} from "@mui/material";
import {
  Calculate,
  NetworkCheck,
  Code,
  Security,
  Email,
  Speed,
  Description,
  FindInPage,
  VpnKey,
  Schedule,
  LaunchOutlined,
} from "@mui/icons-material";

const toolsData = [
  {
    category: "Calculators & Math",
    color: "primary",
    tools: [
      {
        name: "Calculator",
        url: "https://www.calculator.net",
        description:
          "Comprehensive online calculator for all mathematical operations",
        icon: <Calculate />,
      },
    ],
  },
  {
    category: "Network & IP Tools",
    color: "info",
    tools: [
      {
        name: "IP Info",
        url: "https://ipinfo.io",
        description:
          "Get detailed information about any IP address location and ISP",
        icon: <NetworkCheck />,
      },
      {
        name: "IPVoid",
        url: "https://www.ipvoid.com",
        description:
          "Multiple IP address analysis tools and reputation checking",
        icon: <Security />,
      },
      {
        name: "MXToolbox",
        url: "https://mxtoolbox.com",
        description:
          "Email server testing, DNS lookup, and network diagnostic tools",
        icon: <Email />,
      },
      {
        name: "Fast.com",
        url: "https://fast.com",
        description:
          "Simple and accurate internet speed test powered by Netflix",
        icon: <Speed />,
      },
    ],
  },
  {
    category: "Development Tools",
    color: "secondary",
    tools: [
      {
        name: "PurifyCSS",
        url: "https://purifycss.online",
        description: "Remove unused CSS and optimize your stylesheets",
        icon: <Code />,
      },
      {
        name: "RegExr",
        url: "https://regexr.com",
        description:
          "Learn, build, and test Regular Expressions with real-time visualization",
        icon: <FindInPage />,
      },
      {
        name: "JWT.io",
        url: "https://jwt.io",
        description: "Decode, verify and generate JSON Web Tokens",
        icon: <VpnKey />,
      },
    ],
  },
  {
    category: "Utilities",
    color: "success",
    tools: [
      {
        name: "Pastebin",
        url: "https://pastebin.com",
        description:
          "Share and store text snippets, code, and documents online",
        icon: <Description />,
      },
      {
        name: "Time and Date",
        url: "https://www.timeanddate.com",
        description: "World clock, calendar, time zones, and date calculations",
        icon: <Schedule />,
      },
    ],
  },
];

export default function Tools() {
  const theme = useTheme();

  const handleToolClick = (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <Head>
        <title>Developer Tools & Utilities</title>
        <meta
          name="description"
          content="Collection of useful online tools for developers, network analysis, and productivity"
        />
      </Head>

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
            Developer Tools & Utilities
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
            Curated collection of essential tools for developers and power users
          </Typography>
          <Stack
            direction="row"
            spacing={1}
            justifyContent="center"
            flexWrap="wrap"
          >
            <Chip
              label={`${toolsData.reduce((acc, cat) => acc + cat.tools.length, 0)} Tools`}
              color="primary"
              variant="outlined"
            />
            <Chip
              label={`${toolsData.length} Categories`}
              color="secondary"
              variant="outlined"
            />
            <Chip label="External Links" color="info" variant="outlined" />
          </Stack>
        </Box>

        {toolsData.map((category, categoryIndex) => (
          <Box key={category.category} sx={{ mb: 6 }}>
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="h4"
                component="h2"
                gutterBottom
                sx={{
                  fontWeight: 600,
                  color: theme.palette[category.color].main,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                {category.category}
                <Chip
                  label={category.tools.length}
                  size="small"
                  color={category.color}
                  sx={{ ml: 1 }}
                />
              </Typography>
            </Box>

            <Grid container spacing={3}>
              {category.tools.map((tool, toolIndex) => (
                <Grid item xs={12} sm={6} md={4} key={tool.name}>
                  <Card
                    elevation={4}
                    sx={{
                      height: "100%",
                      background: `linear-gradient(135deg, ${alpha(theme.palette[category.color].main, 0.05)} 0%, ${alpha(theme.palette[category.color].main, 0.1)} 100%)`,
                      border: `1px solid ${alpha(theme.palette[category.color].main, 0.2)}`,
                      transition: "all 0.3s ease-in-out",
                      cursor: "pointer",
                      "&:hover": {
                        transform: "translateY(-8px)",
                        boxShadow: theme.shadows[12],
                        border: `1px solid ${alpha(theme.palette[category.color].main, 0.4)}`,
                      },
                    }}
                    onClick={() => handleToolClick(tool.url)}
                  >
                    <CardContent
                      sx={{
                        p: 3,
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 2 }}
                      >
                        <Box
                          sx={{
                            mr: 2,
                            p: 1.5,
                            borderRadius: 2,
                            backgroundColor: alpha(
                              theme.palette[category.color].main,
                              0.1,
                            ),
                            color: theme.palette[category.color].main,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {tool.icon}
                        </Box>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography
                            variant="h6"
                            component="h3"
                            fontWeight={600}
                            sx={{ mb: 0.5 }}
                          >
                            {tool.name}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          sx={{
                            color: theme.palette[category.color].main,
                            backgroundColor: alpha(
                              theme.palette[category.color].main,
                              0.1,
                            ),
                            "&:hover": {
                              backgroundColor: alpha(
                                theme.palette[category.color].main,
                                0.2,
                              ),
                              transform: "scale(1.1)",
                            },
                          }}
                        >
                          <LaunchOutlined fontSize="small" />
                        </IconButton>
                      </Box>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          flexGrow: 1,
                          mb: 2,
                          lineHeight: 1.6,
                        }}
                      >
                        {tool.description}
                      </Typography>

                      <Box sx={{ mt: "auto" }}>
                        <Link
                          href={tool.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          underline="none"
                          onClick={(e) => e.stopPropagation()}
                          sx={{
                            color: theme.palette[category.color].main,
                            fontSize: "0.875rem",
                            fontWeight: 500,
                            "&:hover": {
                              textDecoration: "underline",
                            },
                          }}
                        >
                          {tool.url.replace(/^https?:\/\//, "")}
                        </Link>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        ))}

        <Box
          sx={{
            mt: 6,
            p: 4,
            textAlign: "center",
            background: `linear-gradient(135deg, ${alpha(theme.palette.grey[500], 0.05)} 0%, ${alpha(theme.palette.grey[500], 0.1)} 100%)`,
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.grey[500], 0.2)}`,
          }}
        >
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Missing a Tool?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            These are carefully selected external tools. All links open in new
            tabs for your convenience.
          </Typography>
        </Box>
      </Container>
    </>
  );
}
