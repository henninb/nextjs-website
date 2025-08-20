import React, { useState, FormEvent } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import {
  Container,
  Paper,
  Box,
  TextField,
  Typography,
  Button,
  Alert,
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

export default function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { login } = useAuth();
  const router = useRouter();

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
      throw new Error(`Login failed: ${errorDetail}`);
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
      // Standardize error copy for user-facing message
      setErrorMessage("Login failed. Please try again.");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <>
      <Head>
        <title>Login</title>
        <meta name="description" content="Login to your account" />
      </Head>
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
              <Alert severity="error" variant="outlined" sx={{ mt: 2 }}>
                {errorMessage}
              </Alert>
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
      </Container>
    </>
  );
}
