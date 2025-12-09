import React from "react";
import {
  Stepper,
  Step,
  StepLabel,
  Box,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import PaletteIcon from "@mui/icons-material/Palette";
import PersonIcon from "@mui/icons-material/Person";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const steps = [
  {
    label: "VIN Entry",
    description: "Enter your vehicle identification number",
    icon: <DirectionsCarIcon />,
  },
  {
    label: "Vehicle Details",
    description: "Choose your vehicle color and features",
    icon: <PaletteIcon />,
  },
  {
    label: "Personal Info",
    description: "Enter your contact information",
    icon: <PersonIcon />,
  },
  {
    label: "Complete",
    description: "Lead submitted successfully",
    icon: <CheckCircleIcon />,
  },
];

export default function LeadProgressStepper({ activeStep = 0 }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box sx={{ width: "100%", mb: 4 }}>
      <Typography
        variant="h6"
        gutterBottom
        sx={{
          textAlign: "center",
          color: theme.palette.text.secondary,
          mb: 3,
          fontWeight: 500,
        }}
      >
        Car Sale Lead Process
      </Typography>

      <Stepper
        activeStep={activeStep}
        alternativeLabel={!isMobile}
        orientation={isMobile ? "vertical" : "horizontal"}
        sx={{
          "& .MuiStepConnector-line": {
            borderColor: theme.palette.divider,
            borderTopWidth: 2,
          },
          "& .Mui-active .MuiStepConnector-line": {
            borderColor: theme.palette.primary.main,
          },
          "& .Mui-completed .MuiStepConnector-line": {
            borderColor: theme.palette.success.main,
          },
        }}
      >
        {steps.map((step, index) => (
          <Step key={step.label}>
            <StepLabel
              StepIconComponent={({ active, completed }) => (
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: completed
                      ? theme.palette.success.main
                      : active
                        ? theme.palette.primary.main
                        : theme.palette.grey[300],
                    color:
                      completed || active ? "#fff" : theme.palette.grey[600],
                    fontSize: "1.25rem",
                    transition: "all 0.3s ease-in-out",
                  }}
                >
                  {step.icon}
                </Box>
              )}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: activeStep === index ? 600 : 500,
                  color:
                    activeStep === index
                      ? theme.palette.primary.main
                      : activeStep > index
                        ? theme.palette.success.main
                        : theme.palette.text.secondary,
                }}
              >
                {step.label}
              </Typography>
              {!isMobile && (
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.secondary,
                    mt: 0.5,
                    display: "block",
                  }}
                >
                  {step.description}
                </Typography>
              )}
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}
