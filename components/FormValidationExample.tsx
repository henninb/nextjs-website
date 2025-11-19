/**
 * Form Validation Example Component
 *
 * This component demonstrates best practices for handling validation errors
 * in forms using the improved validation error messaging system.
 *
 * Use this as a reference when implementing forms across the application.
 */

import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from "@mui/material";
import { isValidationError } from "../utils/hookValidation";
import {
  extractFormFieldErrors,
  getUserFriendlyErrorMessage,
  hasFieldValidationErrors,
  useFormErrorHandler,
} from "../utils/formErrorHandling";
import ValidationErrorList from "./ValidationErrorList";
import FormFieldError from "./FormFieldError";
import SnackbarBaseline from "./SnackbarBaseline";

/**
 * EXAMPLE 1: Basic Form with Field-Specific Errors
 *
 * This example shows how to handle validation errors in a simple form
 */
export function BasicFormExample() {
  const [formData, setFormData] = useState({
    transactionDate: "",
    amount: "",
    description: "",
  });

  // State for field-specific errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // State for Snackbar (toast notification)
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"error" | "success">("error");

  const handleSubmit = async () => {
    try {
      // Clear previous field errors
      setFieldErrors({});

      // Call your mutation (e.g., insertTransaction, insertPayment, etc.)
      // await insertTransaction({ payload: formData });

      // On success
      setSnackbarMessage("Transaction added successfully");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error: any) {
      // Extract field-specific errors
      const errors = extractFormFieldErrors(error);

      if (Object.keys(errors).length > 0) {
        // We have field-specific errors - display them on the form
        setFieldErrors(errors);
      }

      // Also show a Snackbar message
      const message = getUserFriendlyErrorMessage(error, "Failed to add transaction");
      setSnackbarMessage(message);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  return (
    <Box>
      <TextField
        label="Transaction Date"
        value={formData.transactionDate}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, transactionDate: e.target.value }))
        }
        error={!!fieldErrors.transactionDate}
        helperText={fieldErrors.transactionDate}
        fullWidth
      />

      <TextField
        label="Amount"
        value={formData.amount}
        onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
        error={!!fieldErrors.amount}
        helperText={fieldErrors.amount}
        fullWidth
        sx={{ mt: 2 }}
      />

      <TextField
        label="Description"
        value={formData.description}
        onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
        error={!!fieldErrors.description}
        helperText={fieldErrors.description}
        fullWidth
        sx={{ mt: 2 }}
      />

      <Button variant="contained" onClick={handleSubmit} sx={{ mt: 2 }}>
        Submit
      </Button>

      <SnackbarBaseline
        message={snackbarMessage}
        state={snackbarOpen}
        handleSnackbarClose={() => setSnackbarOpen(false)}
        severity={snackbarSeverity}
      />
    </Box>
  );
}

/**
 * EXAMPLE 2: Form with ValidationErrorList Component
 *
 * This example shows how to display all validation errors in a structured list
 */
