"use client";

import React, { useState } from "react";

import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Alert,
  Divider,
  Chip,
  IconButton,
  InputAdornment,
  Paper,
  useTheme,
  alpha,
  Stack,
} from "@mui/material";
import {
  Payment as PaymentIcon,
  CreditCard,
  Security,
  CheckCircle,
  Visibility,
  VisibilityOff,
  AccountBalance,
  MonetizationOn,
} from "@mui/icons-material";

export default function Payment() {
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expDate, setExpDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [showCvv, setShowCvv] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const theme = useTheme();

  const handlePayPalClick = async () => {
    window.open(
      "https://www.paypal.com/donate/?business=54U7R9SHDDK7J&no_recurring=0&currency_code=USD",
      "_blank",
    );
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const formatExpDate = (value) => {
    const v = value.replace(/\D/g, "");
    if (v.length >= 2) {
      return v.slice(0, 2) + "/" + v.slice(2, 4);
    }
    return v;
  };

  const validateInput = () => {
    const validationErrors = {};
    const cardNumberRegex = /^\d{4}\s\d{4}\s\d{4}\s\d{4}$/;
    const expDateRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    const cvvRegex = /^\d{3,4}$/;

    if (!cardName.trim()) {
      validationErrors.cardName = "Cardholder name is required";
    }

    if (!cardNumberRegex.test(cardNumber)) {
      validationErrors.cardNumber = "Please enter a valid 16-digit card number";
    }

    if (!expDateRegex.test(expDate)) {
      validationErrors.expDate = "Please enter a valid expiration date (MM/YY)";
    }

    if (!cvvRegex.test(cvv)) {
      validationErrors.cvv = "CVV must be 3 or 4 digits";
    }

    return validationErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const validationErrors = validateInput();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
    } else {
      setErrors({});

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log("Payment details submitted:", {
        cardName,
        cardNumber: cardNumber.replace(/\s/g, ""),
        expDate,
        cvv,
      });

      setSubmitSuccess(true);
      setIsSubmitting(false);

      // Reset form after success
      setTimeout(() => {
        setCardName("");
        setCardNumber("");
        setExpDate("");
        setCvv("");
        setSubmitSuccess(false);
      }, 3000);
    }
  };

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.length <= 19) {
      // 16 digits + 3 spaces
      setCardNumber(formatted);
    }
  };

  const handleExpDateChange = (e) => {
    const formatted = formatExpDate(e.target.value);
    if (formatted.length <= 5) {
      setExpDate(formatted);
    }
  };

  return (
    <>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              mb: 2,
            }}
          >
            Secure Payment
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            Choose your preferred payment method
          </Typography>
          <Stack direction="row" spacing={1} justifyContent="center">
            <Chip
              icon={<Security />}
              label="SSL Encrypted"
              color="success"
              variant="outlined"
            />
            <Chip
              icon={<CheckCircle />}
              label="PCI Compliant"
              color="primary"
              variant="outlined"
            />
          </Stack>
        </Box>

        <Grid container spacing={4}>
          {/* Credit Card Form */}
          <Grid item xs={12} md={8}>
            <Card
              elevation={6}
              sx={{
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <CreditCard
                    sx={{
                      mr: 2,
                      fontSize: 32,
                      color: theme.palette.primary.main,
                    }}
                  />
                  <Typography variant="h5" component="h2" fontWeight={600}>
                    Credit Card Information
                  </Typography>
                </Box>

                {submitSuccess && (
                  <Alert
                    severity="success"
                    sx={{ mb: 3 }}
                    icon={<CheckCircle />}
                  >
                    Payment submitted successfully! Thank you for your purchase.
                  </Alert>
                )}

                <form onSubmit={handleSubmit}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Cardholder Name"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        error={!!errors.cardName}
                        helperText={errors.cardName}
                        required
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <AccountBalance color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Card Number"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        error={!!errors.cardNumber}
                        helperText={errors.cardNumber}
                        placeholder="1234 5678 9012 3456"
                        required
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <CreditCard color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Expiration Date"
                        value={expDate}
                        onChange={handleExpDateChange}
                        error={!!errors.expDate}
                        helperText={errors.expDate}
                        placeholder="MM/YY"
                        required
                      />
                    </Grid>

                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="CVV"
                        type={showCvv ? "text" : "password"}
                        value={cvv}
                        onChange={(e) =>
                          setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
                        }
                        error={!!errors.cvv}
                        helperText={errors.cvv}
                        placeholder="123"
                        required
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowCvv(!showCvv)}
                                edge="end"
                              >
                                {showCvv ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        disabled={isSubmitting}
                        startIcon={isSubmitting ? null : <PaymentIcon />}
                        sx={{
                          py: 2,
                          fontSize: "1.1rem",
                          fontWeight: 600,
                          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                          "&:hover": {
                            background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                            transform: "translateY(-2px)",
                            boxShadow: theme.shadows[6],
                          },
                          "&:disabled": {
                            background: theme.palette.grey[400],
                          },
                        }}
                      >
                        {isSubmitting ? "Processing..." : "Submit Payment"}
                      </Button>
                    </Grid>
                  </Grid>
                </form>
              </CardContent>
            </Card>
          </Grid>

          {/* Payment Options Sidebar */}
          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              {/* PayPal Option */}
              <Card
                elevation={4}
                sx={{
                  background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.05)} 0%, ${alpha(theme.palette.info.main, 0.1)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                  transition:
                    "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: theme.shadows[6],
                  },
                }}
              >
                <CardContent sx={{ p: 3, textAlign: "center" }}>
                  <MonetizationOn
                    sx={{ fontSize: 48, color: "#0070ba", mb: 2 }}
                  />
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    PayPal Donation
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 3 }}
                  >
                    Quick and secure donation through PayPal
                  </Typography>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handlePayPalClick}
                    sx={{
                      backgroundColor: "#0070ba",
                      py: 1.5,
                      fontWeight: 600,
                      "&:hover": {
                        backgroundColor: "#005ea6",
                        transform: "translateY(-1px)",
                      },
                    }}
                  >
                    Donate with PayPal
                  </Button>
                </CardContent>
              </Card>

              {/* Security Information */}
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  background: alpha(theme.palette.success.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Security sx={{ mr: 2, color: theme.palette.success.main }} />
                  <Typography variant="h6" fontWeight={600}>
                    Secure Payment
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Your payment information is encrypted and secure. We use
                  industry-standard SSL encryption.
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <CheckCircle
                      sx={{
                        mr: 1,
                        fontSize: 16,
                        color: theme.palette.success.main,
                      }}
                    />
                    <Typography variant="body2">
                      256-bit SSL encryption
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <CheckCircle
                      sx={{
                        mr: 1,
                        fontSize: 16,
                        color: theme.palette.success.main,
                      }}
                    />
                    <Typography variant="body2">PCI DSS compliant</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <CheckCircle
                      sx={{
                        mr: 1,
                        fontSize: 16,
                        color: theme.palette.success.main,
                      }}
                    />
                    <Typography variant="body2">Fraud protection</Typography>
                  </Box>
                </Stack>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}
