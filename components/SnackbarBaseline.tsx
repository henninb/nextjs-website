import React from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

export default function SnackbarBaseline({
  message,
  state,
  handleSnackbarClose,
  severity = "info",
}: {
  message: string;
  state: boolean;
  handleSnackbarClose: () => void;
  severity?: "error" | "warning" | "info" | "success";
}) {
  return (
    <div>
      <Snackbar
        open={state}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        autoHideDuration={severity === "error" ? 8000 : 4500}
        onClose={handleSnackbarClose}
      >
        <Alert severity={severity}>{message}</Alert>
      </Snackbar>
    </div>
  );
}
