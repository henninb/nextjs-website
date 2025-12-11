import React from "react";
import { Box, Typography, Paper, Chip } from "@mui/material";
import { styled } from "@mui/material/styles";
import SportsIcon from "@mui/icons-material/Sports";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

const StyledPaper = styled(Paper)(({ theme }) => ({
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  borderRadius: "16px",
  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
  overflow: "hidden",
  margin: "20px auto",
  maxWidth: "95vw",
}));

const HeaderBox = styled(Box)(({ theme }) => ({
  background: "rgba(255, 255, 255, 0.95)",
  backdropFilter: "blur(10px)",
  padding: "24px",
  textAlign: "center",
  borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
}));

const DataGridContainer = styled(Box)(({ theme }) => ({
  background: "rgba(255, 255, 255, 0.98)",
  minHeight: "400px",
}));

interface SportsDataGridProps {
  data: unknown[] | null;
  columns: GridColDef[];
  title: string;
  getRowId: (row: Record<string, unknown>) => string;
  teamColor?: string;
  sport?: "basketball" | "football" | "hockey" | "baseball";
}

const getSportColor = (sport?: string) => {
  switch (sport) {
    case "basketball":
      return { primary: "#1976d2", secondary: "#ff9800" };
    case "football":
      return { primary: "#4a148c", secondary: "#ffeb3b" };
    case "hockey":
      return { primary: "#d32f2f", secondary: "#4caf50" };
    case "baseball":
      return { primary: "#2e7d32", secondary: "#ff5722" };
    default:
      return { primary: "#1976d2", secondary: "#ff9800" };
  }
};

export default function SportsDataGrid({
  data,
  columns,
  title,
  getRowId,
  sport = "basketball",
}: SportsDataGridProps) {
  const colors = getSportColor(sport);
  const gameCount = data?.length || 0;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        padding: "20px 10px",
      }}
    >
      <StyledPaper elevation={0}>
        <HeaderBox>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={2}
            mb={2}
          >
            <SportsIcon sx={{ fontSize: 40, color: colors.primary }} />
            <Typography
              variant="h3"
              component="h1"
              sx={{
                fontWeight: 700,
                background: `linear-gradient(45deg, ${colors.primary}, ${colors.secondary})`,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: "none",
              }}
            >
              {title}
            </Typography>
          </Box>

          <Box display="flex" justifyContent="center" gap={2} flexWrap="wrap">
            <Chip
              label={`${gameCount} Games`}
              color="primary"
              sx={{
                fontWeight: 600,
                fontSize: "0.9rem",
                background: colors.primary,
                color: "white",
              }}
            />
            <Chip
              label="Live Scores"
              variant="outlined"
              sx={{
                fontWeight: 600,
                fontSize: "0.9rem",
                borderColor: colors.secondary,
                color: colors.secondary,
              }}
            />
          </Box>
        </HeaderBox>

        <DataGridContainer>
          <DataGrid
            getRowId={getRowId}
            rows={data || []}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 50 },
              },
            }}
            pageSizeOptions={[25, 50, 100]}
            disableRowSelectionOnClick
            autoHeight
            sx={{
              border: "none",
              "& .MuiDataGrid-main": {
                borderRadius: 0,
              },
              "& .MuiDataGrid-columnHeaders": {
                background: `linear-gradient(90deg, ${colors.primary}15, ${colors.secondary}15)`,
                borderBottom: `2px solid ${colors.primary}`,
                fontSize: "1rem",
                fontWeight: 700,
                color: colors.primary,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                "& .MuiDataGrid-columnHeader": {
                  outline: "none !important",
                },
                "& .MuiDataGrid-columnHeaderTitle": {
                  fontWeight: 700,
                },
              },
              "& .MuiDataGrid-cell": {
                fontSize: "0.95rem",
                fontWeight: 500,
                borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
                padding: "12px 16px",
                "&:focus": {
                  outline: "none",
                },
              },
              "& .MuiDataGrid-row": {
                transition: "all 0.2s ease",
                "&:hover": {
                  background: `linear-gradient(90deg, ${colors.primary}08, ${colors.secondary}08)`,
                  transform: "scale(1.001)",
                  boxShadow: `0 2px 8px ${colors.primary}20`,
                },
                "&:nth-of-type(even)": {
                  backgroundColor: "rgba(0, 0, 0, 0.02)",
                },
              },
              "& .MuiDataGrid-footerContainer": {
                background: `linear-gradient(90deg, ${colors.primary}10, ${colors.secondary}10)`,
                borderTop: `1px solid ${colors.primary}30`,
                "& .MuiTablePagination-root": {
                  color: colors.primary,
                  fontWeight: 600,
                },
                "& .MuiIconButton-root": {
                  color: colors.primary,
                },
              },
              "& .MuiDataGrid-selectedRowCount": {
                color: colors.primary,
                fontWeight: 600,
              },
            }}
          />
        </DataGridContainer>
      </StyledPaper>
    </Box>
  );
}
