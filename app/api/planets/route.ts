import {
  Body,
  Observer,
  Equator,
  Horizon,
  SearchRiseSet,
  SearchHourAngle,
  Illumination,
} from "astronomy-engine";
import { NextRequest, NextResponse } from "next/server";

interface PlanetConfig {
  name: string;
  body: Body;
  symbol: string;
  color: string;
  tip: string;
}

const PLANET_CONFIG: PlanetConfig[] = [
  {
    name: "Mercury",
    body: "Mercury" as Body,
    symbol: "☿",
    color: "#9e9e9e",
    tip: "Best viewed at dusk (eastern elongation) or dawn (western elongation). Never visible more than 2 hours from the Sun.",
  },
  {
    name: "Venus",
    body: "Venus" as Body,
    symbol: "♀",
    color: "#fdd835",
    tip: "The brightest planet. Visible as the 'evening star' or 'morning star'. Shows phases like the Moon when viewed through a telescope.",
  },
  {
    name: "Mars",
    body: "Mars" as Body,
    symbol: "♂",
    color: "#ef5350",
    tip: "Look for its distinctive red-orange tint. Brightest at opposition every ~26 months when Earth passes between it and the Sun.",
  },
  {
    name: "Jupiter",
    body: "Jupiter" as Body,
    symbol: "♃",
    color: "#ff9800",
    tip: "Brightest planet after Venus. The 4 Galilean moons (Io, Europa, Ganymede, Callisto) are visible through binoculars.",
  },
  {
    name: "Saturn",
    body: "Saturn" as Body,
    symbol: "♄",
    color: "#ffc107",
    tip: "Rings are visible through even a small telescope. Look for moon Titan nearby. Rings are tilted ~27° from our perspective.",
  },
  {
    name: "Uranus",
    body: "Uranus" as Body,
    symbol: "⛢",
    color: "#80deea",
    tip: "Barely visible to the naked eye under very dark skies. Appears as a pale blue-green disc through a telescope. Rotates on its side.",
  },
  {
    name: "Neptune",
    body: "Neptune" as Body,
    symbol: "♆",
    color: "#7c4dff",
    tip: "Requires binoculars or a telescope to observe. Appears as a tiny blue disc. Takes 165 years to orbit the Sun.",
  },
];

function getCardinalDirection(azimuth: number): string {
  const dirs = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  const index = Math.round(azimuth / 22.5) % 16;
  return dirs[index];
}

function calculateNighttimeWindows(
  body: Body,
  observer: Observer,
  dayStart: Date,
): { start: string; end: string }[] {
  const samples = 96;
  const interval = 15 * 60 * 1000;
  const windows: { start: string; end: string }[] = [];
  let windowStart: string | null = null;

  for (let i = 0; i <= samples; i++) {
    const time = new Date(dayStart.getTime() + i * interval);

    const sunEq = Equator("Sun" as Body, time, observer, true, true);
    const sunHor = Horizon(time, observer, sunEq.ra, sunEq.dec, "normal");

    const planetEq = Equator(body, time, observer, true, true);
    const planetHor = Horizon(time, observer, planetEq.ra, planetEq.dec, "normal");

    const isVisible = sunHor.altitude < -6 && planetHor.altitude > 0;

    if (isVisible && !windowStart) {
      windowStart = time.toISOString();
    } else if (!isVisible && windowStart) {
      windows.push({ start: windowStart, end: time.toISOString() });
      windowStart = null;
    }
  }

  if (windowStart) {
    windows.push({
      start: windowStart,
      end: new Date(dayStart.getTime() + samples * interval).toISOString(),
    });
  }

  return windows;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") || "");
  const lon = parseFloat(searchParams.get("lon") || "");
  const dateStr = searchParams.get("date");

  if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const refDate = dateStr ? new Date(dateStr) : new Date();

  if (isNaN(refDate.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const dayStart = new Date(refDate);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const observer = new Observer(lat, lon, 0);

  const sunEqNow = Equator("Sun" as Body, refDate, observer, true, true);
  const sunHorNow = Horizon(refDate, observer, sunEqNow.ra, sunEqNow.dec, "normal");
  const isNightNow = sunHorNow.altitude < -6;

  const planets = PLANET_CONFIG.map(({ name, body, symbol, color, tip }) => {
    const riseResult = SearchRiseSet(body, observer, +1, dayStart, 1.0);
    const setResult = SearchRiseSet(body, observer, -1, dayStart, 1.0);

    let transitTime: string | null = null;
    let maxAltitude = 0;
    try {
      const transitResult = SearchHourAngle(body, observer, 0, dayStart, +1);
      if (transitResult && transitResult.time) {
        const td = transitResult.time.date;
        if (td >= dayStart && td < dayEnd) {
          transitTime = td.toISOString();
          const tEq = Equator(body, td, observer, true, true);
          const tHor = Horizon(td, observer, tEq.ra, tEq.dec, "normal");
          maxAltitude = parseFloat(Math.max(0, tHor.altitude).toFixed(1));
        }
      }
    } catch {
      // Transit not found in window
    }

    const eq = Equator(body, refDate, observer, true, true);
    const hor = Horizon(refDate, observer, eq.ra, eq.dec, "normal");
    const altitude = parseFloat(hor.altitude.toFixed(1));
    const azimuth = parseFloat(hor.azimuth.toFixed(1));

    let magnitude: number | null = null;
    try {
      const illum = Illumination(body, refDate);
      magnitude = parseFloat(illum.mag.toFixed(1));
    } catch {
      // Magnitude not available
    }

    const nighttimeWindows = calculateNighttimeWindows(body, observer, dayStart);

    return {
      name,
      symbol,
      color,
      tip,
      rise: riseResult?.date.toISOString() ?? null,
      set: setResult?.date.toISOString() ?? null,
      transit: transitTime,
      altitude,
      azimuth,
      direction: getCardinalDirection(azimuth),
      maxAltitude,
      magnitude,
      visibleNow: altitude > 0 && isNightNow,
      visibleTonight: nighttimeWindows.length > 0,
      nighttimeWindows,
    };
  });

  return NextResponse.json(
    {
      referenceTime: refDate.toISOString(),
      location: { lat, lon },
      planets,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    },
  );
}
