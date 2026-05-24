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
  Checkbox,
  IconButton,
  Chip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import Account from "../model/Account";
import Payment from "../model/Payment";
import { currencyFormat, formatDateForDisplay } from "./Common";
import usePaymentInsert from "../hooks/usePaymentInsert";

// ── US Federal Holiday helpers ──────────────────────────────────────────────

function getNthWeekday(year: number, month: number, weekday: number, n: number): Date {
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
  if (dow === 6) return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - 1));
  if (dow === 0) return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1));
  return d;
}

function getUSFederalHolidays(year: number): Set<string> {
  const holidays = [
    new Date(Date.UTC(year, 0, 1)),    // New Year's Day
    new Date(Date.UTC(year, 5, 19)),   // Juneteenth
    new Date(Date.UTC(year, 6, 4)),    // Independence Day
    new Date(Date.UTC(year, 10, 11)),  // Veterans Day
    new Date(Date.UTC(year, 11, 25)),  // Christmas Day
    getNthWeekday(year, 0, 1, 3),      // MLK Day: 3rd Mon Jan
    getNthWeekday(year, 1, 1, 3),      // Presidents' Day: 3rd Mon Feb
    getLastWeekday(year, 4, 1),        // Memorial Day: last Mon May
    getNthWeekday(year, 8, 1, 1),      // Labor Day: 1st Mon Sep
    getNthWeekday(year, 9, 1, 2),      // Columbus Day: 2nd Mon Oct
    getNthWeekday(year, 10, 4, 4),     // Thanksgiving: 4th Thu Nov
  ].map(toObserved);

  return new Set(
    holidays
      .filter((d) => !isNaN(d.getTime()))
      .map((d) => d.toISOString().slice(0, 10)),
  );
}

function getBusinessDays(year: number, month: number): Date[] {
  const holidays = getUSFederalHolidays(year);
  const days: Date[] = [];
  for (let d = 1; d <= 31; d++) {
    const date = new Date(Date.UTC(year, month, d));
    if (date.getUTCMonth() !== month) break;
    const dow = date.getUTCDay();
    if (dow !== 0 && dow !== 6 && !holidays.has(date.toISOString().slice(0, 10))) {
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
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DOW_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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

  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth());
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

  const businessDays = useMemo(
    () => getBusinessDays(selectedYear, selectedMonth),
    [selectedYear, selectedMonth],
  );

  const canProceedStep0 =
    !!sourceAccount &&
    !!destinationAccount &&
    sourceAccount !== destinationAccount &&
    defaultAmounts.length > 0 &&
    defaultAmounts.every((a) => a > 0);

  const selectedDays = days.filter((d) => d.selected);

  const previewPayments = useMemo<{ date: Date; amount: number }[]>(
    () => selectedDays.flatMap((day) => day.amounts.map((amount) => ({ date: day.date, amount }))),
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
        onBatchError(error, `Failed on ${formatDateForDisplay(date)}: ${currencyFormat(amount)}`);
      }
      setProgress(Math.round(((i + 1) / previewPayments.length) * 100));
    }

    setSubmitting(false);
    onClose();
    onBatchSuccess(successCount, totalInserted);
  };

  const toggleAllDays = (selected: boolean) =>
    setDays((prev) => prev.map((d) => ({ ...d, selected })));

  const updateDayAmount = (dayIdx: number, amtIdx: number, value: number) =>
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIdx
          ? { ...d, amounts: d.amounts.map((a, j) => (j === amtIdx ? value : a)) }
          : d,
      ),
    );

  const formatDayLabel = (date: Date) =>
    `${DOW_ABBR[date.getUTCDay()]}, ${MONTH_NAMES[date.getUTCMonth()].slice(0, 3)} ${date.getUTCDate()}`;

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      fullWidth
      maxWidth="md"
      aria-labelledby="batch-payment-dialog-title"
    >
      <DialogTitle id="batch-payment-dialog-title">Batch Payments</DialogTitle>
      <DialogContent dividers>
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
              options={accounts.filter((a) => a.accountType === "debit")}
              getOptionLabel={(a: Account) => a.accountNameOwner || ""}
              isOptionEqualToValue={(o, v) => o.accountNameOwner === v?.accountNameOwner}
              value={accounts.find((a) => a.accountNameOwner === sourceAccount) || null}
              onChange={(_, v) => setSourceAccount(v?.accountNameOwner || "")}
              renderInput={(params) => (
                <TextField {...params} label="Source Account (Debit)" />
              )}
            />

            <Autocomplete
              options={accounts.filter(
                (a) => a.accountType === "credit" && a.accountNameOwner !== sourceAccount,
              )}
              getOptionLabel={(a: Account) => a.accountNameOwner || ""}
              isOptionEqualToValue={(o, v) => o.accountNameOwner === v?.accountNameOwner}
              value={accounts.find((a) => a.accountNameOwner === destinationAccount) || null}
              onChange={(_, v) => setDestinationAccount(v?.accountNameOwner || "")}
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
                  <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TextField
                      label={`Amount ${i + 1}`}
                      type="number"
                      value={amt}
                      size="small"
                      slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setDefaultAmounts((prev) =>
                          prev.map((a, j) => (j === i ? (isNaN(val) ? 0 : val) : a)),
                        );
                      }}
                      sx={{ width: 140 }}
                    />
                    {defaultAmounts.length > 1 && (
                      <IconButton
                        size="small"
                        aria-label={`Remove amount ${i + 1}`}
                        onClick={() =>
                          setDefaultAmounts((prev) => prev.filter((_, j) => j !== i))
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
              {businessDays.length} business days in {MONTH_NAMES[selectedMonth]} {selectedYear}
              {" — "}weekends &amp; US federal holidays excluded
            </Typography>
          </Stack>
        )}

        {/* ── Step 1: Select Days ── */}
        {step === 1 && (
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1.5, gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {selectedDays.length} of {days.length} days selected &nbsp;·&nbsp;
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
            <TableContainer sx={{ maxHeight: 420 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" />
                    <TableCell>Date</TableCell>
                    {defaultAmounts.map((_, i) => (
                      <TableCell key={i} align="right">
                        Amt {i + 1}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {days.map((day, di) => (
                    <TableRow key={di} hover selected={day.selected}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={day.selected}
                          size="small"
                          onChange={(e) =>
                            setDays((prev) =>
                              prev.map((d, j) =>
                                j === di ? { ...d, selected: e.target.checked } : d,
                              ),
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ opacity: day.selected ? 1 : 0.38 }}
                        >
                          {formatDayLabel(day.date)}
                        </Typography>
                      </TableCell>
                      {day.amounts.map((amt, ai) => (
                        <TableCell key={ai} align="right">
                          <TextField
                            type="number"
                            value={amt}
                            size="small"
                            disabled={!day.selected}
                            slotProps={{
                              htmlInput: {
                                min: 0.01,
                                step: 0.01,
                                style: { textAlign: "right", width: 64 },
                              },
                            }}
                            onChange={(e) =>
                              updateDayAmount(di, ai, parseFloat(e.target.value) || 0)
                            }
                            variant="standard"
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* ── Step 2: Preview & Submit ── */}
        {step === 2 && (
          <Box>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
              <Chip label={`${previewPayments.length} payments`} />
              <Chip label={`Total: ${currencyFormat(totalAmount)}`} color="primary" />
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
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                  Submitting... {progress}%
                </Typography>
              </Box>
            )}
            <TableContainer sx={{ maxHeight: 420 }}>
              <Table size="small" stickyHeader>
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
                      <TableCell align="right">{currencyFormat(p.amount)}</TableCell>
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
