import React, { useEffect, useState } from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

export default function SnackbarBaseline({
  message,
  state,
  handleSnackbarClose,
}: any) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(state);
  }, [state]);

  return (
    <div>
      <Snackbar
        open={open}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        autoHideDuration={4500}
        onClose={() => {
          console.log("from onClose close me:" + open);
          setOpen(false);
          handleSnackbarClose();
          console.log("from onClose close me:" + open);
        }}
      >
        <Alert severity="info">{message}</Alert>
      </Snackbar>
    </div>
  );
}
