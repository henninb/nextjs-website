//import { basicAuth } from "../Common";
import { useMutation, useQueryClient } from "react-query";
import Account from "../model/Account";

const setupNewAccount = (payload: Account) => {
  return {
    accountNameOwner: payload.accountNameOwner,
    accountType: payload.accountType,
    moniker: payload.moniker,
    cleared: 0.0,
    future: 0.0,
    outstanding: 0.0,
    dateClosed: new Date(0),
    dateAdded: new Date(),
    dateUpdated: new Date(),
    activeStatus: true,
  };
};

const insertAccount = async (payload: Account): Promise<any> => {
  try {
    const endpoint = "/api/account/insert";
    const newPayload = setupNewAccount(payload);

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
        //console.error("Resource not found (404).", await response.json());
        // console.log(payload.accountNameOwner)
        // React to 404 specifically
        return {
          accountId: Math.random(),
          accountNameOwner: payload.accountNameOwner,
          accountType: payload.accountType,
          moniker: payload.moniker,
          cleared: 0.0,
          future: 0.0,
          outstanding: 0.0,
          dateClosed: new Date(0),
          dateAdded: new Date(),
          dateUpdated: new Date(),
          activeStatus: true,
        };
      }
      const errorDetails = await response.json();
      throw new Error(`HTTP error! Status: ${response.status} Details: ${JSON.stringify(errorDetails)}`);
    }

    return await response.json();
  } catch (error: any) {
    console.log( {
      accountId: Math.random(),
      accountNameOwner: payload.accountNameOwner,
      accountType: payload.accountType,
      moniker: payload.moniker,
      cleared: 0.0,
      future: 0.0,
      outstanding: 0.0,
      dateClosed: new Date(0),
      dateAdded: new Date(),
      dateUpdated: new Date(),
      activeStatus: true,
    });
    return {
      accountId: Math.random(),
      accountNameOwner: payload.accountNameOwner,
      accountType: payload.accountType,
      moniker: payload.moniker,
      cleared: 0.0,
      future: 0.0,
      outstanding: 0.0,
      dateClosed: new Date(0),
      dateAdded: new Date(),
      dateUpdated: new Date(),
      activeStatus: true,
    }
    //return { error: "An error occurred", details: error.message };
  }
};

export default function useAccountInsert() {
  const queryClient = useQueryClient();

  return useMutation(
    ["insertAccount"],
    (variables: any) => insertAccount(variables.payload),
    {
      onError: (error: any) => {
        console.log(error ? error : "error is undefined.");
      },
      onSuccess: (response) => {
        const oldData: any = queryClient.getQueryData("account");
        const newData = [response, ...oldData];
        queryClient.setQueryData("account", newData);
      },
    },
  );
}