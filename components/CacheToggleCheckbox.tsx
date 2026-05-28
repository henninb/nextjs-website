"use client";
import React from "react";
import { Box, Checkbox, FormControlLabel } from "@mui/material";

interface CacheToggleCheckboxProps {
  checked: boolean;
  cacheEnabledKey: string;
  cacheDataKey?: string;
  onChange: (checked: boolean) => void;
}

export default function CacheToggleCheckbox({
  checked,
  cacheEnabledKey,
  cacheDataKey,
  onChange,
}: CacheToggleCheckboxProps) {
  return (
    <Box sx={{ mt: 2 }}>
      <FormControlLabel
        control={
          <Checkbox
            checked={checked}
            onChange={(e) => {
              const next = e.target.checked;
              onChange(next);
              if (typeof window !== "undefined") {
                localStorage.setItem(cacheEnabledKey, String(next));
                if (!next && cacheDataKey) {
                  localStorage.removeItem(cacheDataKey);
                }
              }
            }}
            size="small"
          />
        }
        label="Remember field data"
      />
    </Box>
  );
}
