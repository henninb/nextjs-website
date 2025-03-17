import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../components/AuthProvider";
import { useRouter } from "next/router";

interface LoginPayload {
  email: string;
  password: string;
}

// ** unused **

export default function useLogin() {
  const { login } = useAuth();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string>("");

  const loginMutation = useMutation({
    mutationFn: async (payload: LoginPayload): Promise<void> => {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include", // ensures cookies are handled automatically
      });

      // Check for 204 (No Content) which indicates a successful login.
      if (response.status === 204) {
        return;
      } else {
        const errorBody = await response.json();
        throw new Error(errorBody.error || "Login failed");
      }
    },
    onSuccess: () => {
      // Update your global auth state via the AuthProvider.
      login();
      // Redirect the user after a successful login.
      router.push("/");
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || "Failed login. Please try again.");
    },
  });

  return { loginMutation, errorMessage };
}
