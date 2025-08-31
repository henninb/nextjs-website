import React from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EventNoteIcon from "@mui/icons-material/EventNote";

type SummaryBarProps = {
  total: string | number;
  cleared: string | number;
  outstanding: string | number;
  future: string | number;
  selected?: string | number;
  selectedLabel?: string;
  totalLabel?: string;
  clearedLabel?: string;
  outstandingLabel?: string;
  futureLabel?: string;
};

export default function SummaryBar({
  total,
  cleared,
  outstanding,
  future,
  selected,
  selectedLabel = "Selected",
  totalLabel = "Total",
  clearedLabel = "Cleared",
  outstandingLabel = "Outstanding",
  futureLabel = "Future",
}: SummaryBarProps) {
  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell align="right">
              <strong>{totalLabel}</strong>
            </TableCell>
            <TableCell align="right">
              <CheckCircleIcon
                fontSize="small"
                style={{ verticalAlign: "middle" }}
              />{" "}
              <strong>{clearedLabel}</strong>
            </TableCell>
            <TableCell align="right">
              <AccessTimeIcon
                fontSize="small"
                style={{ verticalAlign: "middle" }}
              />{" "}
              <strong>{outstandingLabel}</strong>
            </TableCell>
            <TableCell align="right">
              <EventNoteIcon
                fontSize="small"
                style={{ verticalAlign: "middle" }}
              />{" "}
              <strong>{futureLabel}</strong>
            </TableCell>
            {selected !== undefined && (
              <TableCell align="right">
                <strong>{selectedLabel}</strong>
              </TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell align="right">{total}</TableCell>
            <TableCell align="right">{cleared}</TableCell>
            <TableCell align="right">{outstanding}</TableCell>
            <TableCell align="right">{future}</TableCell>
            {selected !== undefined && (
              <TableCell align="right">{selected}</TableCell>
            )}
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}
