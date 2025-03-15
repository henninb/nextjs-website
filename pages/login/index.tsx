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
} from "@mui/material";
import { useAuth } from "../../components/AuthProvider";

export default function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const { login } = useAuth();
  const router = useRouter();

  const userLogin = async (payload: { email: string; password: string }): Promise<void> => {
    const endpoint = "https://finance.lan/api/login";

    // Map the form's "email" value to the "username" key expected by the API.
    const loginPayload = {
      username: payload.email,
      password: payload.password,
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginPayload),
      credentials: "include", // ensures cookies are sent and received
    });

    // If the response is 204 (No Content), treat it as success.
    if (response.status === 204) {
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
    const data = { email, password };

    try {
      await userLogin(data);
      // The JWT is set as an HTTP-only cookie by the backend.
      // Update your client auth state (if needed) and redirect.
      login(); // e.g. sets a flag in your context to indicate authentication
      router.push("/");
    } catch (error: any) {
      setErrorMessage(error.message || "Failed login. Please try again.");
      console.error("Login error:", error);
    }
  };

  return (
    <>
      <Head>
        <title>Login</title>
      </Head>
      <Container
        maxWidth="sm"
        sx={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: "100%" }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Login
          </Typography>
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="password"
              label="Password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {errorMessage && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {errorMessage}
              </Alert>
            )}
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3 }}>
              Login
            </Button>
          </Box>
        </Paper>
      </Container>
    </>
  );
}
