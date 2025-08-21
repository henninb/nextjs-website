import React, { useState, useEffect } from "react";
import { CircularProgress, Box } from "@mui/material";
// Use a broad prop typing to avoid tight coupling to specific DataGrid versions
type AnyDataGridProps = Record<string, any>;

// Dynamically import the DataGrid component
const DataGridDynamic: React.FC<AnyDataGridProps> = (props) => {
  const [DataGridComponent, setDataGridComponent] =
    useState<React.ComponentType<AnyDataGridProps> | null>(null);
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
