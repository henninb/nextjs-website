import React, { useState, useEffect, useCallback } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Box } from "@mui/material";
import axios from "axios";

export default function Hockey() {
  const [data, setData] = useState(null);

  const columns = [
    // { field: 'id', headerName: 'id' },
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
      // type: 'number',
      width: 150,
      editable: true,
    },
    {
      field: "HomeTeamScore",
      headerName: "score",
      // type: 'number',
      width: 75,
      editable: true,
    },
    {
      field: "AwayTeam",
      headerName: "away",
      // type: 'number',
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

  //const rows = [
  //    //{ id: 1, MatchNumber: 1307, RoundNumber: 28, DateUtc: "2022-04-30 00:00:00Z", Location: "Xcel Energy Center", HomeTeam: "Minnesota Wild", AwayTeam: "Colorado Avalanche", Group: null, HomeTeamScore: null, AwayTeamScore: null },
  //    { MatchNumber: 1307, RoundNumber: 28, DateUtc: "2022-04-30 00:00:00Z", Location: "Xcel Energy Center", HomeTeam: "Minnesota Wild", AwayTeam: "Colorado Avalanche", Group: null, HomeTeamScore: null, AwayTeamScore: null },
  //];

  // async function showSchedule(_event) {
  //   console.log('showSchedule was called #1.');
  // }

  const fetchHockeySchedule = useCallback(async () => {
    try {
      const response = await axios.get("/api/nhl");
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
    fetchHockeySchedule();
  }, [fetchHockeySchedule]);

  return (
    <div>
      <h1>Wild Hockey Scores</h1>

      <Box display="flex" justifyContent="center">
        <Box sx={{ width: "fit-content" }}>
          <div style={{ height: 800, width: "100%" }}>
            <DataGrid
              getRowId={() => crypto.randomUUID()}
              rows={data ? data : []}
              columns={columns}
              pageSize={100}
              rowsPerPageOptions={[100]}
              checkboxSelection
              disableSelectionOnClick
              autoHeight
            />
          </div>
        </Box>
      </Box>
    </div>
  );
}
