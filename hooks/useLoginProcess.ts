import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../components/AuthProvider";
import { useRouter } from "next/navigation";
import User from "../model/User";
import { fetchWithErrorHandling } from "../utils/fetchUtils";
import { HookValidator } from "../utils/hookValidation";
import { DataValidator } from "../utils/validation";
import { InputSanitizer } from "../utils/validation/sanitization";
import { createHookLogger } from "../utils/logger";

const log = createHookLogger("useLoginProcess");

/**
 * Process user login via API
 * Validates credentials before sending
 * Returns void on success (204 No Content expected)
 *
 * @param payload - User login credentials
 * @returns void on successful login
 */
export const processLogin = async (payload: User): Promise<void> => {
  // Validate login credentials (without full insert validation)
  const validatedData = HookValidator.validateInsert(
    payload,
    DataValidator.validateUser,
    "login",
  );

  const sanitizedUsername = InputSanitizer.sanitizeUsername(
    validatedData.username,
  );

  log.debug("Processing login", { username: sanitizedUsername });

  const response = await fetchWithErrorHandling("/api/login", {
    method: "POST",
    body: JSON.stringify(validatedData),
  });

  // 204 No Content indicates successful login
  if (response.status === 204) {
    log.debug("Login successful", { username: sanitizedUsername });
    return;
  }

  // Any other status should have been caught by fetchWithErrorHandling
  const errorBody = await response.json().catch(() => ({}));
  log.error("Login failed with unexpected status", {
    status: response.status,
    errorBody,
  });
  throw new Error(errorBody.error || "Login failed");
};

/**
 * Hook for user login process
 * Integrates with AuthProvider and handles routing
 * Maintains error state for UI display
 *
 * @returns Login mutation and error message
 *
 * @example
 * ```typescript
 * const { loginMutation, errorMessage } = useLoginProcess();
 * loginMutation.mutate(credentials);
 * ```
 */
export default function useLoginProcess() {
  const { login } = useAuth();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string>("");

  const loginMutation = useMutation({
    mutationKey: ["login"],
    mutationFn: (payload: User): Promise<void> => processLogin(payload),
    onSuccess: (_response, variables) => {
      log.debug("Login mutation successful", {
        username: variables.username,
      });

      // Update global auth state via AuthProvider
      login(variables);

      // Redirect user after successful login
      router.push("/");
    },
    onError: (error: Error) => {
      const message = error.message || "Failed login. Please try again.";
      log.error("Login mutation failed", { error: message });
      setErrorMessage(message);
    },
  });

  return { loginMutation, errorMessage };
}
