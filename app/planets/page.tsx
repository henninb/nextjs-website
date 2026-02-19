"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  alpha,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import {
  AccessTime,
  ArrowDownward,
  ArrowUpward,
  Explore,
  GpsFixed,
  NightsStay,
  Search,
  Visibility,
  VisibilityOff,
  WbTwilight,
} from "@mui/icons-material";

// ─── Types ──────────────────────────────────────────────────────────────────

interface NighttimeWindow {
  start: string;
  end: string;
}

interface PlanetData {
  name: string;
  symbol: string;
  color: string;
  tip: string;
  rise: string | null;
  set: string | null;
  transit: string | null;
  altitude: number;
  azimuth: number;
  direction: string;
  maxAltitude: number;
  magnitude: number | null;
  visibleNow: boolean;
  visibleTonight: boolean;
  nighttimeWindows: NighttimeWindow[];
}

interface PlanetsResponse {
  referenceTime: string;
  location: { lat: number; lon: number };
  planets: PlanetData[];
}

interface GeocodeSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(isoString: string | null): string {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeToPercent(isoString: string | null, dayStartMs: number): number | null {
  if (!isoString) return null;
  const t = new Date(isoString).getTime();
  const pct = ((t - dayStartMs) / (24 * 3600 * 1000)) * 100;
  return Math.max(0, Math.min(100, pct));
}

function getPlaceName(suggestion: GeocodeSuggestion): string {
  const a = suggestion.address;
  if (!a) return suggestion.display_name.split(",")[0];
  const city = a.city || a.town || a.village || a.county || "";
  const state = a.state || "";
  const country = a.country || "";
  return [city, state, country].filter(Boolean).join(", ");
}

function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface TimelineBarProps {
  rise: string | null;
  set: string | null;
  transit: string | null;
  dayStartMs: number;
  color: string;
  nighttimeWindows: NighttimeWindow[];
}

function TimelineBar({ rise, set, transit, dayStartMs, color, nighttimeWindows }: TimelineBarProps) {
  const riseP = timeToPercent(rise, dayStartMs);
  const setP = timeToPercent(set, dayStartMs);
  const transitP = timeToPercent(transit, dayStartMs);

  return (
    <Box sx={{ mt: 1.5, mb: 0.5 }}>
      <Box
        sx={{
          position: "relative",
          height: 18,
          bgcolor: "rgba(255,255,255,0.06)",
          borderRadius: 1,
          overflow: "hidden",
        }}
      >
        {/* Above-horizon segment (dim) */}
        {riseP !== null && setP !== null && (
          <Box
            sx={{
              position: "absolute",
              left: `${riseP}%`,
              width: `${setP - riseP}%`,
              top: 0,
              bottom: 0,
              bgcolor: color,
              opacity: 0.18,
            }}
          />
        )}

        {/* Nighttime viewing windows (bright) */}
        {nighttimeWindows.map((w, i) => {
          const wS = timeToPercent(w.start, dayStartMs);
          const wE = timeToPercent(w.end, dayStartMs);
          if (wS === null || wE === null) return null;
          return (
            <Box
              key={i}
              sx={{
                position: "absolute",
                left: `${wS}%`,
                width: `${Math.max(wE - wS, 0.5)}%`,
                top: 0,
                bottom: 0,
                bgcolor: color,
                opacity: 0.85,
              }}
            />
          );
        })}

        {/* Rise marker */}
        {riseP !== null && (
          <Box
            sx={{
              position: "absolute",
              left: `${riseP}%`,
              top: 0,
              bottom: 0,
              width: 2,
              bgcolor: color,
            }}
          />
        )}

        {/* Transit marker */}
        {transitP !== null && (
          <Box
            sx={{
              position: "absolute",
              left: `${transitP}%`,
              top: "25%",
              bottom: "25%",
              width: 2,
              bgcolor: "rgba(255,255,255,0.4)",
            }}
          />
        )}

        {/* Set marker */}
        {setP !== null && (
          <Box
            sx={{
              position: "absolute",
              left: `${setP}%`,
              top: 0,
              bottom: 0,
              width: 2,
              bgcolor: color,
            }}
          />
        )}
      </Box>

      {/* Hour labels */}
      <Box sx={{ position: "relative", height: 14, mt: 0.25 }}>
        {[0, 6, 12, 18, 24].map((h) => (
          <Typography
            key={h}
            variant="caption"
            sx={{
              position: "absolute",
              left: `${(h / 24) * 100}%`,
              fontSize: "0.6rem",
              color: "text.disabled",
              transform: h === 0 ? "none" : h === 24 ? "translateX(-100%)" : "translateX(-50%)",
              lineHeight: 1,
              userSelect: "none",
            }}
          >
            {h === 0 || h === 24 ? `${String(h % 24).padStart(2, "0")}:00` : `${h}:00`}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}

interface PlanetCardProps {
  planet: PlanetData;
  dayStartMs: number;
}

function PlanetCard({ planet, dayStartMs }: PlanetCardProps) {
  const theme = useTheme();
  const color = planet.color;

  const visibilityBadge = planet.visibleNow
    ? { label: "Visible Now", bg: "success.main" }
    : planet.visibleTonight
      ? { label: "Visible Tonight", bg: "warning.main" }
      : { label: "Not Visible", bg: "rgba(255,255,255,0.12)" };

  return (
    <Card
      elevation={3}
      sx={{
        height: "100%",
        border: `1px solid ${alpha(color, planet.visibleNow ? 0.6 : 0.25)}`,
        background: `linear-gradient(135deg, ${alpha(color, 0.06)} 0%, ${alpha(theme.palette.background.paper, 1)} 60%)`,
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: `0 8px 24px ${alpha(color, 0.25)}`,
        },
      }}
    >
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              sx={{
                fontSize: "1.6rem",
                lineHeight: 1,
                color,
                textShadow: `0 0 12px ${alpha(color, 0.6)}`,
              }}
            >
              {planet.symbol}
            </Typography>
            <Typography variant="h6" fontWeight={700} sx={{ color }}>
              {planet.name}
            </Typography>
          </Box>
          <Chip
            label={visibilityBadge.label}
            size="small"
            sx={{
              bgcolor: visibilityBadge.bg,
              color: planet.visibleNow || planet.visibleTonight ? "black" : "text.secondary",
              fontWeight: 600,
              fontSize: "0.7rem",
            }}
          />
        </Box>

        {/* Rise / Transit / Set */}
        <Grid container spacing={1} sx={{ mb: 0.5 }}>
          {/* @ts-expect-error MUI v7 Grid type issue */}
          <Grid item xs={4}>
            <Box sx={{ textAlign: "center" }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, mb: 0.25 }}>
                <ArrowUpward sx={{ fontSize: 13, color: "success.main" }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Rise
                </Typography>
              </Box>
              <Typography variant="body2" fontWeight={600} sx={{ fontSize: "0.85rem" }}>
                {formatTime(planet.rise)}
              </Typography>
            </Box>
          </Grid>
          {/* @ts-expect-error MUI v7 Grid type issue */}
          <Grid item xs={4}>
            <Box sx={{ textAlign: "center" }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, mb: 0.25 }}>
                <WbTwilight sx={{ fontSize: 13, color: "warning.light" }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Transit
                </Typography>
              </Box>
              <Typography variant="body2" fontWeight={600} sx={{ fontSize: "0.85rem" }}>
                {formatTime(planet.transit)}
              </Typography>
            </Box>
          </Grid>
          {/* @ts-expect-error MUI v7 Grid type issue */}
          <Grid item xs={4}>
            <Box sx={{ textAlign: "center" }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, mb: 0.25 }}>
                <ArrowDownward sx={{ fontSize: 13, color: "error.light" }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Set
                </Typography>
              </Box>
              <Typography variant="body2" fontWeight={600} sx={{ fontSize: "0.85rem" }}>
                {formatTime(planet.set)}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Timeline */}
        <TimelineBar
          rise={planet.rise}
          set={planet.set}
          transit={planet.transit}
          dayStartMs={dayStartMs}
          color={color}
          nighttimeWindows={planet.nighttimeWindows}
        />

        <Divider sx={{ my: 1.5, borderColor: alpha(color, 0.15) }} />

        {/* Stats grid */}
        <Grid container spacing={1} sx={{ mb: 1.5 }}>
          {[
            { label: "Altitude", value: `${planet.altitude}°` },
            { label: "Max Alt", value: `${planet.maxAltitude}°` },
            { label: "Magnitude", value: planet.magnitude !== null ? planet.magnitude.toFixed(1) : "—" },
            { label: "Direction", value: `${planet.direction} (${planet.azimuth}°)` },
          ].map(({ label, value }) => (
            /* @ts-expect-error MUI v7 Grid type issue */
            <Grid item xs={6} key={label}>
              <Box
                sx={{
                  px: 1,
                  py: 0.75,
                  bgcolor: "rgba(255,255,255,0.04)",
                  borderRadius: 1,
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: 0.5, display: "block" }}>
                  {label}
                </Typography>
                <Typography variant="body2" fontWeight={600} sx={{ fontSize: "0.8rem" }}>
                  {value}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Nighttime viewing windows */}
        {planet.nighttimeWindows.length > 0 && (
          <Box sx={{ mb: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.75 }}>
              <NightsStay sx={{ fontSize: 14, color }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Best Viewing Windows
              </Typography>
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {planet.nighttimeWindows.slice(0, 3).map((w, i) => (
                <Chip
                  key={i}
                  label={`${formatTime(w.start)} – ${formatTime(w.end)}`}
                  size="small"
                  sx={{
                    bgcolor: alpha(color, 0.15),
                    color,
                    border: `1px solid ${alpha(color, 0.3)}`,
                    fontSize: "0.65rem",
                    fontWeight: 600,
                    height: 22,
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Observation tip */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: "block",
            fontSize: "0.7rem",
            lineHeight: 1.4,
            fontStyle: "italic",
            borderLeft: `2px solid ${alpha(color, 0.4)}`,
            pl: 1,
          }}
        >
          {planet.tip}
        </Typography>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function PlanetsPage() {
  const theme = useTheme();

  const [cityQuery, setCityQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [date, setDate] = useState(getTodayDateString());
  const [planetsData, setPlanetsData] = useState<PlanetsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState("");
  const [geolocating, setGeolocating] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  // Debounced geocode search
  useEffect(() => {
    if (cityQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setGeocoding(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(cityQuery.trim())}`);
        if (res.ok) {
          const data: GeocodeSuggestion[] = await res.json();
          setSuggestions(data);
          setShowSuggestions(true);
        }
      } catch {
        // ignore
      } finally {
        setGeocoding(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [cityQuery]);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelectSuggestion = (s: GeocodeSuggestion) => {
    const name = getPlaceName(s);
    setLocationName(name);
    setCityQuery(name);
    setLat(parseFloat(s.lat));
    setLon(parseFloat(s.lon));
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude);
        setLon(longitude);
        setLocationName(`${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`);
        setCityQuery(`${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`);
        setGeolocating(false);
      },
      () => {
        setError("Unable to retrieve your location.");
        setGeolocating(false);
      },
    );
  };

  const fetchPlanets = useCallback(async () => {
    if (lat === null || lon === null) {
      setError("Please select a location first.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const dateParam = `${date}T12:00:00Z`;
      const res = await fetch(`/api/planets?lat=${lat}&lon=${lon}&date=${encodeURIComponent(dateParam)}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch planet data");
      }
      const data: PlanetsResponse = await res.json();
      setPlanetsData(data);
      setLastFetchTime(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [lat, lon, date]);

  // Auto-fetch when location + date are set
  useEffect(() => {
    if (lat !== null && lon !== null) {
      fetchPlanets();
    }
  }, [lat, lon, date, fetchPlanets]);


  const dayStartMs = planetsData
    ? (() => {
        const d = new Date(planetsData.referenceTime);
        d.setUTCHours(0, 0, 0, 0);
        return d.getTime();
      })()
    : 0;

  const visibleNow = planetsData?.planets.filter((p) => p.visibleNow) ?? [];
  const visibleTonight = planetsData?.planets.filter((p) => !p.visibleNow && p.visibleTonight) ?? [];
  const notVisible = planetsData?.planets.filter((p) => !p.visibleNow && !p.visibleTonight) ?? [];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: "center", mb: 5 }}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 700,
            background: `linear-gradient(135deg, #7c4dff 0%, #80deea 50%, #fdd835 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            mb: 1,
          }}
        >
          Planet Rise &amp; Set
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Rise, transit, and set times for all 7 planets from any location on Earth
        </Typography>
      </Box>

      {/* Search Form */}
      <Paper
        elevation={4}
        sx={{
          p: 3,
          mb: 4,
          background: alpha(theme.palette.background.paper, 0.9),
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          borderRadius: 2,
        }}
      >
        <Grid container spacing={2} alignItems="flex-start">
          {/* City search */}
          {/* @ts-expect-error MUI v7 Grid type issue */}
          <Grid item xs={12} md={6}>
            <Box ref={searchBoxRef} sx={{ position: "relative" }}>
              <TextField
                fullWidth
                label="Search City or Place"
                placeholder="e.g. Minneapolis, London, Tokyo..."
                value={cityQuery}
                onChange={(e) => {
                  setCityQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                  endAdornment: geocoding ? (
                    <InputAdornment position="end">
                      <CircularProgress size={18} />
                    </InputAdornment>
                  ) : null,
                }}
              />
              {showSuggestions && suggestions.length > 0 && (
                <Paper
                  elevation={8}
                  sx={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    maxHeight: 250,
                    overflow: "auto",
                    mt: 0.5,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                  }}
                >
                  <List dense disablePadding>
                    {suggestions.map((s) => (
                      <ListItem key={s.place_id} disablePadding>
                        <ListItemButton
                          onClick={() => handleSelectSuggestion(s)}
                          sx={{
                            "&:hover": {
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                            },
                          }}
                        >
                          <ListItemText
                            primary={getPlaceName(s)}
                            secondary={`${parseFloat(s.lat).toFixed(4)}°, ${parseFloat(s.lon).toFixed(4)}°`}
                            primaryTypographyProps={{ variant: "body2", fontWeight: 500 }}
                            secondaryTypographyProps={{ variant: "caption" }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}
            </Box>
          </Grid>

          {/* Date picker */}
          {/* @ts-expect-error MUI v7 Grid type issue */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: "2053-12-31", min: "1900-01-01" }}
            />
          </Grid>

          {/* Action buttons */}
          {/* @ts-expect-error MUI v7 Grid type issue */}
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: "flex", gap: 1, height: "100%", alignItems: "center" }}>
              <Tooltip title="Use my current location">
                <span>
                  <IconButton
                    onClick={handleGeolocation}
                    disabled={geolocating}
                    size="large"
                    sx={{
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.4)}`,
                      color: theme.palette.primary.main,
                      "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.1) },
                    }}
                  >
                    {geolocating ? <CircularProgress size={22} /> : <GpsFixed />}
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Reset to today">
                <IconButton
                  onClick={() => setDate(getTodayDateString())}
                  size="large"
                  sx={{
                    border: `1px solid ${alpha(theme.palette.secondary.main, 0.4)}`,
                    color: theme.palette.secondary.main,
                    "&:hover": { bgcolor: alpha(theme.palette.secondary.main, 0.1) },
                  }}
                >
                  <AccessTime />
                </IconButton>
              </Tooltip>
              {locationName && (
                <Chip
                  icon={<Explore sx={{ fontSize: 16 }} />}
                  label={locationName}
                  size="small"
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                    color: theme.palette.primary.light,
                    maxWidth: 180,
                    ".MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis" },
                  }}
                />
              )}
            </Box>
          </Grid>
        </Grid>

        {!lat && !loading && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: "center" }}>
            Search for a city or click <GpsFixed sx={{ fontSize: 14, verticalAlign: "middle" }} /> to use your current location
          </Typography>
        )}

        {lastFetchTime && (
          <Typography variant="caption" color="text.disabled" sx={{ display: "block", textAlign: "right", mt: 1 }}>
            Last updated: {lastFetchTime.toLocaleTimeString()}
          </Typography>
        )}
      </Paper>

      {error && (
        <Alert severity="error" onClose={() => setError("")} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 2, py: 8 }}>
          <CircularProgress size={40} />
          <Typography color="text.secondary">Calculating planet positions...</Typography>
        </Box>
      )}

      {planetsData && !loading && (
        <>
          {/* Legend */}
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3, alignItems: "center" }}>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              Timeline legend:
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Box sx={{ width: 28, height: 8, bgcolor: "rgba(255,255,255,0.15)", borderRadius: 0.5, border: "1px solid rgba(255,255,255,0.2)" }} />
              <Typography variant="caption" color="text.secondary">Above horizon (daytime)</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Box sx={{ width: 28, height: 8, bgcolor: "#7c4dff", borderRadius: 0.5, opacity: 0.85 }} />
              <Typography variant="caption" color="text.secondary">Visible at night</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Box sx={{ width: 2, height: 14, bgcolor: "rgba(255,255,255,0.4)" }} />
              <Typography variant="caption" color="text.secondary">Transit (highest point)</Typography>
            </Box>
          </Box>

          {/* Visible Now */}
          {visibleNow.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <Visibility sx={{ color: "success.main" }} />
                <Typography variant="h5" fontWeight={700} color="success.main">
                  Visible Now
                </Typography>
                <Chip label={visibleNow.length} size="small" color="success" sx={{ fontWeight: 700 }} />
              </Box>
              <Grid container spacing={2}>
                {visibleNow.map((planet) => (
                  /* @ts-expect-error MUI v7 Grid type issue */
                  <Grid item xs={12} sm={6} lg={4} key={planet.name}>
                    <PlanetCard planet={planet} dayStartMs={dayStartMs} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Visible Tonight */}
          {visibleTonight.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <NightsStay sx={{ color: "warning.main" }} />
                <Typography variant="h5" fontWeight={700} color="warning.main">
                  Visible Tonight
                </Typography>
                <Chip label={visibleTonight.length} size="small" color="warning" sx={{ fontWeight: 700 }} />
              </Box>
              <Grid container spacing={2}>
                {visibleTonight.map((planet) => (
                  /* @ts-expect-error MUI v7 Grid type issue */
                  <Grid item xs={12} sm={6} lg={4} key={planet.name}>
                    <PlanetCard planet={planet} dayStartMs={dayStartMs} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Not Visible */}
          {notVisible.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <VisibilityOff sx={{ color: "text.disabled" }} />
                <Typography variant="h5" fontWeight={700} color="text.disabled">
                  Not Visible
                </Typography>
                <Chip label={notVisible.length} size="small" sx={{ bgcolor: "rgba(255,255,255,0.1)", fontWeight: 700 }} />
              </Box>
              <Grid container spacing={2}>
                {notVisible.map((planet) => (
                  /* @ts-expect-error MUI v7 Grid type issue */
                  <Grid item xs={12} sm={6} lg={4} key={planet.name}>
                    <PlanetCard planet={planet} dayStartMs={dayStartMs} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Footer */}
          <Divider sx={{ my: 3 }} />
          <Typography variant="caption" color="text.disabled" sx={{ display: "block", textAlign: "center" }}>
            Times shown in your local timezone · Rise/set searched from UTC midnight ·
            Powered by{" "}
            <Box component="span" sx={{ color: theme.palette.primary.light }}>
              astronomy-engine
            </Box>
          </Typography>
        </>
      )}
    </Container>
  );
}
