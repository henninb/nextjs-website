import React, { useState } from "react";
import { useRouter } from "next/router";
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  Tooltip,
  IconButton,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import LeadLayout from "./components/LeadLayout";

export default function Home() {
  const [vin, setVin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const validateVIN = (vinNumber) => {
    // Remove spaces and convert to uppercase
    const cleanVin = vinNumber.replace(/\s+/g, "").toUpperCase();

    // Check length
    if (cleanVin.length !== 17) {
      return "VIN must be exactly 17 characters long";
    }

    // Check for invalid characters (VIN cannot contain I, O, or Q)
    if (/[IOQ]/.test(cleanVin)) {
      return "VIN cannot contain the letters I, O, or Q";
    }

    // Check for valid characters (letters and numbers only)
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(cleanVin)) {
      return "VIN can only contain letters (except I, O, Q) and numbers";
    }

    return null;
  };

  const handleVinChange = (e) => {
    const value = e.target.value.toUpperCase();
    setVin(value);

    if (error && value.length > 0) {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const validationError = validateVIN(vin);
    if (validationError) {
      setError(validationError);
      setIsLoading(false);
      return;
    }

    // Simulate API validation delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const cleanVin = vin.replace(/\s+/g, "").toUpperCase();
    router.push(`/lead/color?vin=${cleanVin}`);
  };

  return (
    <LeadLayout
      activeStep={0}
      title="Vehicle Information"
      subtitle="Enter your vehicle's VIN to get started"
    >
      <Box sx={{ maxWidth: 600, mx: "auto" }}>
        <Box sx={{ mb: 4, textAlign: "center" }}>
          <DirectionsCarIcon
            sx={{
              fontSize: 64,
              color: "primary.main",
              mb: 2,
            }}
          />
          <Typography variant="h4" gutterBottom>
            Enter Vehicle VIN
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Please enter your 17-character Vehicle Identification Number (VIN)
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Vehicle Identification Number (VIN)"
            value={vin}
            onChange={handleVinChange}
            error={!!error}
            helperText={error || `${vin.length}/17 characters`}
            placeholder="Enter 17-character VIN"
            required
            sx={{ mb: 3 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="The VIN is typically found on your dashboard near the windshield, on the driver's side door frame, or in your vehicle registration documents.">
                    <IconButton size="small">
                      <InfoIcon />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
              sx: {
                fontFamily: "monospace",
                fontSize: "1.1rem",
                letterSpacing: "0.1em",
              },
            }}
            inputProps={{
              maxLength: 17,
              style: { textTransform: "uppercase" },
            }}
          />

          {vin.length > 0 && !error && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>VIN Preview:</strong> {vin}
              </Typography>
            </Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={!vin || !!error || isLoading}
            sx={{ py: 2 }}
          >
            {isLoading ? "Validating VIN..." : "Continue to Vehicle Details"}
          </Button>
        </form>

        <Box sx={{ mt: 4, p: 3, backgroundColor: "grey.50", borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Where to find your VIN:
          </Typography>
          <Typography variant="body2" component="ul" sx={{ m: 0, pl: 2 }}>
            <li>Dashboard near the windshield (driver's side)</li>
            <li>Driver's side door frame</li>
            <li>Vehicle registration documents</li>
            <li>Insurance card</li>
          </Typography>
        </Box>
      </Box>
    </LeadLayout>
  );
}
