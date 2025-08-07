import { useMutation, useQueryClient } from "@tanstack/react-query";
import User from "../model/User";
import {
  DataValidator,
  hookValidators,
  ValidationError,
} from "../utils/validation";

const userAccountRegister = async (payload: User): Promise<User | null> => {
  try {
    // Validate and sanitize the user registration data
    const validation = hookValidators.validateApiPayload(
      payload,
      DataValidator.validateUser,
      "userAccountRegister",
    );

    if (!validation.isValid) {
      const errorMessages =
        validation.errors?.map((err) => err.message).join(", ") ||
        "Validation failed";
      throw new Error(`User registration validation failed: ${errorMessages}`);
    }

    const endpoint = "/api/user/register";

    // Remove sensitive logging - security improvement
    console.log(
      "User registration attempt for username:",
      validation.validatedData.username,
    );

    const response = await fetch(endpoint, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validation.validatedData),
    });

    if (!response.ok) {
      let errorMessage = "";

      try {
        const errorBody = await response.json();
        if (errorBody && errorBody.response) {
          errorMessage = `${errorBody.response}`;
        } else {
          console.log("No error message returned.");
          throw new Error("No error message returned.");
        }
      } catch (error: any) {
        console.log(`Failed to parse error response: ${error.message}`);
        throw new Error(`Failed to parse error response: ${error.message}`);
      }

      throw new Error(errorMessage || "Registration failed");
    }

    return response.status !== 201 ? payload : null;
  } catch (error: any) {
    console.log(`An error occurred: ${error.message}`);
    throw error;
  }
};

export default function useUserAccountRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["registerUserAccount"],
    mutationFn: (variables: { payload: User }) =>
      userAccountRegister(variables.payload),
    onError: (error: Error) => {
      console.log(error ? error : "Error is undefined.");
    },
    onSuccess: (response: User) => {
      // Optionally update a cache key for user accounts if needed.
      // Here, we assume there might be a cached list of user accounts under the "userAccount" key.
      const oldData: User | undefined = queryClient.getQueryData([
        "userAccount",
      ]);

      queryClient.setQueryData(["userAccount"], response);
    },
  });
}
