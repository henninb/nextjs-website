import React from "react";
import {
  Box,
  CircularProgress,
  Typography,
  Skeleton,
  Card,
  CardContent,
} from "@mui/material";

export interface LoadingStateProps {
  variant?: "spinner" | "skeleton" | "card";
  message?: string;
  size?: "small" | "medium" | "large";
  rows?: number;
  showMessage?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  variant = "spinner",
  message = "Loading...",
  size = "medium",
  rows = 3,
  showMessage = true,
}) => {
  const getSpinnerSize = () => {
    switch (size) {
      case "small":
        return 24;
      case "large":
        return 64;
      default:
        return 40;
    }
  };

  if (variant === "skeleton") {
    return (
      <Box sx={{ width: "100%" }}>
        {Array.from({ length: rows }).map((_, index) => (
          <Box key={index} sx={{ mb: 2 }}>
            <Skeleton
              variant="rectangular"
              width="100%"
              height={size === "small" ? 40 : size === "large" ? 80 : 60}
              sx={{ borderRadius: 1 }}
            />
          </Box>
        ))}
      </Box>
    );
  }

  if (variant === "card") {
    return (
      <Card elevation={2}>
        <CardContent>
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            py={4}
          >
            <CircularProgress size={getSpinnerSize()} sx={{ mb: 2 }} />
            {showMessage && (
              <Typography variant="body2" color="text.secondary">
                {message}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Default spinner variant
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      py={4}
    >
      <CircularProgress size={getSpinnerSize()} />
      {showMessage && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default LoadingState;
