import React from "react";
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
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
};

export default function SummaryBar({ total, cleared, outstanding, future, selected, selectedLabel = "Selected" }: SummaryBarProps) {
  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell align="center">
              <strong>Total</strong>
            </TableCell>
            <TableCell align="center">
              <CheckCircleIcon fontSize="small" style={{ verticalAlign: "middle" }} /> <strong>Cleared</strong>
            </TableCell>
            <TableCell align="center">
              <AccessTimeIcon fontSize="small" style={{ verticalAlign: "middle" }} /> <strong>Outstanding</strong>
            </TableCell>
            <TableCell align="center">
              <EventNoteIcon fontSize="small" style={{ verticalAlign: "middle" }} /> <strong>Future</strong>
            </TableCell>
            {selected !== undefined && (
              <TableCell align="center">
                <strong>{selectedLabel}</strong>
              </TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell align="center">{total}</TableCell>
            <TableCell align="center">{cleared}</TableCell>
            <TableCell align="center">{outstanding}</TableCell>
            <TableCell align="center">{future}</TableCell>
            {selected !== undefined && (
              <TableCell align="center">{selected}</TableCell>
            )}
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}
