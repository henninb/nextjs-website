import { useQueryClient } from "@tanstack/react-query";
import {
  MedicalExpense,
  MedicalExpenseUpdateRequest,
  validateFinancialConsistency,
} from "../model/MedicalExpense";
import { useStandardMutation } from "../utils/queryConfig";
import { fetchWithErrorHandling, parseResponse } from "../utils/fetchUtils";
import { InputSanitizer } from "../utils/validation/sanitization";
import { QueryKeys } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useMedicalExpenseUpdate");

/**
 * Update an existing medical expense via API
 * Validates financial consistency and sanitizes ID before sending
 *
 * @param newRow - Updated medical expense data
 * @param oldRow - Original medical expense data (for identifier)
 * @returns Updated medical expense
 */
export const updateMedicalExpense = async (
  newRow: MedicalExpense,
  oldRow: MedicalExpense,
): Promise<MedicalExpense> => {
  // Validate financial consistency
  const validation = validateFinancialConsistency(
    newRow.billedAmount,
    newRow.insuranceDiscount,
    newRow.insurancePaid,
    newRow.patientResponsibility,
  );

  if (!validation.isValid) {
    log.error("Financial validation failed", { error: validation.error });
    throw new Error(validation.error);
  }

  // Sanitize medical expense ID
  const sanitizedId = InputSanitizer.sanitizeNumericId(
    newRow.medicalExpenseId,
    "medicalExpenseId",
  );

  log.debug("Updating medical expense", {
    medicalExpenseId: sanitizedId,
    oldBilledAmount: oldRow.billedAmount,
    newBilledAmount: newRow.billedAmount,
  });

  const updateRequest: MedicalExpenseUpdateRequest = {
    medicalExpenseId: newRow.medicalExpenseId,
    transactionId: newRow.transactionId,
    providerId: newRow.providerId,
    familyMemberId: newRow.familyMemberId,
    serviceDate: newRow.serviceDate,
    serviceDescription: newRow.serviceDescription,
    procedureCode: newRow.procedureCode,
    diagnosisCode: newRow.diagnosisCode,
    billedAmount: newRow.billedAmount,
    insuranceDiscount: newRow.insuranceDiscount,
    insurancePaid: newRow.insurancePaid,
    patientResponsibility: newRow.patientResponsibility,
    paidDate: newRow.paidDate,
    isOutOfNetwork: newRow.isOutOfNetwork,
    claimNumber: newRow.claimNumber,
    claimStatus: newRow.claimStatus,
  };

  const endpoint = `/api/medical-expenses/${sanitizedId}`;
  const response = await fetchWithErrorHandling(endpoint, {
    method: "PUT",
    body: JSON.stringify(updateRequest),
  });

  return parseResponse<MedicalExpense>(response) as Promise<MedicalExpense>;
};

/**
 * Hook for updating an existing medical expense
 * Automatically invalidates medical expenses cache on success
 *
 * @returns React Query mutation hook
 *
 * @example
 * ```typescript
 * const { mutate } = useMedicalExpenseUpdate();
 * mutate({ oldRow: originalExpense, newRow: updatedExpense });
 * ```
 */
export default function useMedicalExpenseUpdate() {
  const queryClient = useQueryClient();

  return useStandardMutation(
    (variables: { newRow: MedicalExpense; oldRow: MedicalExpense }) =>
      updateMedicalExpense(variables.newRow, variables.oldRow),
    {
      mutationKey: ["updateMedicalExpense"],
      onSuccess: (updatedExpense) => {
        log.debug("Medical expense updated successfully", {
          medicalExpenseId: updatedExpense.medicalExpenseId,
        });

        // Invalidate medical expenses queries to refresh the list
        queryClient.invalidateQueries({ queryKey: QueryKeys.medicalExpense() });
      },
      onError: (error) => {
        log.error("Update failed", error);
      },
    },
  );
}
