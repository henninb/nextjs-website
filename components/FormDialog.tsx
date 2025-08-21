import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";

type FormDialogProps = {
  open: boolean;
  title: string;
  children: React.ReactNode;
  submitText?: string;
  cancelText?: string;
  onSubmit: () => void;
  onClose: () => void;
  disabled?: boolean;
};

export default function FormDialog({
  open,
  title,
  children,
  submitText = "Save",
  cancelText = "Cancel",
  onSubmit,
  onClose,
  disabled,
}: FormDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="form-dialog-title">
      <DialogTitle id="form-dialog-title">{title}</DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose} aria-label={cancelText}>
          {cancelText}
        </Button>
        <Button variant="contained" onClick={onSubmit} disabled={disabled} aria-label={submitText}>
          {submitText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

