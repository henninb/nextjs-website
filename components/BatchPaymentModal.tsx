"use client";
import React, { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Autocomplete,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  IconButton,
  Chip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import Account from "../model/Account";
import { isAssetAccount, isLiabilityAccount } from "../model/AccountTypeUtils";
import Payment from "../model/Payment";
import { currencyFormat, formatDateForDisplay } from "./Common";
import usePaymentInsert from "../hooks/usePaymentInsert";

// ── US Federal Holiday helpers ──────────────────────────────────────────────

function getNthWeekday(
  year: number,
  month: number,
  weekday: number,
  n: number,
): Date {
  let count = 0;
  for (let d = 1; d <= 31; d++) {
    const date = new Date(Date.UTC(year, month, d));
    if (date.getUTCMonth() !== month) break;
    if (date.getUTCDay() === weekday && ++count === n) return date;
  }
  return new Date(NaN);
}

function getLastWeekday(year: number, month: number, weekday: number): Date {
  let last = new Date(NaN);
  for (let d = 1; d <= 31; d++) {
    const date = new Date(Date.UTC(year, month, d));
    if (date.getUTCMonth() !== month) break;
    if (date.getUTCDay() === weekday) last = date;
  }
  return last;
}

function toObserved(d: Date): Date {
  if (isNaN(d.getTime())) return d;
  const dow = d.getUTCDay();
  if (dow === 6)
    return new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - 1),
    );
  if (dow === 0)
    return new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1),
    );
  return d;
}

function buildHolidayMap(year: number): Map<string, string> {
  const raw: [Date, string][] = [
    [new Date(Date.UTC(year, 0, 1)), "New Year's Day"],
    [new Date(Date.UTC(year, 5, 19)), "Juneteenth"],
    [new Date(Date.UTC(year, 6, 4)), "Independence Day"],
    [new Date(Date.UTC(year, 10, 11)), "Veterans Day"],
    [new Date(Date.UTC(year, 11, 25)), "Christmas Day"],
    [getNthWeekday(year, 0, 1, 3), "MLK Day"],
    [getNthWeekday(year, 1, 1, 3), "Presidents' Day"],
    [getLastWeekday(year, 4, 1), "Memorial Day"],
    [getNthWeekday(year, 8, 1, 1), "Labor Day"],
    [getNthWeekday(year, 9, 1, 2), "Columbus Day"],
    [getNthWeekday(year, 10, 4, 4), "Thanksgiving"],
  ];
  const map = new Map<string, string>();
  for (const [d, name] of raw) {
    const obs = toObserved(d);
    if (!isNaN(obs.getTime())) map.set(obs.toISOString().slice(0, 10), name);
  }
  return map;
}

function getBusinessDays(
  year: number,
  month: number,
  holidays: Map<string, string>,
): Date[] {
  const days: Date[] = [];
  for (let d = 1; d <= 31; d++) {
    const date = new Date(Date.UTC(year, month, d));
    if (date.getUTCMonth() !== month) break;
    const dow = date.getUTCDay();
    if (
      dow !== 0 &&
      dow !== 6 &&
      !holidays.has(date.toISOString().slice(0, 10))
    ) {
      days.push(date);
    }
  }
  return days;
}

// ── Types & constants ────────────────────────────────────────────────────────

type DayEntry = {
  date: Date;
  selected: boolean;
  amounts: number[];
};

export type BatchPaymentModalProps = {
  open: boolean;
  onClose: () => void;
  accounts: Account[];
  defaultSourceAccount: string;
  onBatchSuccess: (count: number, total: number) => void;
  onBatchError: (error: unknown, msg: string) => void;
};

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
const DOW_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const STEPS = ["Configure", "Select Days", "Preview & Submit"];

// ── Component ────────────────────────────────────────────────────────────────

