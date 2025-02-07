import React, { useEffect, useState } from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

export default function SnackbarBaseline({
  message,
  state,
  handleSnackbarClose,
}: any) {
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
        autoHideDuration={4500}
        onClose={() => {
          setShowSnackbar(false);
          handleSnackbarClose();
        }}
      >
        <Alert severity="info">{message}</Alert>
      </Snackbar>
    </div>
  );
}
