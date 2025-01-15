//import { basicAuth } from "../Common";
import { useQuery } from "react-query";

const dataTest = [
  {
    "transactionId": 10544,
    "guid": "299b36b1-a49f-43bc-aaa5-ba78352f716a",
    "accountId": 1029,
    "accountType": "credit",
    "transactionType": "undefined",
    "accountNameOwner": "barclay-cash_brian",
    "transactionDate": "2017-09-17",
    "description": "balance adjustment",
    "category": "none",
    "amount": 1.99,
    "transactionState": "outstanding",
    "activeStatus": true,
    "reoccurringType": "onetime"
  },
  {
    "transactionId": 10543,
    "guid": "55dd8ccb-b51c-4c93-907e-95ed1d20705f",
    "accountId": 1029,
    "accountType": "credit",
    "transactionType": "expense",
    "accountNameOwner": "barclay-cash_brian",
    "transactionDate": "2017-08-18",
    "description": "amazon.com",
    "category": "online",
    "amount": 0.99,
    "transactionState": "cleared",
    "activeStatus": true,
    "reoccurringType": "onetime",
    "notes": "egiftcard"
  },
  {
    "transactionId": 10542,
    "guid": "499cee31-ec4c-4f8a-b5b5-35ea9c9df9f4",
    "accountId": 1029,
    "accountType": "credit",
    "transactionType": "undefined",
    "accountNameOwner": "barclay-cash_brian",
    "transactionDate": "2017-08-17",
    "description": "balance adjustment",
    "category": "none",
    "amount": -0.99,
    "transactionState": "cleared",
    "activeStatus": true,
    "reoccurringType": "onetime"
  },
  {
    "transactionId": 10541,
    "guid": "6128e4be-932d-4da3-af3b-3c25e76a9de9",
    "accountId": 1029,
    "accountType": "credit",
    "transactionType": "expense",
    "accountNameOwner": "barclay-cash_brian",
    "transactionDate": "2017-07-18",
    "description": "amazon.com",
    "category": "online",
    "amount": 0.99,
    "transactionState": "cleared",
    "activeStatus": true,
    "reoccurringType": "onetime"
  },
  {
    "transactionId": 10540,
    "guid": "798e8a7f-f615-46b1-aeba-b0b8f74e5d10",
    "accountId": 1029,
    "accountType": "credit",
    "transactionType": "undefined",
    "accountNameOwner": "barclay-cash_brian",
    "transactionDate": "2017-07-17",
    "description": "balance adjustment",
    "category": "none",
    "amount": -0.99,
    "transactionState": "cleared",
    "activeStatus": true,
    "reoccurringType": "onetime"
  }
];

const fetchAccountData = async (accountNameOwner: string): Promise<any> => {
  try {
    const response = await fetch(
      `/api/transaction/account/select/${accountNameOwner}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          //Authorization: basicAuth(),
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.error("Account not found");
        return dataTest; // Default fallback data for 404
      }
      throw new Error(`Failed to fetch transactionsByAccount data: ${response.statusText}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error("Error fetching transactionsByAccount data:", error);
    return dataTest; // Default fallback data on error
  }
};

export default function useTransactionByAccountFetch(accountNameOwner: string) {
  return useQuery(
    ["accounts", accountNameOwner],
    () => fetchAccountData(accountNameOwner),
    {
      onError: (error: Error) => {
        console.log(error ? error.message : "Error is undefined.");
      },
    }
  );
}