export function FormWithErrorListExample() {
  const [formData, setFormData] = useState({
    transactionDate: "",
    amount: "",
    description: "",
  });

  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"error" | "success">("error");

  const handleSubmit = async () => {
    try {
      // Clear previous errors
      setValidationErrors([]);

      // Call your mutation
      // await insertTransaction({ payload: formData });

      setSnackbarMessage("Transaction added successfully");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error: any) {
      // Check if error has validation errors
      if (isValidationError(error) && error.validationErrors) {
        // Set validation errors for display
        setValidationErrors(error.validationErrors);
      }

      // Show Snackbar
      const message = getUserFriendlyErrorMessage(error, "Failed to add transaction");
      setSnackbarMessage(message);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  return (
    <Box>
      {/* Display all validation errors at the top */}
      {validationErrors.length > 0 && (
        <ValidationErrorList errors={validationErrors} variant="alert" />
      )}

      <TextField label="Transaction Date" fullWidth />
      <TextField label="Amount" fullWidth sx={{ mt: 2 }} />
      <TextField label="Description" fullWidth sx={{ mt: 2 }} />

      <Button variant="contained" onClick={handleSubmit} sx={{ mt: 2 }}>
        Submit
      </Button>

      <SnackbarBaseline
        message={snackbarMessage}
        state={snackbarOpen}
        handleSnackbarClose={() => setSnackbarOpen(false)}
        severity={snackbarSeverity}
      />
    </Box>
  );
}

/**
 * EXAMPLE 3: Using useFormErrorHandler Hook
 *
 * This example shows how to use the useFormErrorHandler hook for simplified error handling
 */
export function FormWithHookExample() {
  const [formData, setFormData] = useState({
    transactionDate: "",
    amount: "",
    description: "",
  });

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"error" | "success">("error");

  // Use the form error handler hook
  const { fieldErrors, clearAllFieldErrors, handleFormError } = useFormErrorHandler({
    onError: (message) => {
      setSnackbarMessage(message);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    },
  });

  const handleSubmit = async () => {
    try {
      // Clear previous errors
      clearAllFieldErrors();

      // Call your mutation
      // await insertTransaction({ payload: formData });

      setSnackbarMessage("Transaction added successfully");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error: any) {
      // Handle error (automatically extracts field errors and shows Snackbar)
      handleFormError(error, "Failed to add transaction");
    }
  };

  return (
    <Box>
      <TextField
        label="Transaction Date"
        error={!!fieldErrors.transactionDate}
        helperText={fieldErrors.transactionDate}
        fullWidth
      />

      <TextField
        label="Amount"
        error={!!fieldErrors.amount}
        helperText={fieldErrors.amount}
        fullWidth
        sx={{ mt: 2 }}
      />

      <TextField
        label="Description"
        error={!!fieldErrors.description}
        helperText={fieldErrors.description}
        fullWidth
        sx={{ mt: 2 }}
      />

      <Button variant="contained" onClick={handleSubmit} sx={{ mt: 2 }}>
        Submit
      </Button>

      <SnackbarBaseline
        message={snackbarMessage}
        state={snackbarOpen}
        handleSnackbarClose={() => setSnackbarOpen(false)}
        severity={snackbarSeverity}
      />
    </Box>
  );
}

/**
 * EXAMPLE 4: Modal Form with Validation
 *
 * This example shows how to handle validation in a modal dialog
 */
export function ModalFormExample() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    transactionDate: "",
    amount: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async () => {
    try {
      // Clear errors
      setFieldErrors({});

      // Call mutation
      // await insertPayment({ payload: formData });

      // Close modal on success
      setOpen(false);
    } catch (error: any) {
      // Extract and set field errors
      const errors = extractFormFieldErrors(error);
      setFieldErrors(errors);

      // Optionally show Snackbar (not shown in modal to avoid clutter)
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Form</Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Payment</DialogTitle>
        <DialogContent>
          {/* Show validation errors at top of modal if any */}
          {Object.keys(fieldErrors).length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Please fix the errors below:
            </Alert>
          )}

          <TextField
            label="Transaction Date"
            value={formData.transactionDate}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, transactionDate: e.target.value }))
            }
            error={!!fieldErrors.transactionDate}
            helperText={fieldErrors.transactionDate || "Format: YYYY-MM-DD"}
            fullWidth
            margin="normal"
          />

          <TextField
            label="Amount"
            value={formData.amount}
            onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
            error={!!fieldErrors.amount}
            helperText={fieldErrors.amount}
            fullWidth
            margin="normal"
          />

          {/* Alternative: Use FormFieldError component for custom styling */}
          {fieldErrors.amount && <FormFieldError message={fieldErrors.amount} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

/**
 * EXAMPLE 5: Handling Mixed Validation (Client + Server)
 *
 * This example shows how to combine client-side validation with server-side validation errors
 */
export function MixedValidationExample() {
  const [formData, setFormData] = useState({
    sourceAccount: "",
    destinationAccount: "",
    amount: "",
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async () => {
    try {
      // Step 1: Client-side validation
      const clientErrors: Record<string, string> = {};

      if (formData.sourceAccount === formData.destinationAccount) {
        clientErrors.accounts = "Source and destination must be different";
      }

      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        clientErrors.amount = "Amount must be greater than zero";
      }

      if (Object.keys(clientErrors).length > 0) {
        setFieldErrors(clientErrors);
        return;
      }

      // Step 2: Server-side validation (will happen in hook)
      // await insertPayment({ payload: formData });

      // Success - clear errors
      setFieldErrors({});
    } catch (error: any) {
      // Step 3: Handle server validation errors
      const serverErrors = extractFormFieldErrors(error);

      // Combine with any remaining client errors
      setFieldErrors({
        ...fieldErrors,
        ...serverErrors,
      });
    }
  };

  return (
    <Box>
      <TextField
        label="Source Account"
        value={formData.sourceAccount}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, sourceAccount: e.target.value }))
        }
        error={!!fieldErrors.sourceAccount || !!fieldErrors.accounts}
        helperText={fieldErrors.sourceAccount || fieldErrors.accounts}
        fullWidth
      />

      <TextField
        label="Destination Account"
        value={formData.destinationAccount}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, destinationAccount: e.target.value }))
        }
        error={!!fieldErrors.destinationAccount}
        helperText={fieldErrors.destinationAccount}
        fullWidth
        sx={{ mt: 2 }}
      />

      <TextField
        label="Amount"
        value={formData.amount}
        onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
        error={!!fieldErrors.amount}
        helperText={fieldErrors.amount}
        fullWidth
        sx={{ mt: 2 }}
      />

      <Button variant="contained" onClick={handleSubmit} sx={{ mt: 2 }}>
        Submit
      </Button>
    </Box>
  );
}

export default BasicFormExample;
