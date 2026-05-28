import React from "react";
import { Box, TextField, Typography, Switch, FormControlLabel } from "@mui/material";
import CacheToggleCheckbox from "./CacheToggleCheckbox";

interface Props {
  nameLabel?: string;
  nameValue: string;
  nameError?: string;
  activeStatus: boolean;
  activeStatusError?: string;
  onNameChange: (value: string) => void;
  onActiveStatusChange: (checked: boolean) => void;
  cacheEnabled: boolean;
  cacheEnabledKey: string;
  cacheDataKey: string;
  onCacheChange: (checked: boolean) => void;
}

export default function NameActiveStatusFormFields({
  nameLabel = "Name",
  nameValue,
  nameError,
  activeStatus,
  activeStatusError,
  onNameChange,
  onActiveStatusChange,
  cacheEnabled,
  cacheEnabledKey,
  cacheDataKey,
  onCacheChange,
}: Props) {
  return (
    <>
      <TextField
        label={nameLabel}
        fullWidth
        margin="normal"
        value={nameValue}
        error={!!nameError}
        helperText={nameError}
        onChange={(e) => onNameChange(e.target.value)}
      />
      <Box sx={{ mt: 1 }}>
        <FormControlLabel
          control={
            <Switch
              checked={activeStatus}
              onChange={(e) => onActiveStatusChange(e.target.checked)}
            />
          }
          label="Status"
        />
        {activeStatusError && (
          <Typography color="error" variant="caption">
            {activeStatusError}
          </Typography>
        )}
      </Box>
      <CacheToggleCheckbox
        checked={cacheEnabled}
        cacheEnabledKey={cacheEnabledKey}
        cacheDataKey={cacheDataKey}
        onChange={onCacheChange}
      />
    </>
  );
}
