"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Breadcrumbs,
  Link,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  InputAdornment,
} from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LeadLayout from "../components/LeadLayout";

export default function Info() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const vin = searchParams.get("vin");
  const color = searchParams.get("color");

  useEffect(() => {
    if (!vin || !color) {
      router.push("/lead");
    }
  }, [vin, color, router]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    const phoneDigits = formData.phone.replace(/[\s\-\(\)\+]/g, "");
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d+$/.test(phoneDigits)) {
      newErrors.phone = "Phone number can only contain digits";
    } else if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      newErrors.phone =
        "Phone number must be 10 digits (or 11 with country code)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    const data = {
      vin,
      color,
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
    };

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("Lead generated successfully:", result);
        // Pass form data to success page for display
        const successParams = new URLSearchParams({
          leadId: result.leadId || Date.now().toString(),
          vin,
          color,
          name: formData.name,
          email: formData.email,
        });
        router.push(`/lead/success?${successParams.toString()}`);
      } else {
        console.error("Failed to generate lead:", result);
        let errorMessage = "Failed to generate lead";

        if (result.error === "Validation failed" && result.details) {
          errorMessage = `Validation error: ${result.details.map((d) => d.message).join(", ")}`;
        } else if (result.error) {
          errorMessage = result.error;
        } else if (result.message) {
          errorMessage = result.message;
        }

        setErrors({ submit: errorMessage });
      }
    } catch (error) {
      console.error("Failed to generate lead:", error);

      let errorMessage =
        "An error occurred while generating the lead. Please try again.";

      if (error.name === "TypeError" && error.message.includes("fetch")) {
        errorMessage =
          "Network connection error. Please check your internet connection and try again.";
      } else if (error.name === "AbortError") {
        errorMessage = "Request timed out. Please try again.";
      }

      setErrors({ submit: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  if (!vin || !color) {
    return null; // Will redirect
  }

  return (
    <LeadLayout
      activeStep={2}
      title="Contact Information"
      subtitle="Tell us how to reach you"
    >
      <Box sx={{ maxWidth: 600, mx: "auto" }}>
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          sx={{ mb: 4 }}
        >
          <Link color="inherit" href="/lead" sx={{ textDecoration: "none" }}>
            VIN Entry
          </Link>
          <Link
            color="inherit"
            href={`/lead/color?vin=${vin}`}
            sx={{ textDecoration: "none" }}
          >
            Vehicle Details
          </Link>
          <Typography color="primary.main" fontWeight={600}>
            Contact Information
          </Typography>
        </Breadcrumbs>

        <Box sx={{ mb: 4, textAlign: "center" }}>
          <PersonIcon
            sx={{
              fontSize: 64,
              color: "primary.main",
              mb: 2,
            }}
          />
          <Typography variant="h4" gutterBottom>
            Your Contact Details
          </Typography>
          <Typography variant="body1" color="text.secondary">
            We'll use this information to contact you about your vehicle
          </Typography>
        </Box>

        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Vehicle Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  VIN
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: "monospace" }}>
                  {vin}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Color
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ textTransform: "capitalize" }}
                >
                  {color}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                value={formData.name}
                onChange={handleChange("name")}
                error={!!errors.name}
                helperText={errors.name}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={handleChange("email")}
                error={!!errors.email}
                helperText={errors.email}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.phone}
                onChange={handleChange("phone")}
                error={!!errors.phone}
                helperText={
                  errors.phone || "We may call you to discuss your vehicle"
                }
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>

          {errors.submit && (
            <Alert severity="error" sx={{ mt: 3 }}>
              {errors.submit}
            </Alert>
          )}

          <Box
            sx={{
              mt: 4,
              display: "flex",
              gap: 2,
              justifyContent: "space-between",
            }}
          >
            <Button
              variant="outlined"
              onClick={() => router.back()}
              disabled={isLoading}
              sx={{ px: 4 }}
            >
              Back
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={isLoading}
              sx={{ px: 4 }}
            >
              {isLoading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Submitting Lead...
                </>
              ) : (
                "Submit Lead"
              )}
            </Button>
          </Box>
        </form>
      </Box>
    </LeadLayout>
  );
}
