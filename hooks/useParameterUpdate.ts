import { useQueryClient } from "@tanstack/react-query";
import Parameter from "../model/Parameter";
import { useStandardMutation } from "../utils/queryConfig";
import { fetchWithErrorHandling, parseResponse } from "../utils/fetchUtils";
import { InputSanitizer } from "../utils/validation/sanitization";
import { CacheUpdateStrategies, QueryKeys } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useParameterUpdate");

/**
 * Update an existing parameter via API
 * Sanitizes input before sending
 *
 * @param oldParameter - Original parameter data (for identifier)
 * @param newParameter - Updated parameter data
 * @returns Updated parameter
 */
export const updateParameter = async (
  oldParameter: Parameter,
  newParameter: Parameter,
): Promise<Parameter> => {
  // Sanitize parameter names for URL and payload
  const sanitizedOldName = InputSanitizer.sanitizeParameterName(
    oldParameter.parameterName,
  );
  const sanitizedNewParameter = {
    ...newParameter,
    parameterName: InputSanitizer.sanitizeParameterName(
      newParameter.parameterName,
    ),
  };

  log.debug("Updating parameter", {
    oldName: sanitizedOldName,
    newName: sanitizedNewParameter.parameterName,
  });

  const endpoint = `/api/parameter/${sanitizedOldName}`;
  const response = await fetchWithErrorHandling(endpoint, {
    method: "PUT",
    body: JSON.stringify(sanitizedNewParameter),
  });

  return parseResponse<Parameter>(response) as Promise<Parameter>;
};

/**
 * Hook for updating an existing parameter
 * Automatically updates the parameter list cache on success
 *
 * @returns React Query mutation hook
 *
 * @example
 * ```typescript
 * const { mutate } = useParameterUpdate();
 * mutate({ oldParameter, newParameter });
 * ```
 */
export default function useParameterUpdate() {
  const queryClient = useQueryClient();

  return useStandardMutation(
    ({
      oldParameter,
      newParameter,
    }: {
      oldParameter: Parameter;
      newParameter: Parameter;
    }) => updateParameter(oldParameter, newParameter),
    {
      mutationKey: ["updateParameter"],
      onSuccess: (updatedParameter: Parameter) => {
        log.debug("Parameter updated successfully", {
          parameterName: updatedParameter.parameterName,
        });

        // Use parameterId as stable identifier for cache updates
        CacheUpdateStrategies.updateInList(
          queryClient,
          QueryKeys.parameter(),
          updatedParameter,
          "parameterId",
        );
      },
      onError: (error) => {
        log.error("Update failed", error);
      },
    },
  );
}
