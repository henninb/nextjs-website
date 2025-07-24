import dynamic from "next/dynamic";
import { CircularProgress } from "@mui/material";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then((mod) => ({ default: mod.DataGrid })),
  {
    loading: () => <CircularProgress />,
    ssr: false,
  },
);

export default DataGrid;
