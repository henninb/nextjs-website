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
  Card,
  CardContent,
  Avatar,
  InputAdornment,
  IconButton,
  useTheme,
} from "@mui/material";
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
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
  const theme = useTheme();

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
      setErrorMessage(error.message || "Failed login. Please try again.");
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
        <title>Login - Secure Access</title>
        <meta name="description" content="Login to your account securely" />
      </Head>
      <Container
        maxWidth="sm"
        sx={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ffffff",
          padding: 3,
        }}
      >
        <Card
          elevation={3}
          sx={{
            width: "100%",
            maxWidth: 450,
            borderRadius: 2,
            backgroundColor: "#ffffff",
            border: "1px solid #e0e0e0",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          }}
        >
          <CardContent sx={{ padding: 5 }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  mb: 2,
                  backgroundColor: theme.palette.primary.main,
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                }}
              >
                <LoginIcon sx={{ fontSize: 32, color: "#ffffff" }} />
              </Avatar>
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 600,
                  color: "#333333",
                  textAlign: "center",
                  mb: 1,
                }}
              >
                Welcome Back
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "#666666",
                  textAlign: "center",
                }}
              >
                Enter your credentials to access your account
              </Typography>
            </Box>

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
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: "#666666" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1,
                    backgroundColor: "#ffffff",
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: theme.palette.primary.main,
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: theme.palette.primary.main,
                      borderWidth: 2,
                    },
                  },
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
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: "#666666" }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleTogglePassword}
                        disabled={isLoading}
                        sx={{
                          color: "#666666",
                          "&:hover": {
                            color: theme.palette.primary.main,
                          },
                        }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1,
                    backgroundColor: "#ffffff",
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: theme.palette.primary.main,
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: theme.palette.primary.main,
                      borderWidth: 2,
                    },
                  },
                }}
              />

              {errorMessage && (
                <Alert
                  severity="error"
                  sx={{
                    mt: 2,
                    borderRadius: 1,
                    backgroundColor: "#ffebee",
                    border: "1px solid #ffcdd2",
                    color: "#c62828",
                  }}
                >
                  {errorMessage}
                </Alert>
              )}

              <Button
                id="submit"
                type="submit"
                fullWidth
                variant="contained"
                disabled={isLoading || !email || !password}
                sx={{
                  mt: 3,
                  mb: 2,
                  height: 48,
                  borderRadius: 1,
                  fontSize: "1rem",
                  fontWeight: 500,
                  backgroundColor: theme.palette.primary.main,
                  color: "#ffffff",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                  "&:hover": {
                    backgroundColor:
                      theme.palette.primary.dark || theme.palette.primary.main,
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                  },
                  "&:disabled": {
                    backgroundColor: "#e0e0e0",
                    color: "#9e9e9e",
                    boxShadow: "none",
                  },
                }}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </>
  );
}
