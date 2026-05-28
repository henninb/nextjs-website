"use client";
import React, { useState, useEffect } from "react";
import { TextField } from "@mui/material";
import FormDialog from "./FormDialog";
import { validateName } from "../utils/validateName";

interface MergeDialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

export default function MergeDialog({
  open,
  title,
  onClose,
  onSubmit,
}: MergeDialogProps) {
  const [mergeName, setMergeName] = useState("");
  const [mergeError, setMergeError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!open) {
      setMergeName("");
      setMergeError(undefined);
    }
  }, [open]);

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      onSubmit={() => onSubmit(mergeName)}
      title={title}
      submitText="Merge"
      disabled={!!validateName(mergeName)}
    >
      <TextField
        label="New Name"
        fullWidth
        margin="normal"
        value={mergeName}
        error={!!mergeError}
        helperText={mergeError}
        onChange={(e) => {
          const next = e.target.value;
          setMergeName(next);
          setMergeError(validateName(next));
        }}
      />
    </FormDialog>
  );
}
