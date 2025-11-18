import { useQueryClient } from "@tanstack/react-query";
import Payment from "../model/Payment";
import Transaction from "../model/Transaction";
import { DataValidator } from "../utils/validation";
import { useStandardMutation } from "../utils/queryConfig";
import { fetchWithErrorHandling, parseResponse } from "../utils/fetchUtils";
import { HookValidator } from "../utils/hookValidation";
import { InputSanitizer } from "../utils/validation/sanitization";
import { CacheUpdateStrategies, QueryKeys } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("usePaymentUpdate");

/**
 * Update an existing payment via API
 * Validates and sanitizes input before sending
 *
 * @param oldPayment - Original payment data (for identifier)
 * @param newPayment - Updated payment data
 * @returns Updated payment
 */
export const updatePayment = async (
  oldPayment: Payment,
  newPayment: Payment,
): Promise<Payment> => {
  console.log("[usePaymentUpdate] updatePayment OLD:", JSON.stringify(oldPayment));
  console.log("[usePaymentUpdate] updatePayment NEW:", JSON.stringify(newPayment));

  // Validate new payment data
  const validatedData = HookValidator.validateUpdate(
    newPayment,
    oldPayment,
    DataValidator.validatePayment,
    "updatePayment",
  );

  console.log("[usePaymentUpdate] VALIDATED DATA:", JSON.stringify(validatedData));

  // Validate and sanitize payment ID
  const sanitizedPaymentId = InputSanitizer.sanitizeNumericId(
    oldPayment.paymentId,
    "paymentId",
  );

  log.debug("Updating payment", {
    paymentId: sanitizedPaymentId,
    oldAmount: oldPayment.amount,
    newAmount: validatedData.amount,
  });

  const endpoint = `/api/payment/${sanitizedPaymentId}`;

  console.log("[usePaymentUpdate] FINAL PAYLOAD TO API:", JSON.stringify(validatedData));

  const response = await fetchWithErrorHandling(endpoint, {
    method: "PUT",
    body: JSON.stringify(validatedData),
  });

  return parseResponse<Payment>(response) as Promise<Payment>;
};

/**
 * Hook for updating an existing payment
 * Automatically updates payment cache and cascades to linked transactions
 *
 * @returns React Query mutation hook
 *
 * @example
 * ```typescript
 * const { mutate } = usePaymentUpdate();
 * mutate({ oldPayment, newPayment });
 * ```
 */
export default function usePaymentUpdate() {
  const queryClient = useQueryClient();

  return useStandardMutation(
    ({
      oldPayment,
      newPayment,
    }: {
      oldPayment: Payment;
      newPayment: Payment;
    }) => updatePayment(oldPayment, newPayment),
    {
      mutationKey: ["updatePayment"],
      onSuccess: (updatedPayment: Payment) => {
        log.debug("Payment updated successfully", {
          paymentId: updatedPayment.paymentId,
        });

        // Update payment in cache using paymentId as stable identifier
        CacheUpdateStrategies.updateInList(
          queryClient,
          QueryKeys.payment(),
          updatedPayment,
          "paymentId",
        );

        // Minimal cascade: update linked transactions in source and destination accounts
        try {
          const paymentId = updatedPayment?.paymentId;
          const src = updatedPayment?.sourceAccount;
          const dst = updatedPayment?.destinationAccount;
          const txDate = updatedPayment?.transactionDate;

          const updateLinkedTxns = (
            accountNameOwner: string | undefined,
            sign: 1 | -1,
          ) => {
            if (!accountNameOwner) return;
            const key = ["accounts", accountNameOwner];
            const txns = queryClient.getQueryData<Transaction[]>(key);
            if (!txns || !paymentId) return;

            const updated = txns.map((t) => {
              const linked =
                typeof t.notes === "string" &&
                t.notes.includes(`paymentId:${paymentId}`);
              if (linked) {
                return {
                  ...t,
                  amount: sign * Number(updatedPayment.amount ?? 0),
                  transactionDate: txDate,
                } as Transaction;
              }
              return t;
            });

            queryClient.setQueryData(key, updated);
          };

          // Source: cash outflow (negative). Destination: cash inflow (positive).
          updateLinkedTxns(src, -1);
          updateLinkedTxns(dst, 1);

          log.debug("Payment cascade to transactions completed");
        } catch (e: unknown) {
          const errorMsg = e instanceof Error ? e.message : "Unknown error";
          log.warn("Payment cascade to transactions failed (non-fatal)", {
            error: errorMsg,
          });
        }
      },
      onError: (error) => {
        log.error("Update failed", error);
      },
    },
  );
}
