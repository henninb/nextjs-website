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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  InputAdornment,
  IconButton,
} from "@mui/material";
import {
  Check,
  Close,
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
} from "@mui/icons-material";
import useUserAccountRegister from "../../hooks/useUserAccountRegister";
import ErrorDisplay from "../../components/ErrorDisplay";
import SnackbarBaseline from "../../components/SnackbarBaseline";

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

export default function RegisterPage() {
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [firstNameError, setFirstNameError] = useState<string>("");
  const [lastNameError, setLastNameError] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showSnackbar, setShowSnackbar] = useState<boolean>(false);
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

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const hasSpace = (s: string) => /\s/.test(s);

  const validateNamesAndEmail = (): boolean => {
    let ok = true;
    if (!firstName.trim()) {
      setFirstNameError("First name is required.");
      ok = false;
    } else if (hasSpace(firstName)) {
      setFirstNameError("First name cannot contain spaces.");
      ok = false;
    } else {
      setFirstNameError("");
    }

    if (!lastName.trim()) {
      setLastNameError("Last name is required.");
      ok = false;
    } else if (hasSpace(lastName)) {
      setLastNameError("Last name cannot contain spaces.");
      ok = false;
    } else {
      setLastNameError("");
    }

    if (!email.trim()) {
      setEmailError("Email is required.");
      ok = false;
    } else if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address.");
      ok = false;
    } else {
      setEmailError("");
    }
    return ok;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateNamesAndEmail()) {
      return;
    }

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
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationPayload),
        credentials: "include",
      });

      if (response.status === 201) {
        router.push("/login");
      } else {
        let errorDetail = "";
        try {
          const body = await response.json();
          errorDetail = body?.error || body?.message || "";
        } catch (_) {
          errorDetail = `status: ${response.status}`;
        }
        throw new Error(`HTTP_${response.status}:${errorDetail}`);
      }
    } catch (error: any) {
      const raw = (error?.message || "").toString();
      const friendly = getFriendlyErrorMessage(raw);
      setErrorMessage(friendly);
      setShowSnackbar(true);
      if (process.env.NODE_ENV === "development") {
        console.error("Registration error (dev details):", raw);
      }
    }
  };

  // Map technical errors to friendly, registration-specific messages
  const getFriendlyErrorMessage = (raw: string): string => {
    try {
      const match = raw.match(/HTTP_(\d{3})/);
      const code = match ? parseInt(match[1], 10) : undefined;

      if (code === 409) {
        return "An account with this email already exists.";
      }
      if (code === 429) {
        return "Too many attempts. Please wait and try again.";
      }
      if (code === 400 || code === 422) {
        return "Some details look off. Please check and try again.";
      }
      if (code && code >= 500 && code <= 599) {
        return "A server error occurred. Please try again in a few moments.";
      }
    } catch (_) {
      // ignore and fall through
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
    return "Registration failed. Please try again.";
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ padding: 4, marginTop: 8 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Register
        </Typography>
        <Box
          component="form"
          onSubmit={handleSubmit}
          noValidate
          data-testid="auth-form"
        >
          <TextField
            margin="normal"
            required
            fullWidth
            id="firstName"
            label="First Name"
            name="firstName"
            autoComplete="given-name"
            inputProps={{ "data-testid": "input-firstName" }}
            value={firstName}
            onChange={(e) => {
              const v = e.target.value;
              setFirstName(v);
              if (!v.trim()) setFirstNameError("First name is required.");
              else if (hasSpace(v))
                setFirstNameError("First name cannot contain spaces.");
              else setFirstNameError("");
            }}
            error={!!firstNameError}
            helperText={firstNameError || ""}
            FormHelperTextProps={{ sx: { ml: 0, mt: 0.5, lineHeight: 1.25 } }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="lastName"
            label="Last Name"
            name="lastName"
            autoComplete="family-name"
            inputProps={{ "data-testid": "input-lastName" }}
            value={lastName}
            onChange={(e) => {
              const v = e.target.value;
              setLastName(v);
              if (!v.trim()) setLastNameError("Last name is required.");
              else if (hasSpace(v))
                setLastNameError("Last name cannot contain spaces.");
              else setLastNameError("");
            }}
            error={!!lastNameError}
            helperText={lastNameError || ""}
            FormHelperTextProps={{ sx: { ml: 0, mt: 0.5, lineHeight: 1.25 } }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            inputProps={{ "data-testid": "input-email" }}
            value={email}
            onChange={(e) => {
              const v = e.target.value;
              setEmail(v);
              if (!v.trim()) setEmailError("Email is required.");
              else if (!emailRegex.test(v))
                setEmailError("Please enter a valid email address.");
              else setEmailError("");
            }}
            error={!!emailError}
            helperText={emailError || ""}
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
            autoComplete="new-password"
            inputProps={{ "data-testid": "input-password" }}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordValidation(validatePassword(e.target.value));
            }}
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
                    data-testid="toggle-password-visibility"
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
            autoComplete="new-password"
            inputProps={{ "data-testid": "input-confirmPassword" }}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle confirm password visibility"
                    data-testid="toggle-confirm-password-visibility"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
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
                title="Registration failed"
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
            sx={{ mt: 3, mb: 2 }}
            data-testid="btn-submit"
          >
            Register
          </Button>
        </Box>
      </Paper>
      <SnackbarBaseline
        message={errorMessage}
        state={showSnackbar}
        severity="error"
        handleSnackbarClose={() => setShowSnackbar(false)}
      />
    </Container>
  );
}
