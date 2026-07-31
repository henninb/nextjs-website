"use client";
import { useState } from "react";
import { Box } from "@mui/material";
import { TwoMonthDatePickerField } from "../../components/TwoMonthDatePicker";

export default function DevScratchTwoMonthPicker() {
  const [date, setDate] = useState<Date>(new Date());
  return (
    <Box sx={{ p: 4, maxWidth: 400 }}>
      <TwoMonthDatePickerField
        label="Transaction Date"
        fullWidth
        margin="normal"
        value={date}
        onChange={setDate}
      />
    </Box>
  );
}
