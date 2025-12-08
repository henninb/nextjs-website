"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Box, CircularProgress } from "@mui/material";
import { useSportsData } from "../../hooks/useSportsData";

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
    field: "DateUtc",
    headerName: "Game Date",
    width: 200,
    renderCell: (params: any) => {
      const date = new Date(params.value);
      return (
        <Box sx={{ fontWeight: 600, color: "#d32f2f" }}>
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
    field: "Location",
    headerName: "Venue",
    width: 180,
    renderCell: (params: any) => (
      <Box sx={{ fontSize: "0.9rem", color: "#666" }}>🏒 {params.value}</Box>
    ),
  },
  {
    field: "AwayTeam",
    headerName: "Away Team",
    width: 180,
    renderCell: (params: any) => (
      <Box
        sx={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 1 }}
      >
        ⛸️ {params.value}
      </Box>
    ),
  },
  {
    field: "AwayTeamScore",
    headerName: "Score",
    width: 80,
    align: "center" as const,
    renderCell: (params: any) => (
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
    field: "HomeTeam",
    headerName: "Home Team",
    width: 180,
    renderCell: (params: any) => (
      <Box
        sx={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 1 }}
      >
        🏠 {params.value}
      </Box>
    ),
  },
  {
    field: "HomeTeamScore",
    headerName: "Score",
    width: 80,
    align: "center" as const,
    renderCell: (params: any) => (
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
];

export default function HockeyPage() {
  const { data, loading, error, retry } = useSportsData("/api/nhl");

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

  if (error && (!data || data.length === 0)) {
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
          <strong>Error loading hockey scores:</strong> {error}
        </div>
        <button
          onClick={retry}
          style={{ padding: "8px 16px", cursor: "pointer" }}
        >
          Retry
        </button>
      </Box>
    );
  }

  return (
    <SportsDataGrid
      data={data}
      columns={columns}
      title="Wild Hockey Scores"
      getRowId={() => crypto.randomUUID()}
      sport="hockey"
    />
  );
}
