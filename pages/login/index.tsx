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
import cookie from "js-cookie";

export default function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const { login } = useAuth();
  const router = useRouter();

  const userLogin = async (payload: {
    email: string;
    password: string;
  }): Promise<any> => {
    const endpoint = "/api/login";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  };


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = { email, password };
  
    try {
      const response = await userLogin(data);
      if (response.token) {
        sessionStorage.setItem("token", response.token);
        cookie.set("token", response.token, { expires: 1 });
        login(response.token);
        sessionStorage.setItem("isAuthenticated", "true");
        router.push("/");
      } else {
        setErrorMessage(response.error || "Failed login. Please check your credentials.");
      }
      console.log("response: " + JSON.stringify(response));
    } catch (error: any) {
      setErrorMessage("Failed login. Please try again.");
      console.error("Login error:", error);
    }
  };

  // const handleSubmit = async (event: any) => {
  //   event.preventDefault();

  //   const data = { email, password };

  //   try {
  //     const response = await userLogin(data);
  //     if (response.ok) {
  //       sessionStorage.setItem("token", response.token);
  //       cookie.set("token", response.token, { expires: 1 });
  //       login(response.token);
  //       sessionStorage.setItem("isAuthenticated", "true");
  //       router.push("/");
  //     } else {
  //       setErrorMessage("Failed login. Please check your credentials.");
  //     }
  //     console.log("response: " + JSON.stringify(response));
  //   } catch (error: any) {
  //     if (error.response && error.response.status === 403) {
  //       setErrorMessage("Failed login. Please check your credentials.");
  //     } else {
  //       setErrorMessage("Failed login. Please try again.");
  //     }
  //     console.error("Registration error:", error);
  //   }
  // };

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
