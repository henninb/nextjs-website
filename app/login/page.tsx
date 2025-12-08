"use client";

import React, { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Paper,
  Box,
  TextField,
  Typography,
  Button,
  InputAdornment,
  IconButton,
} from "@mui/material";
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import User from "../../model/User";
import { useAuth } from "../../components/AuthProvider";
import ErrorDisplay from "../../components/ErrorDisplay";
import SnackbarBaseline from "../../components/SnackbarBaseline";

export default function LoginPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSnackbar, setShowSnackbar] = useState<boolean>(false);

  const { login } = useAuth();
  const router = useRouter();

  // Map technical errors to friendly, login-specific messages
  const getFriendlyErrorMessage = (raw: string): string => {
    try {
      const match = raw.match(/HTTP_(\d{3})/);
      const code = match ? parseInt(match[1], 10) : undefined;

      if (code === 403) {
        return "You don't have access to this account.";
      }
      if (code === 400 || code === 401) {
        return "Invalid email or password.";
      }
      if (code === 429) {
        return "Too many attempts. Please wait and try again.";
      }
      if (code && code >= 500 && code <= 599) {
        return "A server error occurred. Please try again in a few moments.";
      }
    } catch (_) {
      // Ignore parse errors and fall through to heuristics
    }

    const lower = (raw || "").toLowerCase();
    if (
      lower.includes("network") ||
      lower.includes("failed to fetch") ||
      lower.includes("timeout") ||
      lower.includes("offline")
    ) {
      return "Unable to connect to the server. Please check your internet connection and try again.";
    }
    return "Login failed. Please try again.";
  };

  const userLogin = async (payload: {
    email: string;
    password: string;
  }): Promise<void> => {
    const endpoint = "/api/login";

    // Map the form's "email" value to the "username" key expected by the API.
    const loginPayload: User = {
      username: payload.email,
      password: payload.password,
      firstName: "Joe",
      lastName: "User",
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginPayload),
      credentials: "include",
    });

    // If the response is 200 (OK), treat it as success.
    if (response.status === 200) {
      return;
    } else {
      // Try to parse error details if available.
      let errorDetail = "";
      try {
        const body = await response.json();
        errorDetail = body.error || "";
      } catch (err) {
        errorDetail = `status: ${response.status}`;
      }
      // Throw a normalized error without leaking technical details
      throw new Error(`HTTP_${response.status}:${errorDetail}`);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    const data = { email, password };

    try {
      await userLogin(data);
      // After successful login, fetch user data to get proper user information

      try {
        const userResponse = await fetch("/api/me", {
          credentials: "include",
        });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          login(userData);
        } else {
          // Fallback if user data fetch fails
          login({ username: email, password: "", firstName: "", lastName: "" });
        }
      } catch (userError) {
        console.error("Error fetching user data:", userError);
        // Fallback if user data fetch fails
        login({ username: email, password: "", firstName: "", lastName: "" });
      }
      router.push("/finance");
    } catch (error: any) {
      // Normalize to a user-friendly message and avoid technical details
      const raw = (error?.message || "").toString();
      const friendly = getFriendlyErrorMessage(raw);
      setErrorMessage(friendly);
      setShowSnackbar(true);
      if (process.env.NODE_ENV === "development") {
        // Log details in dev only for diagnostics
        console.error("Login error (dev details):", raw);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Login
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          Enter your credentials to access your account.
        </Typography>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            FormHelperTextProps={{ sx: { ml: 0, mt: 0.5, lineHeight: 1.25 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="password"
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            FormHelperTextProps={{ sx: { ml: 0, mt: 0.5, lineHeight: 1.25 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleTogglePassword}
                    disabled={isLoading}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          {errorMessage && (
            <Box sx={{ mt: 2 }}>
              <ErrorDisplay
                variant="alert"
                severity="error"
                title="Sign-in failed"
                // Provide only the friendly message to avoid exposing details
                message={errorMessage}
                showRetry={false}
              />
            </Box>
          )}

          <Button
            id="submit"
            type="submit"
            fullWidth
            variant="contained"
            disabled={isLoading || !email || !password}
            sx={{ mt: 3, mb: 2 }}
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </Button>
        </Box>
      </Paper>
      {/* Snackbar feedback consistent with finance pages */}
      <SnackbarBaseline
        message={errorMessage}
        state={showSnackbar}
        severity="error"
        handleSnackbarClose={() => setShowSnackbar(false)}
      />
    </Container>
  );
}
