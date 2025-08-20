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
import {
  Check,
  Close,
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
} from "@mui/icons-material";
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
  const [firstNameError, setFirstNameError] = useState<string>("");
  const [lastNameError, setLastNameError] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
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
          <Box component="form" onSubmit={handleSubmit} noValidate data-testid="auth-form">
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
              <Alert severity="error" variant="outlined" sx={{ mt: 2 }} data-testid="alert-error">
                {errorMessage}
              </Alert>
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
      </Container>
    </>
  );
}
