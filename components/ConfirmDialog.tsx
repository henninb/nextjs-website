import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onClose: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="confirm-dialog-title"
      transitionDuration={0}
      keepMounted={false}
      disablePortal
      hideBackdrop
    >
      <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>
      {message && (
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {message}
          </Typography>
        </DialogContent>
      )}
      <DialogActions>
        <Button variant="outlined" onClick={onClose} aria-label={cancelText}>
          {cancelText}
        </Button>
        <Button
          color="error"
          variant="contained"
          onClick={onConfirm}
          aria-label={confirmText}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
