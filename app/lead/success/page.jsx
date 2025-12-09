"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import ScheduleIcon from "@mui/icons-material/Schedule";
import PersonIcon from "@mui/icons-material/Person";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import HomeIcon from "@mui/icons-material/Home";
import RefreshIcon from "@mui/icons-material/Refresh";
import LeadLayout from "../components/LeadLayout";

export default function Success() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leadId = searchParams.get("leadId");
  const vin = searchParams.get("vin");
  const color = searchParams.get("color");
  const name = searchParams.get("name");
  const email = searchParams.get("email");
  const [timeStamp] = useState(new Date().toLocaleString());

  const handleNewLead = () => {
    router.push("/lead");
  };

  const handleGoHome = () => {
    router.push("/");
  };

  return (
    <LeadLayout
      activeStep={3}
      title="Success!"
      subtitle="Your lead has been submitted successfully"
    >
      <Box sx={{ maxWidth: 700, mx: "auto", textAlign: "center" }}>
        <Box sx={{ mb: 4 }}>
          <CheckCircleIcon
            sx={{
              fontSize: 80,
              color: "success.main",
              mb: 2,
              animation: "pulse 2s infinite",
              "@keyframes pulse": {
                "0%": {
                  transform: "scale(1)",
                },
                "50%": {
                  transform: "scale(1.05)",
                },
                "100%": {
                  transform: "scale(1)",
                },
              },
            }}
          />
          <Typography
            variant="h3"
            gutterBottom
            color="success.main"
            fontWeight={700}
          >
            Lead Submitted Successfully!
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Thank you for your interest in selling your vehicle.
          </Typography>
        </Box>

        {leadId && (
          <Alert severity="success" sx={{ mb: 4 }}>
            <Typography variant="body2">
              <strong>Lead ID:</strong> {leadId} | <strong>Submitted:</strong>{" "}
              {timeStamp}
            </Typography>
          </Alert>
        )}

        <Card sx={{ mb: 4, textAlign: "left" }}>
          <CardContent>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <DirectionsCarIcon color="primary" />
              Vehicle & Contact Summary
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Vehicle Identification Number
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ fontFamily: "monospace", fontWeight: 600 }}
                >
                  {vin || "Not provided"}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Vehicle Color
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography
                    variant="body1"
                    sx={{ textTransform: "capitalize", fontWeight: 600 }}
                  >
                    {color || "Not specified"}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Contact Name
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {name || "Not provided"}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Email Address
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {email || "Not provided"}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card sx={{ mb: 4, bgcolor: "primary.light", color: "white" }}>
          <CardContent>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <ScheduleIcon />
              What Happens Next?
            </Typography>
            <Divider sx={{ mb: 3, borderColor: "rgba(255,255,255,0.3)" }} />

            <List sx={{ py: 0 }}>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon sx={{ color: "white", minWidth: 40 }}>
                  <EmailIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Email Confirmation"
                  secondary="You'll receive a confirmation email within 5 minutes"
                  primaryTypographyProps={{ fontWeight: 600, color: "white" }}
                  secondaryTypographyProps={{ color: "rgba(255,255,255,0.8)" }}
                />
              </ListItem>

              <ListItem sx={{ px: 0 }}>
                <ListItemIcon sx={{ color: "white", minWidth: 40 }}>
                  <PhoneIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Initial Contact"
                  secondary="Our team will contact you within 24 hours to discuss your vehicle"
                  primaryTypographyProps={{ fontWeight: 600, color: "white" }}
                  secondaryTypographyProps={{ color: "rgba(255,255,255,0.8)" }}
                />
              </ListItem>

              <ListItem sx={{ px: 0 }}>
                <ListItemIcon sx={{ color: "white", minWidth: 40 }}>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Vehicle Evaluation"
                  secondary="We'll schedule an appointment to evaluate your vehicle and provide a quote"
                  primaryTypographyProps={{ fontWeight: 600, color: "white" }}
                  secondaryTypographyProps={{ color: "rgba(255,255,255,0.8)" }}
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={handleNewLead}
            sx={{ px: 4 }}
          >
            Submit Another Lead
          </Button>

          <Button
            variant="outlined"
            startIcon={<HomeIcon />}
            onClick={handleGoHome}
            sx={{ px: 4 }}
          >
            Go to Homepage
          </Button>
        </Box>
      </Box>
    </LeadLayout>
  );
}
