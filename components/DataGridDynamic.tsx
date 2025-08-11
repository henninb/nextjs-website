import React, { useState, useEffect } from "react";
import { CircularProgress, Box } from "@mui/material";
import { DataGridProps } from "@mui/x-data-grid";

// Dynamically import the DataGrid component
const DataGridDynamic: React.FC<DataGridProps> = (props) => {
  const [DataGridComponent, setDataGridComponent] =
    useState<React.ComponentType<DataGridProps> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDataGrid = async () => {
      try {
        const { DataGrid } = await import("@mui/x-data-grid");
        setDataGridComponent(() => DataGrid);
      } catch (error) {
        console.error("Failed to load DataGrid:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDataGrid();
  }, []);

  if (loading || !DataGridComponent) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 200,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return <DataGridComponent {...props} />;
};

export default DataGridDynamic;
