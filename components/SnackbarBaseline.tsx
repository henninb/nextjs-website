import React, { useEffect, useState } from "react";
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
  const [showSnackbar, setShowSnackbar] = useState(false);

  useEffect(() => {
    setShowSnackbar(state);
  }, [state]);

  return (
    <div>
      <Snackbar
        open={showSnackbar}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        autoHideDuration={severity === "error" ? 8000 : 4500}
        onClose={() => {
          setShowSnackbar(false);
          handleSnackbarClose();
        }}
      >
        <Alert severity={severity}>{message}</Alert>
      </Snackbar>
    </div>
  );
}
