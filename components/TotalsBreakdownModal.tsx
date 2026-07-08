import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography,
  Box,
} from "@mui/material";
import { currencyFormat, noNaN } from "./Common";

export type BreakdownRow = {
  accountNameOwner: string;
  amount: number;
};

type TotalsBreakdownModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  rows: BreakdownRow[];
  total: number;
};

export default function TotalsBreakdownModal({
  open,
  onClose,
  title,
  rows,
  total,
}: TotalsBreakdownModalProps) {
  const computedSum = rows.reduce((sum, row) => sum + noNaN(row.amount), 0);
  const mismatch = Math.abs(computedSum - noNaN(total)) > 0.005;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby="totals-breakdown-dialog-title"
    >
      <DialogTitle id="totals-breakdown-dialog-title">{title}</DialogTitle>
      <DialogContent dividers>
        {rows.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No accounts contribute to this total.
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Account</TableCell>
                <TableCell align="right">Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.accountNameOwner}>
                  <TableCell>{row.accountNameOwner}</TableCell>
                  <TableCell align="right">
                    {currencyFormat(row.amount)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell sx={{ fontWeight: 700, borderBottom: "none" }}>
                  Sum
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 700, borderBottom: "none" }}
                >
                  {currencyFormat(computedSum)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
        {mismatch && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Card total is {currencyFormat(total)}. It may differ slightly from
              the sum above if it includes accounts excluded here (e.g. inactive
              accounts).
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose} aria-label="Close">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
