import React, { useState, useEffect, useCallback } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Box } from "@mui/material";
import axios from "axios";
import { useAuth } from "../../components/AuthProvider";

export default function FootballScores() {
  const [data, setData] = useState(null);
  const { token, login } = useAuth();

  //login(token);

  const columns = [
    {
      field: "DateUtc",
      headerName: "date",
      width: 175,
      editable: true,
    },
    {
      field: "Location",
      headerName: "location",
      width: 150,
      editable: true,
    },
    {
      field: "HomeTeam",
      headerName: "home",
      width: 150,
      editable: true,
    },
    {
      field: "HomeTeamScore",
      headerName: "score",
      width: 75,
      editable: true,
    },
    {
      field: "AwayTeam",
      headerName: "away",
      width: 150,
      editable: true,
    },
    {
      field: "AwayTeamScore",
      headerName: "score",
      width: 75,
      editable: true,
    },
  ];

  const fetchFootballSchedule = useCallback(async () => {
    try {
      const response = await axios.get("/api/nfl");
      setData(response.data);
    } catch (error) {
      if (error) {
        console.log(error.data);
      } else {
        console.log("error calling apiCall()");
      }
    }
  }, []);

  useEffect(() => {
    fetchFootballSchedule();
  }, [fetchFootballSchedule]);

  return (
    <div style={{ margin: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ textAlign: "center", color: "#333", marginBottom: "20px" }}>
        Vikings Football Scores
      </h1>

      <Box display="flex" justifyContent="center">
        <Box sx={{ width: "fit-content" }}>
          <div
            style={{
              width: "100%",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <DataGrid
              getRowId={(row) => row.DateUtc + row.HomeTeam + row.AwayTeam}
              rows={data ? data : []}
              columns={columns}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 100 },
                },
              }}
              pageSizeOptions={[100]}
              checkboxSelection
              disableRowSelectionOnClick
              autoHeight
              sx={{
                "& .MuiDataGrid-row:hover": {
                  backgroundColor: "rgba(0, 120, 215, 0.1)",
                },
                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor: "#f0f0f0",
                  color: "#000",
                  fontSize: "16px",
                  fontWeight: "bold",
                },
                "& .MuiDataGrid-cell": {
                  fontSize: "14px",
                },
              }}
            />
          </div>
        </Box>
      </Box>
    </div>
  );
}
