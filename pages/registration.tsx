import React from "react";
import { useState, FormEvent } from "react";
import {
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Container,
  Paper,
  Box,
  Typography,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

interface FormData {
  firstName: string;
  middleInitial?: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  securityQuestion: string;
  securityAnswer: string;
  phoneNumber: string;
  zipCode: string;
  citizenship: string;
}

type FormErrors = Partial<Record<keyof FormData, string>>;

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);

  const initialValues: FormData = {
    firstName: "",
    middleInitial: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    securityQuestion: "",
    securityAnswer: "",
    phoneNumber: "",
    zipCode: "",
    citizenship: "",
  };

  const [values, setValues] = useState<FormData>(initialValues);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);

  const descriptors: {
    label: string;
    name: keyof FormData;
    required?: boolean;
    type?: string;
    pattern?: RegExp;
    placeholder?: string;
  }[] = [
    {
      label: "First Name",
      name: "firstName",
      required: true,
      pattern: /^\S+$/,
    },
    { label: "Middle Initial (optional)", name: "middleInitial" },
    { label: "Last Name", name: "lastName", required: true, pattern: /^\S+$/ },
    {
      label: "Email Address",
      name: "email",
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    { label: "Create Username", name: "username", required: true },
    {
      label: "Create Password",
      name: "password",
      required: true,
      type: "password",
    },
    {
      label: "Confirm Password",
      name: "confirmPassword",
      required: true,
      type: "password",
    },
    {
      label: "Security Question",
      name: "securityQuestion",
      required: true,
    },
    { label: "Answer", name: "securityAnswer", required: true },
    {
      label: "Phone Number",
      name: "phoneNumber",
      required: true,
      placeholder: "(XXX) XXX-XXXX",
    },
    { label: "Zip/Postal Code", name: "zipCode", required: true },
    {
      label: "Citizenship",
      name: "citizenship",
      required: true,
      placeholder: "Search Citizenship...",
    },
  ];

  const validate = (): boolean => {
    const errs: FormErrors = {};
    for (const d of descriptors) {
      const v = (values[d.name] as unknown as string) || "";
      if (d.required && !v.trim()) {
        errs[d.name] = `${d.label} is required.`;
        continue;
      }
      if (d.pattern && v && !d.pattern.test(v)) {
        errs[d.name] = `Invalid ${d.label.toLowerCase()}.`;
      }
    }
    if (
      values.password &&
      values.confirmPassword &&
      values.password !== values.confirmPassword
    ) {
      errs.confirmPassword = "Passwords do not match.";
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;
    setFormData(values);
    setSubmitted(true);
  };

  const handleModalClose = () => {
    setSubmitted(false);
    setValues(initialValues);
    setFormErrors({});
  };

  const renderField = (
    label: string,
    name: keyof FormData,
    required?: boolean,
    type: string = "text",
    placeholder?: string,
    autoComplete?: string,
  ) => {
    const isPassword = name === "password";
    const isConfirmPassword = name === "confirmPassword";
    const value = (values[name] as unknown as string) ?? "";
    const errorText = formErrors[name];
    return (
      <TextField
        key={name}
        id={name}
        name={name}
        label={label}
        required={!!required}
        fullWidth
        margin="normal"
        type={
          isPassword
            ? showPassword
              ? "text"
              : "password"
            : isConfirmPassword
              ? showConfirmPassword
                ? "text"
                : "password"
              : type
        }
        placeholder={placeholder}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) =>
          setValues((prev) => ({
            ...prev,
            [name]: e.target.value,
          }))
        }
        error={!!errorText}
        helperText={errorText || ""}
        FormHelperTextProps={{
          sx: { ml: 0, mt: 0.5, lineHeight: 1.25 },
        }}
        InputProps={(() => {
          if (isPassword) {
            return {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword((p) => !p)}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            } as const;
          }
          if (isConfirmPassword) {
            return {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle confirm password visibility"
                    onClick={() => setShowConfirmPassword((p) => !p)}
                    edge="end"
                    size="small"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            } as const;
          }
          return undefined;
        })()}
      />
    );
  };

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Register
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          Please fill in your details as they appear on official documents.
        </Typography>

        <Box component="form" onSubmit={onSubmit} noValidate>
          {descriptors.map(
            ({ label, name, required, type = "text", placeholder }) =>
              renderField(
                label,
                name,
                required,
                type,
                placeholder,
                name === "email"
                  ? "email"
                  : name === "password" || name === "confirmPassword"
                    ? "new-password"
                    : name === "firstName"
                      ? "given-name"
                      : name === "lastName"
                        ? "family-name"
                        : undefined,
              ),
          )}

          <Box sx={{ mt: 3 }}>
            <Button type="submit" variant="contained">
              Register
            </Button>
          </Box>
        </Box>

        {/* Modal for displaying summary */}
        {submitted && formData && (
          <Box
            role="dialog"
            aria-modal="true"
            sx={{
              position: "fixed",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.5)",
              zIndex: 1300,
            }}
          >
            <Paper sx={{ p: 3, maxWidth: 480, width: "90%" }}>
              <Typography variant="h6" gutterBottom>
                Form Submission Summary
              </Typography>
              <Box sx={{ maxHeight: 300, overflow: "auto" }}>
                {Object.entries(formData).map(([key, value]) => (
                  <Box key={key} sx={{ py: 0.5 }}>
                    <Typography
                      component="strong"
                      sx={{ fontWeight: 600, mr: 1 }}
                    >
                      {key.replace(/([A-Z])/g, " $1")}:
                    </Typography>
                    {String(value)}
                  </Box>
                ))}
              </Box>
              <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
                <Button onClick={handleModalClose} variant="contained">
                  OK
                </Button>
              </Box>
            </Paper>
          </Box>
        )}
      </Paper>
    </Container>
  );
}