export default function BatchPaymentModal({
  open,
  onClose,
  accounts,
  defaultSourceAccount,
  onBatchSuccess,
  onBatchError,
}: BatchPaymentModalProps) {
  const { mutateAsync: insertPayment } = usePaymentInsert();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);

  const [selectedYear, setSelectedYear] = useState(() =>
    new Date().getFullYear(),
  );
  const [selectedMonth, setSelectedMonth] = useState(() =>
    new Date().getMonth(),
  );
  const [sourceAccount, setSourceAccount] = useState("");
  const [destinationAccount, setDestinationAccount] = useState("");
  const [defaultAmounts, setDefaultAmounts] = useState<number[]>([1.0, 2.0]);
  const [days, setDays] = useState<DayEntry[]>([]);

  useEffect(() => {
    if (!open) return;
    const today = new Date();
    setStep(0);
    setSubmitting(false);
    setProgress(0);
    setSelectedYear(today.getFullYear());
    setSelectedMonth(today.getMonth());
    setSourceAccount(defaultSourceAccount || "");
    setDestinationAccount("");
    setDefaultAmounts([1.0, 2.0]);
    setDays([]);
  }, [open, defaultSourceAccount]);

  const yearOptions = useMemo(() => {
    const y = new Date().getFullYear();
    return [y - 1, y, y + 1, y + 2];
  }, []);

  const holidayMap = useMemo(
    () => buildHolidayMap(selectedYear),
    [selectedYear],
  );

  const businessDays = useMemo(
    () => getBusinessDays(selectedYear, selectedMonth, holidayMap),
    [selectedYear, selectedMonth, holidayMap],
  );

  // Calendar grid: weeks of day-numbers (null = empty cell)
  const calendarWeeks = useMemo<(number | null)[][]>(() => {
    const firstDow = new Date(
      Date.UTC(selectedYear, selectedMonth, 1),
    ).getUTCDay();
    const daysInMonth = new Date(
      Date.UTC(selectedYear, selectedMonth + 1, 0),
    ).getUTCDate();
    const cells: (number | null)[] = Array(firstDow).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    const weeks: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
  }, [selectedYear, selectedMonth]);

  // Fast lookup: day-number -> DayEntry
  const dayEntryMap = useMemo(() => {
    const map = new Map<number, DayEntry>();
    days.forEach((d) => map.set(d.date.getUTCDate(), d));
    return map;
  }, [days]);

  const canProceedStep0 =
    !!sourceAccount &&
    !!destinationAccount &&
    sourceAccount !== destinationAccount &&
    defaultAmounts.length > 0 &&
    defaultAmounts.every((a) => a > 0);

  const selectedDays = days.filter((d) => d.selected);

  const previewPayments = useMemo<{ date: Date; amount: number }[]>(
    () =>
      selectedDays.flatMap((day) =>
        day.amounts.map((amount) => ({ date: day.date, amount })),
      ),
    [selectedDays],
  );

  const totalAmount = previewPayments.reduce((sum, p) => sum + p.amount, 0);

  const handleNext = () => {
    if (step === 0) {
      setDays(
        businessDays.map((date) => ({
          date,
          selected: true,
          amounts: [...defaultAmounts],
        })),
      );
      setStep(1);
    } else {
      setStep(2);
    }
  };

  const toggleAllDays = (selected: boolean) =>
    setDays((prev) => prev.map((d) => ({ ...d, selected })));

  const toggleDay = (dayNum: number) =>
    setDays((prev) =>
      prev.map((d) =>
        d.date.getUTCDate() === dayNum ? { ...d, selected: !d.selected } : d,
      ),
    );

  const toggleHoliday = (dayNum: number) => {
    const date = new Date(Date.UTC(selectedYear, selectedMonth, dayNum));
    setDays((prev) => {
      const exists = prev.some((d) => d.date.getUTCDate() === dayNum);
      if (exists) {
        return prev.filter((d) => d.date.getUTCDate() !== dayNum);
      }
      const newEntry: DayEntry = {
        date,
        selected: true,
        amounts: [...defaultAmounts],
      };
      return [...prev, newEntry].sort(
        (a, b) => a.date.getTime() - b.date.getTime(),
      );
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setProgress(0);
    let successCount = 0;
    let totalInserted = 0;

    for (let i = 0; i < previewPayments.length; i++) {
      const { date, amount } = previewPayments[i];
      try {
        await insertPayment({
          payload: {
            paymentId: 0,
            transactionDate: date,
            sourceAccount,
            destinationAccount,
            amount,
            activeStatus: true,
          } as Payment,
        });
        successCount++;
        totalInserted += amount;
      } catch (error) {
        onBatchError(
          error,
          `Failed on ${formatDateForDisplay(date)}: ${currencyFormat(amount)}`,
        );
      }
      setProgress(Math.round(((i + 1) / previewPayments.length) * 100));
    }

    setSubmitting(false);
    onClose();
    onBatchSuccess(successCount, totalInserted);
  };

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      fullWidth
      maxWidth="md"
      slotProps={{ paper: { sx: { maxHeight: "90vh" } } }}
      aria-labelledby="batch-payment-dialog-title"
    >
      <DialogTitle id="batch-payment-dialog-title">Batch Payments</DialogTitle>
      <DialogContent dividers sx={{ overflowY: "auto" }}>
        <Stepper activeStep={step} sx={{ mb: 3 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* ── Step 0: Configure ── */}
        {step === 0 && (
          <Stack spacing={2.5}>
            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel id="batch-month-label">Month</InputLabel>
                <Select
                  labelId="batch-month-label"
                  value={selectedMonth}
                  label="Month"
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                >
                  {MONTH_NAMES.map((m, i) => (
                    <MenuItem key={m} value={i}>
                      {m}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 110 }}>
                <InputLabel id="batch-year-label">Year</InputLabel>
                <Select
                  labelId="batch-year-label"
                  value={selectedYear}
                  label="Year"
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                >
                  {yearOptions.map((y) => (
                    <MenuItem key={y} value={y}>
                      {y}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Autocomplete
              options={accounts.filter((a) => isAssetAccount(a.accountType))}
              getOptionLabel={(a: Account) => a.accountNameOwner || ""}
              isOptionEqualToValue={(o, v) =>
                o.accountNameOwner === v?.accountNameOwner
              }
              value={
                accounts.find((a) => a.accountNameOwner === sourceAccount) ||
                null
              }
              onChange={(_, v) => setSourceAccount(v?.accountNameOwner || "")}
              renderInput={(params) => (
                <TextField {...params} label="Source Account" />
              )}
            />

            <Autocomplete
              options={accounts.filter(
                (a) =>
                  isLiabilityAccount(a.accountType) &&
                  a.accountNameOwner !== sourceAccount,
              )}
              getOptionLabel={(a: Account) => a.accountNameOwner || ""}
              isOptionEqualToValue={(o, v) =>
                o.accountNameOwner === v?.accountNameOwner
              }
              value={
                accounts.find(
                  (a) => a.accountNameOwner === destinationAccount,
                ) || null
              }
              onChange={(_, v) =>
                setDestinationAccount(v?.accountNameOwner || "")
              }
              renderInput={(params) => (
                <TextField {...params} label="Destination Account (Credit)" />
              )}
            />

            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Default Payment Amounts
              </Typography>
              <Stack spacing={1}>
                {defaultAmounts.map((amt, i) => (
                  <Box
                    key={i}
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <TextField
                      label={`Amount ${i + 1}`}
                      type="number"
                      value={amt}
                      size="small"
                      slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setDefaultAmounts((prev) =>
                          prev.map((a, j) =>
                            j === i ? (isNaN(val) ? 0 : val) : a,
                          ),
                        );
                      }}
                      sx={{ width: 140 }}
                    />
                    {defaultAmounts.length > 1 && (
                      <IconButton
                        size="small"
                        aria-label={`Remove amount ${i + 1}`}
                        onClick={() =>
                          setDefaultAmounts((prev) =>
                            prev.filter((_, j) => j !== i),
                          )
                        }
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                ))}
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => setDefaultAmounts((prev) => [...prev, 1.0])}
                  sx={{ alignSelf: "flex-start" }}
                >
                  Add Amount
                </Button>
              </Stack>
            </Box>

            <Typography variant="caption" color="text.secondary">
              {businessDays.length} business days in{" "}
              {MONTH_NAMES[selectedMonth]} {selectedYear}
              {" — "}weekends &amp; US federal holidays excluded (UI only — backend accepts any date)
            </Typography>
          </Stack>
        )}

        {/* ── Step 1: Select Days (calendar) ── */}
        {step === 1 && (
          <Box>
            {/* Summary row */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {selectedDays.length} of {days.length} days &nbsp;·&nbsp;
                {previewPayments.length} payments &nbsp;·&nbsp;
                {currencyFormat(totalAmount)} total
              </Typography>
              <Box sx={{ flex: 1 }} />
              <Button size="small" onClick={() => toggleAllDays(true)}>
                Select All
              </Button>
              <Button size="small" onClick={() => toggleAllDays(false)}>
                Deselect All
              </Button>
            </Box>

            {/* Month + Year label */}
            <Typography
              variant="subtitle2"
              align="center"
              sx={{ mb: 1.5, fontWeight: 600 }}
            >
              {MONTH_NAMES[selectedMonth]} {selectedYear}
            </Typography>

            {/* Day-of-week headers */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                mb: 0.5,
              }}
            >
              {DOW_HEADERS.map((h) => (
                <Typography
                  key={h}
                  variant="caption"
                  align="center"
                  sx={{ fontWeight: 600, color: "text.secondary", py: 0.5 }}
                >
                  {h}
                </Typography>
              ))}
            </Box>

            {/* Calendar weeks */}
            {calendarWeeks.map((week, wi) => (
              <Box
                key={wi}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: 0.5,
                  mb: 0.5,
                }}
              >
                {week.map((dayNum, ci) => {
                  if (dayNum === null) return <Box key={ci} />;

                  const isoDate = new Date(
                    Date.UTC(selectedYear, selectedMonth, dayNum),
                  )
                    .toISOString()
                    .slice(0, 10);
                  const dow = new Date(
                    Date.UTC(selectedYear, selectedMonth, dayNum),
                  ).getUTCDay();
                  const isWeekend = dow === 0 || dow === 6;
                  const holidayName = holidayMap.get(isoDate);
                  const isBusiness = !isWeekend && !holidayName;
                  const isHoliday = !!holidayName;
                  const isClickable = isBusiness || isHoliday;
                  const entry = dayEntryMap.get(dayNum);
                  const isSelected = entry?.selected ?? false;
                  const isHolidayIncluded = isHoliday && !!entry;

                  let tooltip = "";
                  if (holidayName)
                    tooltip = isHolidayIncluded
                      ? `${holidayName} (included — click to remove)`
                      : `${holidayName} — click to include`;
                  else if (isWeekend) tooltip = "Weekend";

                  const cell = (
                    <Box
                      key={ci}
                      onClick={() => {
                        if (isBusiness) toggleDay(dayNum);
                        else if (isHoliday) toggleHoliday(dayNum);
                      }}
                      sx={{
                        height: 44,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 1,
                        cursor: isClickable ? "pointer" : "default",
                        bgcolor: isSelected
                          ? "primary.main"
                          : isHoliday
                            ? "warning.light"
                            : isWeekend
                              ? "action.disabledBackground"
                              : "transparent",
                        color: isSelected
                          ? "primary.contrastText"
                          : isClickable
                            ? "text.primary"
                            : "text.disabled",
                        border:
                          isClickable && !isSelected ? "1px solid" : "none",
                        borderColor: isHoliday ? "warning.main" : "divider",
                        transition: "background-color 0.15s, color 0.15s",
                        "&:hover": isClickable
                          ? {
                              bgcolor: isSelected
                                ? "primary.dark"
                                : isHoliday
                                  ? "warning.main"
                                  : "action.selected",
                            }
                          : {},
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: isSelected ? 700 : 400,
                          lineHeight: 1,
                        }}
                      >
                        {dayNum}
                      </Typography>
                    </Box>
                  );

                  return tooltip ? (
                    <Tooltip key={ci} title={tooltip} placement="top">
                      {cell}
                    </Tooltip>
                  ) : (
                    <React.Fragment key={ci}>{cell}</React.Fragment>
                  );
                })}
              </Box>
            ))}

            {/* Legend */}
            <Box sx={{ display: "flex", gap: 2, mt: 2, flexWrap: "wrap" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box
                  sx={{
                    width: 14,
                    height: 14,
                    borderRadius: 0.5,
                    bgcolor: "primary.main",
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  Selected
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box
                  sx={{
                    width: 14,
                    height: 14,
                    borderRadius: 0.5,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  Available
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box
                  sx={{
                    width: 14,
                    height: 14,
                    borderRadius: 0.5,
                    bgcolor: "warning.light",
                    border: "1px solid",
                    borderColor: "warning.main",
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  Holiday (click to include)
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box
                  sx={{
                    width: 14,
                    height: 14,
                    borderRadius: 0.5,
                    bgcolor: "action.disabledBackground",
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  Weekend
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        {/* ── Step 2: Preview & Submit ── */}
        {step === 2 && (
          <Box>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
              <Chip label={`${previewPayments.length} payments`} />
              <Chip
                label={`Total: ${currencyFormat(totalAmount)}`}
                color="primary"
              />
              <Chip
                label={`${sourceAccount} → ${destinationAccount}`}
                variant="outlined"
                size="small"
                sx={{ maxWidth: 380, overflow: "hidden" }}
              />
            </Box>
            {submitting && (
              <Box sx={{ mb: 2 }}>
                <LinearProgress variant="determinate" value={progress} />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.5, display: "block" }}
                >
                  Submitting... {progress}%
                </Typography>
              </Box>
            )}
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell>Destination</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewPayments.map((p, i) => (
                    <TableRow key={i} hover>
                      <TableCell>{formatDateForDisplay(p.date)}</TableCell>
                      <TableCell>{sourceAccount}</TableCell>
                      <TableCell>{destinationAccount}</TableCell>
                      <TableCell align="right">
                        {currencyFormat(p.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button
          variant="outlined"
          onClick={step === 0 ? onClose : () => setStep((s) => s - 1)}
          disabled={submitting}
        >
          {step === 0 ? "Cancel" : "Back"}
        </Button>
        {step < 2 && (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={step === 0 ? !canProceedStep0 : selectedDays.length === 0}
          >
            Next
          </Button>
        )}
        {step === 2 && (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting || previewPayments.length === 0}
          >
            {submitting
              ? `Submitting… ${progress}%`
              : `Submit ${previewPayments.length} Payments`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
