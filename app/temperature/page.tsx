"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Paper,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
  useTheme,
  alpha,
} from "@mui/material";
import {
  DeviceThermostat,
  ThermostatAuto,
  WbSunny,
  Air,
  Compress,
  Schedule,
  SwapHoriz,
} from "@mui/icons-material";

interface WeatherData {
  imperial: {
    temp: number;
    windChill: number;
    pressure: number;
  };
  obsTimeLocal: string;
}

export default function TemperaturePage() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fahrenheitValue, setFahrenheitValue] = useState(50);
  const [celsiusValue, setCelsiusValue] = useState(18);
  const [fahrenheitResult, setFahrenheitResult] = useState("");
  const [celsiusResult, setCelsiusResult] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [error, setError] = useState("");

  const theme = useTheme();

  const fetchWeather = useCallback(async () => {
    try {
      setLoading(true);
      const apiResponse = await fetch("/api/weather", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const json = await apiResponse.json();
      setWeatherData(json.observations[0]);
    } catch (err) {
      setError("Failed to fetch weather data");
    } finally {
      setLoading(false);
    }
  }, []);

  const convertToCelsius = async () => {
    try {
      const apiResponse = await fetch("/api/celsius", {
        method: "POST",
        body: JSON.stringify({ fahrenheit: fahrenheitValue }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const result = await apiResponse.text();
      setCelsiusResult(result);
      setResultMessage(`${fahrenheitValue}°F = ${result}`);
      setShowResult(true);
    } catch (err) {
      setError("Failed to convert temperature");
    }
  };

  const convertToFahrenheit = async () => {
    try {
      const apiResponse = await fetch("/api/fahrenheit", {
        method: "POST",
        body: JSON.stringify({ celsius: celsiusValue }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const result = await apiResponse.text();
      setFahrenheitResult(result);
      setResultMessage(`${celsiusValue}°C = ${result}`);
      setShowResult(true);
    } catch (err) {
      setError("Failed to convert temperature");
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
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
          Temperature Converter
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          Convert between Fahrenheit and Celsius with live weather data
        </Typography>
      </Box>

      <Grid container spacing={4} sx={{ mb: 6 }}>
        {/* @ts-expect-error - MUI v7 Grid type issue with item prop */}
        <Grid item xs={12} md={6}>
          <Card
            elevation={4}
            sx={{
              height: "100%",
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              transition:
                "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: theme.shadows[8],
              },
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <ThermostatAuto
                  sx={{
                    mr: 2,
                    fontSize: 32,
                    color: theme.palette.primary.main,
                  }}
                />
                <Typography variant="h5" component="h2" fontWeight={600}>
                  Fahrenheit to Celsius
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  type="number"
                  value={fahrenheitValue}
                  onChange={(e) => setFahrenheitValue(Number(e.target.value))}
                  label="Temperature in Fahrenheit"
                  inputProps={{ min: -500, max: 500 }}
                  sx={{ mb: 2 }}
                  InputProps={{
                    endAdornment: (
                      <Typography color="text.secondary">°F</Typography>
                    ),
                  }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={convertToCelsius}
                  startIcon={<SwapHoriz />}
                  sx={{
                    py: 1.5,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    "&:hover": {
                      background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                    },
                  }}
                >
                  Convert to Celsius
                </Button>
              </Box>

              {celsiusResult && (
                <Paper
                  elevation={2}
                  sx={{
                    p: 2,
                    background: alpha(theme.palette.success.main, 0.1),
                    border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                  }}
                >
                  <Typography
                    variant="h6"
                    color="success.main"
                    textAlign="center"
                  >
                    Result: {celsiusResult}
                  </Typography>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* @ts-expect-error - MUI v7 Grid type issue with item prop */}
        <Grid item xs={12} md={6}>
          <Card
            elevation={4}
            sx={{
              height: "100%",
              background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
              transition:
                "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: theme.shadows[8],
              },
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <DeviceThermostat
                  sx={{
                    mr: 2,
                    fontSize: 32,
                    color: theme.palette.secondary.main,
                  }}
                />
                <Typography variant="h5" component="h2" fontWeight={600}>
                  Celsius to Fahrenheit
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  type="number"
                  value={celsiusValue}
                  onChange={(e) => setCelsiusValue(Number(e.target.value))}
                  label="Temperature in Celsius"
                  inputProps={{ min: -500, max: 500 }}
                  sx={{ mb: 2 }}
                  InputProps={{
                    endAdornment: (
                      <Typography color="text.secondary">°C</Typography>
                    ),
                  }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={convertToFahrenheit}
                  startIcon={<SwapHoriz />}
                  sx={{
                    py: 1.5,
                    background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                    "&:hover": {
                      background: `linear-gradient(135deg, ${theme.palette.secondary.dark} 0%, ${theme.palette.secondary.main} 100%)`,
                    },
                  }}
                >
                  Convert to Fahrenheit
                </Button>
              </Box>

              {fahrenheitResult && (
                <Paper
                  elevation={2}
                  sx={{
                    p: 2,
                    background: alpha(theme.palette.success.main, 0.1),
                    border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                  }}
                >
                  <Typography
                    variant="h6"
                    color="success.main"
                    textAlign="center"
                  >
                    Result: {fahrenheitResult}
                  </Typography>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      <Box sx={{ textAlign: "center", mb: 4 }}>
        <Typography variant="h4" component="h2" gutterBottom fontWeight={600}>
          Current Weather in Minneapolis
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Live weather data and conditions
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={48} />
        </Box>
      ) : weatherData ? (
        <Card
          elevation={6}
          sx={{
            background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.05)} 0%, ${alpha(theme.palette.info.main, 0.15)} 100%)`,
            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Grid container spacing={3}>
              {/* @ts-expect-error - MUI v7 Grid type issue with item prop */}
              <Grid item xs={12} sm={6} md={3}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 3,
                    textAlign: "center",
                    background: alpha(theme.palette.background.paper, 0.8),
                  }}
                >
                  <WbSunny
                    sx={{
                      fontSize: 48,
                      color: theme.palette.warning.main,
                      mb: 1,
                    }}
                  />
                  <Typography variant="h4" fontWeight={700} color="primary">
                    {weatherData.imperial.temp}°F
                  </Typography>
                  <Typography
                    variant="h6"
                    fontWeight={500}
                    color="secondary"
                    sx={{ mt: 0.5 }}
                  >
                    {Math.round(((weatherData.imperial.temp - 32) * 5) / 9)}°C
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Temperature
                  </Typography>
                </Paper>
              </Grid>

              {/* @ts-expect-error - MUI v7 Grid type issue with item prop */}
              <Grid item xs={12} sm={6} md={3}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 3,
                    textAlign: "center",
                    background: alpha(theme.palette.background.paper, 0.8),
                  }}
                >
                  <Air
                    sx={{
                      fontSize: 48,
                      color: theme.palette.info.main,
                      mb: 1,
                    }}
                  />
                  <Typography variant="h4" fontWeight={700} color="primary">
                    {weatherData.imperial.windChill}°F
                  </Typography>
                  <Typography
                    variant="h6"
                    fontWeight={500}
                    color="secondary"
                    sx={{ mt: 0.5 }}
                  >
                    {Math.round(
                      ((weatherData.imperial.windChill - 32) * 5) / 9,
                    )}
                    °C
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Wind Chill
                  </Typography>
                </Paper>
              </Grid>

              {/* @ts-expect-error - MUI v7 Grid type issue with item prop */}
              <Grid item xs={12} sm={6} md={3}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 3,
                    textAlign: "center",
                    background: alpha(theme.palette.background.paper, 0.8),
                  }}
                >
                  <Compress
                    sx={{
                      fontSize: 48,
                      color: theme.palette.success.main,
                      mb: 1,
                    }}
                  />
                  <Typography variant="h4" fontWeight={700} color="primary">
                    {weatherData.imperial.pressure}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pressure (inHg)
                  </Typography>
                </Paper>
              </Grid>

              {/* @ts-expect-error - MUI v7 Grid type issue with item prop */}
              <Grid item xs={12} sm={6} md={3}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 3,
                    textAlign: "center",
                    background: alpha(theme.palette.background.paper, 0.8),
                  }}
                >
                  <Schedule
                    sx={{
                      fontSize: 48,
                      color: theme.palette.secondary.main,
                      mb: 1,
                    }}
                  />
                  <Typography
                    variant="body1"
                    fontWeight={600}
                    color="primary"
                    sx={{ mb: 1 }}
                  >
                    {new Date(weatherData.obsTimeLocal).toLocaleTimeString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Chip
                    label="Live Data"
                    size="small"
                    color="success"
                    sx={{ mt: 1 }}
                  />
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ) : (
        <Alert severity="warning" sx={{ mt: 2 }}>
          Weather data is currently unavailable. Please try again later.
        </Alert>
      )}

      <Snackbar
        open={showResult}
        autoHideDuration={4000}
        onClose={() => setShowResult(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setShowResult(false)}
          severity="success"
          variant="filled"
          sx={{ fontWeight: 600 }}
        >
          {resultMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setError("")} severity="error" variant="filled">
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
}
