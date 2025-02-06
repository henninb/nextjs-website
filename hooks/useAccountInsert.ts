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

const insertAccount = async (payload: Account): Promise<Account> => {
  try {
    const endpoint = "https://finance.lan/api/account/insert";
    const newPayload = setupNewAccount(payload);

    console.log(JSON.stringify(newPayload));

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        //Authorization: basicAuth(),
      },
      body: JSON.stringify(newPayload),
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log("Resource not found (404).", await response.json());
      }
      const errorDetails = await response.json();
      throw new Error(
        `HTTP error! Status: ${response.status} Details: ${JSON.stringify(errorDetails)}`,
      );
    }

    return await response.json();
  } catch (error: any) {
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
      console.error(error ? error : "Error is undefined.");
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
