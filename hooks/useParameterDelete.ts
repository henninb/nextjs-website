import { useQueryClient } from "@tanstack/react-query";
import Parameter from "../model/Parameter";
import { useStandardMutation } from "../utils/queryConfig";
import { fetchWithErrorHandling, parseResponse } from "../utils/fetchUtils";
import { HookValidator } from "../utils/hookValidation";
import { InputSanitizer } from "../utils/validation/sanitization";
import { CacheUpdateStrategies, QueryKeys } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useParameterDelete");

/**
 * Delete a parameter via API
 * Validates identifier and sanitizes before sending
 *
 * @param payload - Parameter to delete
 * @returns Deleted parameter or null
 */
export const deleteParameter = async (
  payload: Parameter,
): Promise<Parameter | null> => {
  // Validate that parameter name exists
  HookValidator.validateDelete(payload, "parameterName", "deleteParameter");

  // Sanitize parameter name for URL
  const sanitizedParameterName = InputSanitizer.sanitizeParameterName(
    payload.parameterName,
  );

  log.debug("Deleting parameter", { parameterName: sanitizedParameterName });

  const endpoint = `/api/parameter/${sanitizedParameterName}`;
  const response = await fetchWithErrorHandling(endpoint, {
    method: "DELETE",
  });

  return parseResponse<Parameter>(response);
};

/**
 * Hook for deleting a parameter
 * Automatically removes parameter from the cache on success
 *
 * @returns React Query mutation hook
 *
 * @example
 * ```typescript
 * const { mutate } = useParameterDelete();
 * mutate(parameterToDelete);
 * ```
 */
export default function useParameterDelete() {
  const queryClient = useQueryClient();

  return useStandardMutation(
    (variables: Parameter) => deleteParameter(variables),
    {
      mutationKey: ["deleteParameter"],
      onSuccess: (response, variables) => {
        log.debug("Parameter deleted successfully", {
          parameterName: variables.parameterName,
        });

        // Remove from cache using parameterName as identifier
        CacheUpdateStrategies.removeFromList(
          queryClient,
          QueryKeys.parameter(),
          variables,
          "parameterName",
        );
      },
      onError: (error) => {
        log.error("Delete failed", error);
      },
    },
  );
}
