import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";

type SessionExpiryWarningProps = {
  open: boolean;
  minutesRemaining: number;
  onExtend: () => void;
  onLogout: () => void;
};

export default function SessionExpiryWarning({
  open,
  minutesRemaining,
  onExtend,
  onLogout,
}: SessionExpiryWarningProps) {
  return (
    <Dialog
      open={open}
      onClose={onExtend}
      aria-labelledby="session-expiry-dialog-title"
      transitionDuration={0}
      keepMounted={false}
      disablePortal
      hideBackdrop
    >
      <DialogTitle id="session-expiry-dialog-title">
        Session Expiring Soon
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          Your session will expire in {minutesRemaining}{" "}
          {minutesRemaining === 1 ? "minute" : "minutes"}. Would you like to
          stay logged in?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onLogout} aria-label="Log Out">
          Log Out
        </Button>
        <Button
          color="primary"
          variant="contained"
          onClick={onExtend}
          aria-label="Stay Logged In"
        >
          Stay Logged In
        </Button>
      </DialogActions>
    </Dialog>
  );
}
