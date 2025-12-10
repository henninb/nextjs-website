"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Box, CircularProgress } from "@mui/material";
import { GridRenderCellParams } from "@mui/x-data-grid";
import { MLBGame } from "../../model/SportsGame";

// Dynamically import the SportsDataGrid component
const SportsDataGrid = dynamic(
  () => import("../../components/SportsDataGrid"),
  {
    loading: () => (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    ),
  },
);

const columns = [
  {
    field: "gameDate",
    headerName: "Game Date",
    width: 200,
    renderCell: (params: GridRenderCellParams<MLBGame>) => {
      const date = new Date(params.value);
      return (
        <Box sx={{ fontWeight: 600, color: "#2e7d32" }}>
          {date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            weekday: "short",
          })}
        </Box>
      );
    },
  },
  {
    field: "venueName",
    headerName: "Venue",
    width: 180,
    renderCell: (params: GridRenderCellParams<MLBGame>) => (
      <Box sx={{ fontSize: "0.9rem", color: "#666" }}>⚾ {params.value}</Box>
    ),
  },
  {
    field: "awayTeamName",
    headerName: "Away Team",
    width: 180,
    renderCell: (params: GridRenderCellParams<MLBGame>) => (
      <Box
        sx={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 1 }}
      >
        🏟️ {params.value}
      </Box>
    ),
  },
  {
    field: "awayTeamScore",
    headerName: "Score",
    width: 80,
    align: "center" as const,
    renderCell: (params: GridRenderCellParams<MLBGame>) => (
      <Box
        sx={{
          fontWeight: 700,
          fontSize: "1.1rem",
          color: params.value > 0 ? "#2e7d32" : "#666",
          textAlign: "center",
        }}
      >
        {params.value || "-"}
      </Box>
    ),
  },
  {
    field: "homeTeamName",
    headerName: "Home Team",
    width: 180,
    renderCell: (params: GridRenderCellParams<MLBGame>) => (
      <Box
        sx={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 1 }}
      >
        🏠 {params.value}
      </Box>
    ),
  },
  {
    field: "homeTeamScore",
    headerName: "Score",
    width: 80,
    align: "center" as const,
    renderCell: (params: GridRenderCellParams<MLBGame>) => (
      <Box
        sx={{
          fontWeight: 700,
          fontSize: "1.1rem",
          color: params.value > 0 ? "#2e7d32" : "#666",
          textAlign: "center",
        }}
      >
        {params.value || "-"}
      </Box>
    ),
  },
  {
    field: "gameStatus",
    headerName: "Status",
    width: 120,
    renderCell: (params: GridRenderCellParams<MLBGame>) => (
      <Box
        sx={{
          fontSize: "0.85rem",
          fontWeight: 600,
          color:
            params.value === "Final"
              ? "#2e7d32"
              : params.value === "Live"
                ? "#d32f2f"
                : "#666",
          textTransform: "uppercase",
        }}
      >
        {params.value}
      </Box>
    ),
  },
];

export default function BaseballPage() {
  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/mlb");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        console.log("Direct fetch result:", result.slice(0, 2));
        console.log(
          "First game structure:",
          JSON.stringify(result[0], null, 2),
        );

        // Remove duplicates based on gamePk
        const uniqueGames = result.filter(
          (game: any, index: number, arr: any[]) =>
            arr.findIndex((g: any) => g.gamePk === game.gamePk) === index,
        );
        console.log(
          "Original length:",
          result.length,
          "After dedup:",
          uniqueGames.length,
        );

        // Transform data to flatten nested properties for easier DataGrid access
        const transformedData = uniqueGames.map((game: any) => ({
          ...game,
          venueName: game.venue?.name || "TBD",
          awayTeamName: game.teams?.away?.team?.name || "TBD",
          awayTeamScore: game.teams?.away?.score || 0,
          homeTeamName: game.teams?.home?.team?.name || "TBD",
          homeTeamScore: game.teams?.home?.score || 0,
          gameStatus: game.status?.abstractGameState || "Scheduled",
        }));

        console.log("Transformed first game:", transformedData[0]);
        setData(transformedData);
      } catch (err: any) {
        console.error("Fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
        p={4}
      >
        <div style={{ marginBottom: "16px", textAlign: "center" }}>
          <strong>Error loading baseball scores:</strong> {error}
        </div>
      </Box>
    );
  }

  // Don't render the DataGrid if data is null, undefined, or empty
  if (!data || data.length === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <div>No baseball games available</div>
      </Box>
    );
  }

  // Debug: Check what data looks like
  console.log("MLB Data length:", data?.length);
  console.log("First few games:", data?.slice(0, 2));

  return (
    <SportsDataGrid
      data={data}
      columns={columns}
      title="Twins Baseball Scores"
      getRowId={(row: any) => {
        if (!row) return crypto.randomUUID();
        // Use gamePk as primary key, with UUID fallback
        return row.gamePk ? `game-${row.gamePk}` : crypto.randomUUID();
      }}
      sport="baseball"
    />
  );
}
