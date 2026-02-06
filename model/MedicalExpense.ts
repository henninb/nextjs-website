export interface MedicalExpense {
  medicalExpenseId: number;
  owner?: string;
  transactionId: number;
  providerId?: number;
  familyMemberId?: number;
  serviceDate: Date;
  serviceDescription?: string;
  procedureCode?: string;
  diagnosisCode?: string;
  billedAmount: number;
  insuranceDiscount: number;
  insurancePaid: number;
  patientResponsibility: number;
  paidDate?: Date;
  isOutOfNetwork: boolean;
  claimNumber?: string;
  claimStatus: ClaimStatus;
  activeStatus: boolean;
  paidAmount: number; // Tracks actual payments made against patient responsibility
  dateAdded?: Date;
  dateUpdated?: Date;
}

export enum ClaimStatus {
  Submitted = "submitted",
  Processing = "processing",
  Approved = "approved",
  Denied = "denied",
  Paid = "paid",
  Closed = "closed",
}

export interface MedicalExpenseCreateRequest {
  transactionId?: number; // Optional - medical expenses can exist without linked transactions
  providerId?: number;
  familyMemberId?: number;
  serviceDate: Date;
  serviceDescription?: string;
  procedureCode?: string;
  diagnosisCode?: string;
  billedAmount: number;
  insuranceDiscount: number; // Required by backend
  insurancePaid: number; // Required by backend
  patientResponsibility: number; // Required by backend
  paidDate?: Date;
  isOutOfNetwork: boolean; // Required by backend
  claimNumber: string; // Required by backend
  claimStatus: ClaimStatus; // Required by backend
  paidAmount: number; // Required by backend, tracks actual payments made
}

export interface MedicalExpenseUpdateRequest {
  medicalExpenseId: number;
  transactionId?: number;
  providerId?: number;
  familyMemberId?: number;
  serviceDate?: Date;
  serviceDescription?: string;
  procedureCode?: string;
  diagnosisCode?: string;
  billedAmount?: number;
  insuranceDiscount?: number;
  insurancePaid?: number;
  patientResponsibility?: number;
  paidDate?: Date;
  isOutOfNetwork?: boolean;
  claimNumber?: string;
  claimStatus?: ClaimStatus;
  paidAmount?: number;
}

export interface MedicalExpenseTotals {
  totalBilled: number;
  totalInsurancePaid: number;
  totalPatientResponsibility: number;
  totalCovered: number;
}

export interface MedicalExpenseClaimStatusCounts {
  [ClaimStatus.Submitted]: number;
  [ClaimStatus.Processing]: number;
  [ClaimStatus.Approved]: number;
  [ClaimStatus.Denied]: number;
  [ClaimStatus.Paid]: number;
  [ClaimStatus.Closed]: number;
}

export const validateFinancialConsistency = (
  billedAmount: number,
  insuranceDiscount: number = 0,
  insurancePaid: number = 0,
  patientResponsibility: number = 0,
): { isValid: boolean; error?: string } => {
  const totalAllocated =
    insuranceDiscount + insurancePaid + patientResponsibility;

  if (totalAllocated > billedAmount) {
    return {
      isValid: false,
      error: `Total allocated amount ($${totalAllocated.toFixed(2)}) cannot exceed billed amount ($${billedAmount.toFixed(2)})`,
    };
  }

  return { isValid: true };
};

export const calculateNetAmount = (
  expense: Pick<
    MedicalExpense,
    "billedAmount" | "insuranceDiscount" | "insurancePaid"
  >,
): number => {
  return (
    expense.billedAmount - expense.insuranceDiscount - expense.insurancePaid
  );
};

export const isFullyPaid = (
  expense: Pick<MedicalExpense, "patientResponsibility" | "paidDate">,
): boolean => {
  return expense.patientResponsibility === 0 || expense.paidDate != null;
};

export const isOutstanding = (
  expense: Pick<MedicalExpense, "patientResponsibility" | "paidDate">,
): boolean => {
  return expense.patientResponsibility > 0 && expense.paidDate == null;
};
