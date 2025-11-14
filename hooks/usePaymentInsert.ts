import { useQueryClient } from "@tanstack/react-query";
import Payment from "../model/Payment";
import { DataValidator } from "../utils/validation";
import { useStandardMutation } from "../utils/queryConfig";
import { fetchWithErrorHandling, parseResponse } from "../utils/fetchUtils";
import { HookValidator } from "../utils/hookValidation";
import { formatDateForInput } from "../components/Common";
import { CacheUpdateStrategies, QueryKeys } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("usePaymentInsert");

/**
 * Setup new payment payload
 * Note: guidSource and guidDestination must be explicitly null for backend validation
 * The backend will create the transactions and generate these values
 *
 * @param payload - Payment data to setup
 * @returns Formatted payment payload
 */
export const setupNewPayment = async (payload: Payment) => {
  return {
    paymentId: 0,
    amount: payload?.amount,
    transactionDate: formatDateForInput(payload?.transactionDate),
    sourceAccount: payload.sourceAccount,
    destinationAccount: payload.destinationAccount,
    guidSource: null,
    guidDestination: null,
    activeStatus: true,
  };
};

/**
 * Insert a new payment via API
 * Validates input and sanitizes data before sending
 *
 * @param payload - Payment data to insert
 * @returns Newly created payment
 */
export const insertPayment = async (payload: Payment): Promise<Payment> => {
  // Validate payment data
  const validatedData = HookValidator.validateInsert(
    payload,
    DataValidator.validatePayment,
    "insertPayment",
  );

  log.debug("Inserting payment", {
    sourceAccount: validatedData.sourceAccount,
    destinationAccount: validatedData.destinationAccount,
    amount: validatedData.amount,
  });

  const endpoint = "/api/payment";
  const newPayload = await setupNewPayment(validatedData);

  const response = await fetchWithErrorHandling(endpoint, {
    method: "POST",
    body: JSON.stringify(newPayload),
  });

  return parseResponse<Payment>(response) as Promise<Payment>;
};

/**
 * Hook for inserting a new payment
 * Automatically updates the payment list cache on success
 *
 * @returns React Query mutation hook
 *
 * @example
 * ```typescript
 * const { mutate } = usePaymentInsert();
 * mutate({ payload: newPayment });
 * ```
 */
export default function usePaymentInsert() {
  const queryClient = useQueryClient();

  return useStandardMutation(
    (variables: { payload: Payment }) => insertPayment(variables.payload),
    {
      mutationKey: ["insertPayment"],
      onSuccess: (newPayment) => {
        if (newPayment) {
          log.debug("Payment inserted successfully", {
            paymentId: newPayment.paymentId,
          });

          CacheUpdateStrategies.addToList(
            queryClient,
            QueryKeys.payment(),
            newPayment,
            "start",
          );
        }
      },
      onError: (error) => {
        log.error("Insert failed", error);
      },
    },
  );
}
