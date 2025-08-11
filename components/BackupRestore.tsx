import React, { useState, useRef } from "react";
import { Box, Button, Typography } from "@mui/material";
import useAccountFetch from "../hooks/useAccountFetch";
import useCategoryFetch from "../hooks/useCategoryFetch";
import useDescriptionFetch from "../hooks/useDescriptionFetch";
import useParameterFetch from "../hooks/useParameterFetch";
import usePaymentFetch from "../hooks/usePaymentFetch";
import usePendingTransactionFetch from "../hooks/usePendingTransactionFetch";
import useTransactionByAccountFetch from "../hooks/useTransactionByAccountFetch";
import useTransferFetch from "../hooks/useTransferFetch";
import useAccountInsert from "../hooks/useAccountInsert";
import useCategoryInsert from "../hooks/useCategoryInsert";
import useDescriptionInsert from "../hooks/useDescriptionInsert";
import useParameterInsert from "../hooks/useParameterInsert";
import usePaymentInsert from "../hooks/usePaymentInsert";
import usePendingTransactionInsert from "../hooks/usePendingTransactionInsert";
import useTransactionInsert from "../hooks/useTransactionInsert";
import useTransferInsert from "../hooks/useTransferInsert";

const BackupRestore: React.FC = () => {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: accounts } = useAccountFetch();
  const { data: categories } = useCategoryFetch();
  const { data: descriptions } = useDescriptionFetch();
  const { data: parameters } = useParameterFetch();
  const { data: payments } = usePaymentFetch();
  const { data: pendingTransactions } = usePendingTransactionFetch();
  const { data: transactions } = useTransactionByAccountFetch();
  const { data: transfers } = useTransferFetch();

  const { mutateAsync: insertAccount } = useAccountInsert();
  const { mutateAsync: insertCategory } = useCategoryInsert();
  const { mutateAsync: insertDescription } = useDescriptionInsert();
  const { mutateAsync: insertParameter } = useParameterInsert();
  const { mutateAsync: insertPayment } = usePaymentInsert();
  const { mutateAsync: insertPendingTransaction } =
    usePendingTransactionInsert();
  const { mutateAsync: insertTransaction } = useTransactionInsert();
  const { mutateAsync: insertTransfer } = useTransferInsert();

  const handleBackup = async () => {
    setIsBackingUp(true);
    setMessage("");
    try {
      const backupData = {
        accounts,
        categories,
        descriptions,
        parameters,
        payments,
        pendingTransactions,
        transactions,
        transfers,
      };

      const json = JSON.stringify(backupData, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `finance-backup-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage("Backup successful!");
    } catch (error) {
      setMessage("Backup failed.");
      console.error(error);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    setMessage("");
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result;
        if (typeof content !== "string") {
          setMessage("Invalid file content.");
          return;
        }

        const backupData = JSON.parse(content);

        // Clear existing data before restoring?
        // For now, we'll just insert new data.
        // Depending on the requirements, we might need to delete existing data first.

        if (backupData.accounts) {
          for (const item of backupData.accounts) {
            await insertAccount({ payload: item });
          }
        }
        if (backupData.categories) {
          for (const item of backupData.categories) {
            await insertCategory({ payload: item });
          }
        }
        if (backupData.descriptions) {
          for (const item of backupData.descriptions) {
            await insertDescription({ payload: item });
          }
        }
        if (backupData.parameters) {
          for (const item of backupData.parameters) {
            await insertParameter({ payload: item });
          }
        }
        if (backupData.payments) {
          for (const item of backupData.payments) {
            await insertPayment({ payload: item });
          }
        }
        if (backupData.pendingTransactions) {
          for (const item of backupData.pendingTransactions) {
            await insertPendingTransaction({ payload: item });
          }
        }
        if (backupData.transactions) {
          for (const item of backupData.transactions) {
            await insertTransaction({ payload: item });
          }
        }
        if (backupData.transfers) {
          for (const item of backupData.transfers) {
            await insertTransfer({ payload: item });
          }
        }

        setMessage("Restore successful!");
      };
      reader.readAsText(file);
    } catch (error) {
      setMessage("Restore failed.");
      console.error(error);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Backup and Restore
      </Typography>
      <Box sx={{ display: "flex", gap: 2 }}>
        <Button
          variant="contained"
          onClick={handleBackup}
          disabled={isBackingUp}
        >
          {isBackingUp ? "Backing up..." : "Backup to File"}
        </Button>
        <Button
          variant="contained"
          onClick={handleRestoreClick}
          disabled={isRestoring}
        >
          {isRestoring ? "Restoring..." : "Restore from File"}
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleRestore}
          style={{ display: "none" }}
          accept="application/json"
          data-testid="restore-input"
        />
      </Box>
      {message && <Typography sx={{ mt: 2 }}>{message}</Typography>}
    </Box>
  );
};

export default BackupRestore;
