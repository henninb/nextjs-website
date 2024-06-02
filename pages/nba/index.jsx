import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { DataGrid } from "@mui/x-data-grid";
import { v4 as uuidv4 } from "uuid";

export default function BasketballScores() {
  const [data, setData] = useState(null);

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

  const fetchBasketballSchedule = useCallback(async () => {
    try {
      const response = await axios.get("/api/nba");
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
    fetchBasketballSchedule();
  }, [fetchBasketballSchedule]);

  return (
    <div style={{ margin: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ textAlign: "center", color: "#333", marginBottom: "20px" }}>
        Wolves Basketball Scores
      </h1>

      <div
        style={{
          height: 800,
          width: "100%",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <DataGrid
          getRowId={() => uuidv4()}
          rows={data ? data : []}
          columns={columns}
          pageSize={100}
          rowsPerPageOptions={[100]}
          checkboxSelection
          disableSelectionOnClick
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
    </div>
  );
}
