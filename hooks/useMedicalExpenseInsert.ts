import { useQueryClient } from "@tanstack/react-query";
import {
  MedicalExpense,
  MedicalExpenseCreateRequest,
  validateFinancialConsistency,
} from "../model/MedicalExpense";
import { useStandardMutation } from "../utils/queryConfig";
import { fetchWithErrorHandling, parseResponse } from "../utils/fetchUtils";
import { QueryKeys } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useMedicalExpenseInsert");

/**
 * Insert a new medical expense via API
 * Validates financial consistency before sending
 *
 * @param payload - Medical expense data to insert
 * @returns Newly created medical expense
 */
export const insertMedicalExpense = async (
  payload: MedicalExpenseCreateRequest,
): Promise<MedicalExpense> => {
  // Validate financial consistency
  const validation = validateFinancialConsistency(
    payload.billedAmount,
    payload.insuranceDiscount,
    payload.insurancePaid,
    payload.patientResponsibility,
  );

  if (!validation.isValid) {
    log.error("Financial validation failed", { error: validation.error });
    throw new Error(validation.error);
  }

  log.debug("Inserting medical expense", {
    billedAmount: payload.billedAmount,
    serviceDate: payload.serviceDate,
  });

  const endpoint = "/api/medical-expenses";
  const response = await fetchWithErrorHandling(endpoint, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return parseResponse<MedicalExpense>(response) as Promise<MedicalExpense>;
};

/**
 * Hook for inserting a new medical expense
 * Automatically invalidates medical expenses cache on success
 *
 * @returns React Query mutation hook
 *
 * @example
 * ```typescript
 * const { mutate } = useMedicalExpenseInsert();
 * mutate({ payload: newExpense });
 * ```
 */
export default function useMedicalExpenseInsert() {
  const queryClient = useQueryClient();

  return useStandardMutation(
    (variables: { payload: MedicalExpenseCreateRequest }) =>
      insertMedicalExpense(variables.payload),
    {
      mutationKey: ["insertMedicalExpense"],
      onSuccess: (newExpense) => {
        log.debug("Medical expense inserted successfully", {
          medicalExpenseId: newExpense.medicalExpenseId,
        });

        // Invalidate medical expenses queries to refresh the list
        queryClient.invalidateQueries({ queryKey: QueryKeys.medicalExpense() });
      },
      onError: (error) => {
        log.error("Insert failed", error);
      },
    },
  );
}
