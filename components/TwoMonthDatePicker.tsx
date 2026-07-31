"use client";
import { useMemo, useRef, useState } from "react";
import { Box, IconButton, Popover, TextField, Typography } from "@mui/material";
import type { TextFieldProps } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import type { GridRenderEditCellParams } from "@mui/x-data-grid";
import {
  formatDateForDisplay,
  formatDateForInput,
  normalizeTransactionDate,
} from "./Common";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

interface MonthGridProps {
  year: number;
  month: number;
  selectedKey: string | null;
  todayKey: string;
  onSelect: (year: number, month: number, day: number) => void;
}

function MonthGrid({ year, month, selectedKey, todayKey, onSelect }: MonthGridProps) {
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const firstDow = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const cells: (number | null)[] = Array(firstDow).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <Box sx={{ minWidth: 196 }}>
      <Typography
        align="center"
        variant="subtitle2"
        sx={{ mb: 1, fontWeight: 600, color: "text.primary" }}
      >
        {MONTH_NAMES[month]} {year}
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.25 }}>
        {DAY_NAMES.map((d) => (
          <Box
            key={d}
            sx={{
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              color: "text.secondary",
              fontWeight: 500,
            }}
          >
            {d}
          </Box>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <Box key={`e-${i}`} />;
          const dateKey = toDateKey(year, month, day);
          const isSelected = dateKey === selectedKey;
          const isToday = dateKey === todayKey;
          return (
            <Box
              key={day}
              component="button"
              type="button"
              onClick={() => onSelect(year, month, day)}
              sx={{
                height: 28,
                width: 28,
                mx: "auto",
                fontSize: 12,
                borderRadius: "50%",
                border: isToday && !isSelected ? "1px solid" : "none",
                borderColor: "primary.main",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: isSelected ? "primary.main" : "transparent",
                color: isSelected
                  ? "primary.contrastText"
                  : isToday
                    ? "primary.main"
                    : "text.primary",
                fontWeight: isSelected || isToday ? 600 : 400,
                "&:hover": {
                  bgcolor: isSelected ? "primary.dark" : "action.hover",
                },
              }}
            >
              {day}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

interface TwoMonthCalendarProps {
  selectedKey: string | null;
  onSelect: (dateKey: string) => void;
}

function TwoMonthCalendar({ selectedKey, onSelect }: TwoMonthCalendarProps) {
  const todayKey = useMemo(() => formatDateForInput(new Date()), []);
  const [todayYear, todayMonth] = useMemo(
    () => todayKey.split("-").map(Number),
    [todayKey],
  );
  const [offset, setOffset] = useState(0);

  const baseIndex = todayYear * 12 + (todayMonth - 1) + offset;
  const m1 = { year: Math.floor(baseIndex / 12), month: ((baseIndex % 12) + 12) % 12 };
  const nextIndex = baseIndex + 1;
  const m2 = { year: Math.floor(nextIndex / 12), month: ((nextIndex % 12) + 12) % 12 };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <IconButton
          size="small"
          aria-label="Previous month"
          onClick={() => setOffset((o) => o - 1)}
        >
          <ChevronLeftIcon fontSize="small" />
        </IconButton>
        {offset !== 0 && (
          <Box
            component="button"
            type="button"
            onClick={() => setOffset(0)}
            sx={{
              border: "none",
              background: "none",
              cursor: "pointer",
              fontSize: 11,
              color: "primary.main",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            Today
          </Box>
        )}
        <IconButton
          size="small"
          aria-label="Next month"
          onClick={() => setOffset((o) => o + 1)}
        >
          <ChevronRightIcon fontSize="small" />
        </IconButton>
      </Box>
      <Box sx={{ display: "flex", gap: 3 }}>
        <MonthGrid
          {...m1}
          selectedKey={selectedKey}
          todayKey={todayKey}
          onSelect={(y, mo, d) => onSelect(toDateKey(y, mo, d))}
        />
        <Box sx={{ width: "1px", bgcolor: "divider" }} />
        <MonthGrid
          {...m2}
          selectedKey={selectedKey}
          todayKey={todayKey}
          onSelect={(y, mo, d) => onSelect(toDateKey(y, mo, d))}
        />
      </Box>
    </Box>
  );
}

interface TwoMonthDatePickerFieldProps
  extends Omit<TextFieldProps, "value" | "onChange" | "type"> {
  value: Date | string | null | undefined;
  onChange: (date: Date) => void;
}

export function TwoMonthDatePickerField({
  value,
  onChange,
  ...textFieldProps
}: TwoMonthDatePickerFieldProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const displayValue = value ? formatDateForDisplay(value) : "";
  const selectedKey = value ? formatDateForInput(value) : null;

  return (
    <Box ref={anchorRef}>
      <TextField
        {...textFieldProps}
        value={displayValue}
        onClick={() => setOpen(true)}
        slotProps={{
          ...textFieldProps.slotProps,
          input: {
            readOnly: true,
            endAdornment: (
              <CalendarTodayIcon fontSize="small" sx={{ color: "text.secondary" }} />
            ),
            ...(textFieldProps.slotProps?.input as object),
          },
          inputLabel: { shrink: true, ...(textFieldProps.slotProps?.inputLabel as object) },
        }}
        sx={{ cursor: "pointer", "& .MuiInputBase-input": { cursor: "pointer" }, ...textFieldProps.sx }}
      />
      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <TwoMonthCalendar
          selectedKey={selectedKey}
          onSelect={(dateKey) => {
            onChange(normalizeTransactionDate(dateKey));
            setOpen(false);
          }}
        />
      </Popover>
    </Box>
  );
}

export function TwoMonthDateEditCell(params: GridRenderEditCellParams) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(true);

  const selectedKey = params.value ? formatDateForInput(params.value) : null;
  const displayValue = params.value ? formatDateForDisplay(params.value) : "";

  const handleClose = () => {
    setOpen(false);
    params.api.stopCellEditMode({ id: params.id, field: params.field });
  };

  return (
    <Box ref={anchorRef} sx={{ width: "100%" }}>
      <TextField
        value={displayValue}
        fullWidth
        size="small"
        onClick={() => setOpen(true)}
        slotProps={{ input: { readOnly: true } }}
      />
      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <TwoMonthCalendar
          selectedKey={selectedKey}
          onSelect={async (dateKey) => {
            const normalizedDate = normalizeTransactionDate(dateKey);
            await params.api.setEditCellValue({
              id: params.id,
              field: params.field,
              value: normalizedDate,
            });
            setOpen(false);
            params.api.stopCellEditMode({ id: params.id, field: params.field });
          }}
        />
      </Popover>
    </Box>
  );
}
