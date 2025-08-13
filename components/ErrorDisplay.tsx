import React from "react";
import {
  Box,
  Typography,
  Button,
  Alert,
  AlertTitle,
  Collapse,
  IconButton,
} from "@mui/material";
import {
  ErrorOutline,
  Refresh,
  ExpandMore,
  ExpandLess,
  WifiOff,
  Warning,
} from "@mui/icons-material";

export interface ErrorDisplayProps {
  error?: Error | string | null;
  title?: string;
  message?: string;
  variant?: "inline" | "card" | "alert";
  severity?: "error" | "warning" | "info";
  showRetry?: boolean;
  showDetails?: boolean;
  onRetry?: () => void;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  title = "Something went wrong",
  message,
  variant = "card",
  severity = "error",
  showRetry = true,
  showDetails = false,
  onRetry,
  className,
}) => {
  const [showErrorDetails, setShowErrorDetails] = React.useState(false);

  const errorMessage = error instanceof Error ? error.message : error || "";
  const displayMessage = message || getErrorMessage(errorMessage);
  const isNetworkError = isNetworkRelated(errorMessage);

  const getIcon = () => {
    if (isNetworkError) return <WifiOff />;
    if (severity === "warning") return <Warning />;
    return <ErrorOutline />;
  };

  const getTitle = () => {
    if (isNetworkError) return "Connection Problem";
    return title;
  };

  if (variant === "alert") {
    return (
      <Alert
        severity={severity}
        action={
          showRetry && onRetry ? (
            <Button
              color="inherit"
              size="small"
              onClick={onRetry}
              startIcon={<Refresh />}
            >
              Retry
            </Button>
          ) : undefined
        }
        className={className}
      >
        <AlertTitle>{getTitle()}</AlertTitle>
        {displayMessage}
        {showDetails && errorMessage && (
          <>
            <IconButton
              size="small"
              onClick={() => setShowErrorDetails(!showErrorDetails)}
              sx={{ ml: 1 }}
            >
              {showErrorDetails ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
            <Collapse in={showErrorDetails}>
              <Box sx={{ mt: 1, fontFamily: "monospace", fontSize: "0.8rem" }}>
                {errorMessage}
              </Box>
            </Collapse>
          </>
        )}
      </Alert>
    );
  }

  if (variant === "inline") {
    return (
      <Box
        display="flex"
        alignItems="center"
        gap={1}
        color={`${severity}.main`}
        className={className}
      >
        {getIcon()}
        <Typography variant="body2" color="inherit">
          {displayMessage}
        </Typography>
        {showRetry && onRetry && (
          <Button size="small" onClick={onRetry} startIcon={<Refresh />}>
            Retry
          </Button>
        )}
      </Box>
    );
  }

  // Card variant (default)
  return (
    <Box
      sx={{
        p: 3,
        border: 1,
        borderColor: `${severity}.light`,
        borderRadius: 2,
        bgcolor: `${severity}.lighter`,
        textAlign: "center",
      }}
      className={className}
    >
      <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
        <Box color={`${severity}.main`} sx={{ fontSize: 48 }}>
          {getIcon()}
        </Box>

        <Typography variant="h6" color={`${severity}.main`}>
          {getTitle()}
        </Typography>

        <Typography variant="body1" color="text.secondary">
          {displayMessage}
        </Typography>

        {showRetry && onRetry && (
          <Button
            variant="outlined"
            color={severity}
            startIcon={<Refresh />}
            onClick={onRetry}
          >
            Try Again
          </Button>
        )}

        {showDetails &&
          errorMessage &&
          process.env.NODE_ENV === "development" && (
            <Box sx={{ mt: 2, width: "100%" }}>
              <Button
                size="small"
                onClick={() => setShowErrorDetails(!showErrorDetails)}
                endIcon={showErrorDetails ? <ExpandLess /> : <ExpandMore />}
              >
                {showErrorDetails ? "Hide" : "Show"} Error Details
              </Button>
              <Collapse in={showErrorDetails}>
                <Box
                  sx={{
                    mt: 1,
                    p: 2,
                    bgcolor: "grey.100",
                    borderRadius: 1,
                    fontFamily: "monospace",
                    fontSize: "0.8rem",
                    textAlign: "left",
                    overflow: "auto",
                    maxHeight: "200px",
                  }}
                >
                  {errorMessage}
                </Box>
              </Collapse>
            </Box>
          )}
      </Box>
    </Box>
  );
};

// Helper functions
function getErrorMessage(errorMessage: string): string {
  // Don't expose sensitive error details to users
  if (isNetworkRelated(errorMessage)) {
    return "Unable to connect to the server. Please check your internet connection and try again.";
  }

  if (errorMessage.includes("404")) {
    return "The requested data could not be found.";
  }

  if (errorMessage.includes("403") || errorMessage.includes("401")) {
    return "You don't have permission to access this data. Please log in and try again.";
  }

  if (errorMessage.includes("500")) {
    return "A server error occurred. Please try again in a few moments.";
  }

  // Generic fallback - don't expose technical details
  return "An unexpected error occurred. Please try again.";
}

function isNetworkRelated(errorMessage: string): boolean {
  const networkKeywords = [
    "fetch",
    "network",
    "connection",
    "timeout",
    "offline",
    "ECONNREFUSED",
    "ETIMEDOUT",
  ];

  return networkKeywords.some((keyword) =>
    errorMessage.toLowerCase().includes(keyword.toLowerCase()),
  );
}

export default ErrorDisplay;
