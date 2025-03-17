import { useMutation, useQueryClient } from "@tanstack/react-query";
import Account from "../model/Account";
import { validateDate } from "@mui/x-date-pickers";
//import { basicAuth } from "../Common";

const setupNewAccount = (payload: Account) => {
  return {
    cleared: 0.0,
    future: 0.0,
    outstanding: 0.0,
    dateClosed: new Date(0),
    dateAdded: new Date(),
    dateUpdated: new Date(),
    activeStatus: true,
    validationDate: new Date(0),
    ...payload,
  };
};

const insertAccount = async (payload: Account): Promise<Account | null> => {
  try {
    const endpoint = "/api/account/insert";
    const newPayload = setupNewAccount(payload);

    console.log(JSON.stringify(newPayload));

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        credentials: "include",
        //Authorization: basicAuth(),
      },
      body: JSON.stringify(newPayload),
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
      } catch (error) {
        console.log(`Failed to parse error response: ${error.message}`);
        throw new Error(`Failed to parse error response: ${error.message}`);
      }

      console.log(errorMessage || "cannot throw a null value");
      throw new Error(errorMessage || "cannot throw a null value");
    }

    return response.status !== 204 ? await response.json() : null;
  } catch (error: any) {
    console.log(`An error occurred: ${error.message}`);
    throw error;
  }
};

export default function useAccountInsert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["insertAccount"],
    mutationFn: (variables: { payload: Account }) =>
      insertAccount(variables.payload),
    onError: (error: Error) => {
      console.log(error ? error : "Error is undefined.");
    },
    onSuccess: (response: Account) => {
      const oldData: Account[] | undefined = queryClient.getQueryData([
        "account",
      ]);
      const newData = oldData ? [response, ...oldData] : [response];
      queryClient.setQueryData(["account"], newData);
    },
  });
}
