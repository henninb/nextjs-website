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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Check, Close, Visibility, VisibilityOff } from "@mui/icons-material";
import useUserAccountRegister from "../../hooks/useUserAccountRegister";

interface PasswordValidation {
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasDigit: boolean;
  hasSpecialChar: boolean;
  isValid: boolean;
}

const validatePassword = (password: string): PasswordValidation => {
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecialChar = /[@$!%*?&]/.test(password);

  return {
    hasUppercase,
    hasLowercase,
    hasDigit,
    hasSpecialChar,
    isValid: hasUppercase && hasLowercase && hasDigit && hasSpecialChar,
  };
};

export default function Register() {
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [passwordValidation, setPasswordValidation] =
    useState<PasswordValidation>({
      hasUppercase: false,
      hasLowercase: false,
      hasDigit: false,
      hasSpecialChar: false,
      isValid: false,
    });

  const router = useRouter();
  const registerUserAccount = useUserAccountRegister();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!passwordValidation.isValid) {
      setErrorMessage("Password does not meet the required criteria.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    // Map the form values to the keys expected by the API.
    const registrationPayload = {
      username: email,
      password: password,
      firstName: firstName,
      lastName: lastName,
    };

    try {
      console.log(`reg=${JSON.stringify(registrationPayload)}`);
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationPayload),
        credentials: "include",
      });

      if (response.status === 201) {
        router.push("/login");
      } else {
        setErrorMessage("Registration failed. Please try again.");
      }
    } catch (error) {
      setErrorMessage("Registration failed. Please try again.");
      console.error("Registration error:", error);
    }
  };

  return (
    <>
      <Head>
        <title>Register</title>
      </Head>
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ padding: 4, marginTop: 8 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Register
          </Typography>
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="firstName"
              label="First Name"
              name="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="lastName"
              label="Last Name"
              name="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              type="email"
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
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordValidation(validatePassword(e.target.value));
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            {password && (
              <Box sx={{ mt: 1, mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Password requirements:
                </Typography>
                <List dense>
                  <ListItem disablePadding>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      {passwordValidation.hasUppercase ? (
                        <Check color="success" fontSize="small" />
                      ) : (
                        <Close color="error" fontSize="small" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary="At least one uppercase letter"
                      primaryTypographyProps={{ variant: "body2" }}
                    />
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      {passwordValidation.hasLowercase ? (
                        <Check color="success" fontSize="small" />
                      ) : (
                        <Close color="error" fontSize="small" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary="At least one lowercase letter"
                      primaryTypographyProps={{ variant: "body2" }}
                    />
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      {passwordValidation.hasDigit ? (
                        <Check color="success" fontSize="small" />
                      ) : (
                        <Close color="error" fontSize="small" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary="At least one digit"
                      primaryTypographyProps={{ variant: "body2" }}
                    />
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      {passwordValidation.hasSpecialChar ? (
                        <Check color="success" fontSize="small" />
                      ) : (
                        <Close color="error" fontSize="small" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary="At least one special character (@$!%*?&)"
                      primaryTypographyProps={{ variant: "body2" }}
                    />
                  </ListItem>
                </List>
              </Box>
            )}
            <TextField
              margin="normal"
              required
              fullWidth
              id="confirmPassword"
              label="Confirm Password"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
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
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Register
            </Button>
          </Box>
        </Paper>
      </Container>
    </>
  );
}
