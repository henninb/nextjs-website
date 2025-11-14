import { useQueryClient } from "@tanstack/react-query";
import User from "../model/User";
import { useStandardMutation } from "../utils/queryConfig";
import { fetchWithErrorHandling } from "../utils/fetchUtils";
import { HookValidator } from "../utils/hookValidation";
import { DataValidator } from "../utils/validation";
import { QueryKeys } from "../utils/cacheUtils";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useUserAccountRegister");

/**
 * Register a new user account via API
 * Validates user data before sending
 *
 * @param payload - User registration data
 * @returns Registered user data or null
 */
export const userAccountRegister = async (
  payload: User,
): Promise<User | null> => {
  // Validate user registration data
  const validatedData = HookValidator.validateInsert(
    payload,
    DataValidator.validateUser,
    "userAccountRegister",
  );

  log.debug("Registering user account", {
    username: validatedData.username,
  });

  const endpoint = "/api/user/register";
  const response = await fetchWithErrorHandling(endpoint, {
    method: "POST",
    body: JSON.stringify(validatedData),
  });

  // 201 Created expected for successful registration
  if (response.status === 201) {
    log.debug("User registered successfully", {
      username: validatedData.username,
    });
    return null; // Registration successful, no data returned
  }

  return payload;
};

/**
 * Hook for registering a new user account
 * Automatically updates user cache on success
 *
 * @returns React Query mutation hook
 *
 * @example
 * ```typescript
 * const { mutate } = useUserAccountRegister();
 * mutate({ payload: newUser });
 * ```
 */
export default function useUserAccountRegister() {
  const queryClient = useQueryClient();

  return useStandardMutation(
    (variables: { payload: User }) => userAccountRegister(variables.payload),
    {
      mutationKey: ["registerUserAccount"],
      onSuccess: (response, variables) => {
        log.debug("Registration mutation successful", {
          username: variables.payload.username,
        });

        // Update user cache if needed
        queryClient.setQueryData(QueryKeys.user(), response);
      },
      onError: (error) => {
        log.error("Registration failed", error);
      },
    },
  );
}
