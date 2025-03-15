import { useMutation, useQueryClient } from "@tanstack/react-query";
import User from "../model/User";

// rename this hook

const registerNewUser = async (payload: User): Promise<User | null> => {
  try {
    const endpoint = "https://finance.lan/api/user/register";

    console.log("Register payload:", JSON.stringify(payload));

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
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

    return response.status !== 204 ? await response.json() : null;
  } catch (error: any) {
    console.log(`An error occurred: ${error.message}`);
    throw error;
  }
};

export default function useUserRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["registerUserAccount"],
    mutationFn: (variables: { payload: User }) =>
      registerNewUser(variables.payload),
    onError: (error: Error) => {
      console.log(error ? error : "Error is undefined.");
    },
    onSuccess: (response: User) => {
      // Optionally update a cache key for user accounts if needed.
      // Here, we assume there might be a cached list of user accounts under the "userAccount" key.
      const oldData: User[] | undefined = queryClient.getQueryData([
        "userAccount",
      ]);
      const newData = oldData ? [response, ...oldData] : [response];
      queryClient.setQueryData(["userAccount"], newData);
    },
  });
}
