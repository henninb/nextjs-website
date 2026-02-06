import { useQueryClient } from "@tanstack/react-query";
import Parameter from "../model/Parameter";
import { useStandardMutation } from "../utils/queryConfig";
import { fetchWithErrorHandling, parseResponse } from "../utils/fetchUtils";
import { InputSanitizer } from "../utils/validation/sanitization";
import { CacheUpdateStrategies, QueryKeys } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";
import { useAuth } from "../components/AuthProvider";

const log = createHookLogger("useParameterInsert");

/**
 * Insert a new parameter via API
 * Sanitizes input before sending
 *
 * @param payload - Parameter data to insert
 * @returns Newly created parameter
 */
export const insertParameter = async (
  payload: Parameter,
): Promise<Parameter> => {
  // Sanitize parameter name
  const sanitizedPayload = {
    ...payload,
    parameterName: InputSanitizer.sanitizeParameterName(payload.parameterName),
  };

  log.debug("Inserting parameter", {
    parameterName: sanitizedPayload.parameterName,
  });

  const endpoint = "/api/parameter";
  const response = await fetchWithErrorHandling(endpoint, {
    method: "POST",
    body: JSON.stringify(sanitizedPayload),
  });

  const result = await parseResponse<Parameter>(response);
  // Return payload if 204 No Content, otherwise return parsed response
  return result || payload;
};

/**
 * Hook for inserting a new parameter
 * Automatically updates the parameter list cache on success
 *
 * @returns React Query mutation hook
 *
 * @example
 * ```typescript
 * const { mutate } = useParameterInsert();
 * mutate({ payload: newParameter });
 * ```
 */
export default function useParameterInsert() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useStandardMutation(
    (variables: { payload: Parameter }) => insertParameter({ ...variables.payload, owner: user?.username || "" }),
    {
      mutationKey: ["insertParameter"],
      onSuccess: (newParameter) => {
        if (newParameter) {
          log.debug("Parameter inserted successfully", {
            parameterName: newParameter.parameterName,
          });

          CacheUpdateStrategies.addToList(
            queryClient,
            QueryKeys.parameter(),
            newParameter,
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
