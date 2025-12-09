"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Button,
  Typography,
  Alert,
  Breadcrumbs,
  Link,
} from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import PaletteIcon from "@mui/icons-material/Palette";
import LeadLayout from "../components/LeadLayout";
import ColorSelector from "../components/ColorSelector";

export default function Color() {
  const [color, setColor] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const vin = searchParams.get("vin");

  useEffect(() => {
    if (!vin) {
      router.push("/lead");
    }
  }, [vin, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!color) return;

    setIsLoading(true);

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    router.push(`/lead/info?vin=${vin}&color=${color}`);
  };

  if (!vin) {
    return null; // Will redirect
  }

  return (
    <LeadLayout
      activeStep={1}
      title="Vehicle Details"
      subtitle="Customize your vehicle information"
    >
      <Box sx={{ maxWidth: 800, mx: "auto" }}>
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          sx={{ mb: 4 }}
        >
          <Link color="inherit" href="/lead" sx={{ textDecoration: "none" }}>
            VIN Entry
          </Link>
          <Typography color="primary.main" fontWeight={600}>
            Vehicle Details
          </Typography>
        </Breadcrumbs>

        <Box sx={{ mb: 4, textAlign: "center" }}>
          <PaletteIcon
            sx={{
              fontSize: 64,
              color: "primary.main",
              mb: 2,
            }}
          />
          <Typography variant="h4" gutterBottom>
            Vehicle Customization
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Select the color that best matches your vehicle
          </Typography>
        </Box>

        {vin && (
          <Alert severity="info" sx={{ mb: 4 }}>
            <Typography variant="body2">
              <strong>Vehicle VIN:</strong> {vin}
            </Typography>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <ColorSelector selectedColor={color} onColorSelect={setColor} />

          <Box
            sx={{
              mt: 6,
              display: "flex",
              gap: 2,
              justifyContent: "space-between",
            }}
          >
            <Button
              variant="outlined"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Back
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={!color || isLoading}
              size="large"
            >
              {isLoading ? "Processing..." : "Continue to Contact Info"}
            </Button>
          </Box>
        </form>
      </Box>
    </LeadLayout>
  );
}
