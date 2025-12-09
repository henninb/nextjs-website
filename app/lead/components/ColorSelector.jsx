import React, { useState } from "react";
import { Box, Typography, Paper, Grid, Chip, alpha } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CheckIcon from "@mui/icons-material/Check";

const colorOptions = [
  {
    name: "Pearl White",
    value: "white",
    color: "#f8fafc",
    border: "#e2e8f0",
    popular: true,
  },
  {
    name: "Jet Black",
    value: "black",
    color: "#1a202c",
    border: "#2d3748",
    popular: true,
  },
  {
    name: "Silver Metallic",
    value: "silver",
    color: "#a0aec0",
    border: "#718096",
    popular: true,
  },
  {
    name: "Deep Red",
    value: "red",
    color: "#e53e3e",
    border: "#c53030",
    popular: false,
  },
  {
    name: "Ocean Blue",
    value: "blue",
    color: "#3182ce",
    border: "#2c5aa0",
    popular: false,
  },
  {
    name: "Forest Green",
    value: "green",
    color: "#38a169",
    border: "#2f855a",
    popular: false,
  },
  {
    name: "Sunset Orange",
    value: "orange",
    color: "#dd6b20",
    border: "#c05621",
    popular: false,
  },
  {
    name: "Royal Purple",
    value: "purple",
    color: "#805ad5",
    border: "#6b46c1",
    popular: false,
  },
  {
    name: "Champagne Gold",
    value: "gold",
    color: "#d69e2e",
    border: "#b7791f",
    popular: false,
  },
];

export default function ColorSelector({ selectedColor, onColorSelect }) {
  const theme = useTheme();

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        Choose Your Vehicle Color
      </Typography>

      <Grid container spacing={2}>
        {colorOptions.map((colorOption) => {
          const isSelected = selectedColor === colorOption.value;

          return (
            <Grid item xs={6} sm={4} md={3} key={colorOption.value}>
              <Paper
                onClick={() => onColorSelect(colorOption.value)}
                sx={{
                  p: 2,
                  textAlign: "center",
                  cursor: "pointer",
                  border: `2px solid ${
                    isSelected ? theme.palette.primary.main : "transparent"
                  }`,
                  backgroundColor: isSelected
                    ? alpha(theme.palette.primary.main, 0.05)
                    : "white",
                  transition: "all 0.3s ease-in-out",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: theme.shadows[8],
                    border: `2px solid ${
                      isSelected
                        ? theme.palette.primary.main
                        : theme.palette.primary.light
                    }`,
                  },
                  position: "relative",
                }}
              >
                {colorOption.popular && (
                  <Chip
                    label="Popular"
                    size="small"
                    color="secondary"
                    sx={{
                      position: "absolute",
                      top: -8,
                      right: -8,
                      fontSize: "0.7rem",
                    }}
                  />
                )}

                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    backgroundColor: colorOption.color,
                    border: `3px solid ${colorOption.border}`,
                    mx: "auto",
                    mb: 2,
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}
                >
                  {isSelected && (
                    <CheckIcon
                      sx={{
                        color: colorOption.value === "white" ? "#000" : "#fff",
                        fontSize: 24,
                        fontWeight: "bold",
                      }}
                    />
                  )}
                </Box>

                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: isSelected ? 600 : 500,
                    color: isSelected
                      ? theme.palette.primary.main
                      : theme.palette.text.primary,
                  }}
                >
                  {colorOption.name}
                </Typography>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {selectedColor && (
        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Typography variant="body1" color="text.secondary">
            Selected color:{" "}
            <strong>
              {colorOptions.find((c) => c.value === selectedColor)?.name}
            </strong>
          </Typography>
        </Box>
      )}
    </Box>
  );
}
