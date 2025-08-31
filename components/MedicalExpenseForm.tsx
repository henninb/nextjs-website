import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Autocomplete,
  FormControlLabel,
  Switch,
  Grid,
  Alert,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
} from "@mui/material";
import {
  MedicalExpense,
  ClaimStatus,
  validateFinancialConsistency,
} from "../model/MedicalExpense";
import {
  FamilyMember,
  getFamilyMemberDisplayName,
} from "../model/FamilyMember";
import useFamilyMemberFetch from "../hooks/useFamilyMemberFetch";

interface MedicalExpenseFormProps {
  initialData?: Partial<MedicalExpense>;
  onSubmit: (data: Partial<MedicalExpense>) => void;
  onCancel: () => void;
  isEdit?: boolean;
}

export default function MedicalExpenseForm({
  initialData,
  onSubmit,
  onCancel,
  isEdit = false,
}: MedicalExpenseFormProps) {
  const [formData, setFormData] = useState<Partial<MedicalExpense>>({
    serviceDate: initialData?.serviceDate || null,
    transactionId: initialData?.transactionId || undefined, // Allow undefined for no transaction
    billedAmount: initialData?.billedAmount || 0,
    insuranceDiscount: initialData?.insuranceDiscount || 0,
    insurancePaid: initialData?.insurancePaid || 0,
    patientResponsibility: initialData?.patientResponsibility || 0,
    isOutOfNetwork: initialData?.isOutOfNetwork || false,
    claimStatus: initialData?.claimStatus || ClaimStatus.Submitted,
    activeStatus:
      initialData?.activeStatus !== undefined ? initialData.activeStatus : true,
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [financialWarning, setFinancialWarning] = useState<string>("");

  const {
    data: familyMembers,
    isLoading: familyMembersLoading,
    error: familyMembersError,
  } = useFamilyMemberFetch();

  const claimStatusOptions = Object.values(ClaimStatus);

  // Financial validation
  useEffect(() => {
    const {
      billedAmount = 0,
      insuranceDiscount = 0,
      insurancePaid = 0,
      patientResponsibility = 0,
    } = formData;

    if (billedAmount > 0) {
      const validation = validateFinancialConsistency(
        billedAmount,
        insuranceDiscount,
        insurancePaid,
        patientResponsibility,
      );

      if (!validation.isValid) {
        setFinancialWarning(validation.error || "");
      } else {
        const totalAllocated =
          insuranceDiscount + insurancePaid + patientResponsibility;
        if (totalAllocated > billedAmount) {
          setFinancialWarning(
            `Total allocated amount ($${totalAllocated.toFixed(2)}) exceeds billed amount ($${billedAmount.toFixed(2)})`,
          );
        } else {
          setFinancialWarning("");
        }
      }
    } else {
      setFinancialWarning("");
    }
  }, [
    formData.billedAmount,
    formData.insuranceDiscount,
    formData.insurancePaid,
    formData.patientResponsibility,
  ]);

  const handleFieldChange = (field: keyof MedicalExpense, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear field error when user starts fixing it
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required field validation
    if (!formData.serviceDate) {
      newErrors.serviceDate = "Service date is required";
    }

    // Transaction ID is optional - medical expenses can exist without linked transactions
    // if (!formData.transactionId || formData.transactionId <= 0) {
    //   newErrors.transactionId = "Transaction ID is required";
    // }

    if (!formData.billedAmount || formData.billedAmount <= 0) {
      newErrors.billedAmount = "Billed amount must be greater than 0";
    }

    // Financial consistency validation
    if (formData.billedAmount && formData.billedAmount > 0) {
      const {
        billedAmount = 0,
        insuranceDiscount = 0,
        insurancePaid = 0,
        patientResponsibility = 0,
      } = formData;
      const validation = validateFinancialConsistency(
        billedAmount,
        insuranceDiscount,
        insurancePaid,
        patientResponsibility,
      );

      if (!validation.isValid) {
        newErrors.financial =
          "Total allocated amount cannot exceed billed amount";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  const selectedFamilyMember = familyMembers?.find(
    (fm) => fm.familyMemberId === formData.familyMemberId,
  );

  // Helper function to format date for input
  const formatDateForInput = (date: Date | null | undefined): string => {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split("T")[0]; // Returns YYYY-MM-DD format
  };

  // Helper function to parse date from input
  const parseDateFromInput = (dateString: string): Date | null => {
    if (!dateString) return null;
    return new Date(dateString + "T00:00:00");
  };

  return (
    <Box component="form" onSubmit={handleSubmit} role="form" sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {isEdit ? "Edit Medical Expense" : "Add Medical Expense"}
      </Typography>

      {financialWarning && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {financialWarning}
        </Alert>
      )}

      {errors.financial && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errors.financial}
        </Alert>
      )}

      <Grid container spacing={2}>
        {/* Service Information */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Service Date"
            type="date"
            fullWidth
            required
            value={formatDateForInput(formData.serviceDate)}
            onChange={(e) =>
              handleFieldChange(
                "serviceDate",
                parseDateFromInput(e.target.value),
              )
            }
            error={!!errors.serviceDate}
            helperText={errors.serviceDate}
            InputLabelProps={{ shrink: true }}
            aria-describedby={
              errors.serviceDate ? "service-date-error" : undefined
            }
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Transaction ID"
            type="number"
            fullWidth
            value={formData.transactionId || ""}
            onChange={(e) =>
              handleFieldChange(
                "transactionId",
                e.target.value ? parseInt(e.target.value) : undefined,
              )
            }
            error={!!errors.transactionId}
            helperText={
              errors.transactionId || "Optional: Link to existing transaction"
            }
            placeholder="Leave empty if no transaction yet"
            inputProps={{
              min: 1,
              "aria-describedby": errors.transactionId
                ? "transaction-id-error"
                : undefined,
            }}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TextField
            label="Service Description"
            fullWidth
            multiline
            rows={2}
            value={formData.serviceDescription || ""}
            onChange={(e) =>
              handleFieldChange("serviceDescription", e.target.value)
            }
            placeholder="E.g., Annual physical exam, X-ray imaging, etc."
            helperText="Optional description of the medical service provided"
          />
        </Grid>

        {/* Financial Information */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Billed Amount"
            type="number"
            fullWidth
            required
            value={formData.billedAmount || ""}
            onChange={(e) =>
              handleFieldChange("billedAmount", Number(e.target.value) || 0)
            }
            error={!!errors.billedAmount}
            helperText={
              errors.billedAmount || "Total amount billed by provider"
            }
            inputProps={{ min: 0, step: 0.01 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Insurance Discount"
            type="number"
            fullWidth
            value={formData.insuranceDiscount || ""}
            onChange={(e) =>
              handleFieldChange(
                "insuranceDiscount",
                Number(e.target.value) || 0,
              )
            }
            helperText="Amount discounted by insurance"
            inputProps={{ min: 0, step: 0.01 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Insurance Paid"
            type="number"
            fullWidth
            value={formData.insurancePaid || ""}
            onChange={(e) =>
              handleFieldChange("insurancePaid", Number(e.target.value) || 0)
            }
            helperText="Amount paid by insurance"
            inputProps={{ min: 0, step: 0.01 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Patient Responsibility"
            type="number"
            fullWidth
            value={formData.patientResponsibility || ""}
            onChange={(e) =>
              handleFieldChange(
                "patientResponsibility",
                Number(e.target.value) || 0,
              )
            }
            helperText="Amount patient owes"
            inputProps={{ min: 0, step: 0.01 }}
          />
        </Grid>

        {/* Additional Information */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth>
            <InputLabel id="claim-status-label">Claim Status</InputLabel>
            <Select
              labelId="claim-status-label"
              label="Claim Status"
              value={formData.claimStatus || ClaimStatus.Submitted}
              onChange={(e) => handleFieldChange("claimStatus", e.target.value)}
            >
              {claimStatusOptions.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Autocomplete
            options={familyMembers || []}
            getOptionLabel={(option) => getFamilyMemberDisplayName(option)}
            value={selectedFamilyMember || null}
            onChange={(_, value) =>
              handleFieldChange("familyMemberId", value?.familyMemberId)
            }
            loading={familyMembersLoading}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Family Member"
                fullWidth
                helperText="Optional: Select family member for this expense"
              />
            )}
            isOptionEqualToValue={(option, value) =>
              option.familyMemberId === value.familyMemberId
            }
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Claim Number"
            fullWidth
            value={formData.claimNumber || ""}
            onChange={(e) => handleFieldChange("claimNumber", e.target.value)}
            placeholder="Insurance claim number"
            helperText="Insurance company claim reference number"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Procedure Code"
            fullWidth
            value={formData.procedureCode || ""}
            onChange={(e) => handleFieldChange("procedureCode", e.target.value)}
            placeholder="CPT/HCPCS code"
            helperText="Medical procedure code (CPT or HCPCS)"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Diagnosis Code"
            fullWidth
            value={formData.diagnosisCode || ""}
            onChange={(e) => handleFieldChange("diagnosisCode", e.target.value)}
            placeholder="ICD-10 code"
            helperText="Medical diagnosis code (ICD-10)"
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.isOutOfNetwork || false}
                onChange={(e) =>
                  handleFieldChange("isOutOfNetwork", e.target.checked)
                }
              />
            }
            label="Out-of-Network Provider"
          />
        </Grid>

        {formData.paidDate && (
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Paid Date"
              type="date"
              fullWidth
              value={formatDateForInput(formData.paidDate)}
              onChange={(e) =>
                handleFieldChange(
                  "paidDate",
                  parseDateFromInput(e.target.value),
                )
              }
              helperText="Date patient paid their responsibility"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        )}

        {/* Form Actions */}
        <Grid size={{ xs: 12 }}>
          <Box
            sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 2 }}
          >
            <Button variant="outlined" onClick={handleCancel} type="button">
              Cancel
            </Button>
            <Button variant="contained" type="submit" color="primary">
              Save
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
