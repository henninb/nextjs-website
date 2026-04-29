import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Stack,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Transaction from "../model/Transaction";
import { currencyFormat, formatDateForDisplay } from "./Common";
import { ImageFormatType } from "../model/ImageFormatType";

interface ReceiptLightboxProps {
  open: boolean;
  onClose: () => void;
  transaction: Transaction;
}

export function buildImageSrc(image: string, format: ImageFormatType): string {
  if (image.startsWith("data:")) return image;
  const mime = format === "png" ? "image/png" : "image/jpeg";
  return `data:${mime};base64,${image}`;
}

const ReceiptLightbox: React.FC<ReceiptLightboxProps> = ({
  open,
  onClose,
  transaction,
}) => {
  const receipt = transaction.receiptImage;
  if (!receipt) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
              {transaction.description || "Receipt"}
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                {formatDateForDisplay(transaction.transactionDate)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                {currencyFormat(transaction.amount ?? 0)}
              </Typography>
            </Stack>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ mt: -0.5, mr: -0.5 }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 300,
          }}
        >
          <Box
            component="img"
            src={buildImageSrc(receipt.image, receipt.imageFormatType)}
            alt={`Receipt for ${transaction.description}`}
            sx={{
              maxWidth: "100%",
              maxHeight: "70vh",
              objectFit: "contain",
              borderRadius: 1,
            }}
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptLightbox;
