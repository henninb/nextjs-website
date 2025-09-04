import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../components/AuthProvider";
import { useRouter } from "next/router";
import User from "../model/User";
import {
  DataValidator,
  hookValidators,
  InputSanitizer,
} from "../utils/validation";

export const processLogin = async (payload: User): Promise<void> => {
  // Validate and sanitize login credentials
  const validation = hookValidators.validateApiPayload(
    payload,
    DataValidator.validateUser,
    "login",
  );

  if (!validation.isValid) {
    const errorMessages =
      validation.errors?.map((err) => err.message).join(", ") ||
      "Validation failed";
    throw new Error(`Login validation failed: ${errorMessages}`);
  }

  // Don't log credentials - security improvement
  console.log(
    "Login attempt for user:",
    InputSanitizer.sanitizeUsername(payload.username),
  );

  const response = await fetch("/api/login", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(validation.validatedData),
  });

  // Check for 204 (No Content) which indicates a successful login.
  if (response.status === 204) {
    return;
  } else {
    const errorBody = await response.json();
    throw new Error(errorBody.error || "Login failed");
  }
};

export default function useLogin() {
  const { login } = useAuth();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string>("");

  const loginMutation = useMutation({
    mutationFn: (payload: User): Promise<void> => processLogin(payload),
    onSuccess: (response, variables: any) => {
      // Update your global auth state via the AuthProvider.
      login(variables);
      // Redirect the user after a successful login.
      router.push("/");
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || "Failed login. Please try again.");
    },
  });

  return { loginMutation, errorMessage };
}
