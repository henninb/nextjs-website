import { useQuery } from "@tanstack/react-query";
import Transfer from "../model/Transfer";
//import { basicAuth } from "../Common";

const dataTest: Transfer[] = [
  {
    transferId: 1,
    sourceAccount: "barclays-savings_brian",
    destinationAccount: "wellsfargo-savings_kari",
    transactionDate: new Date("2025-01-04"),
    amount: 3.0,
    guidSource: "00a8a750-cc3d-4c24-9263-c85af59cab64",
    guidDestination: "00a8a750-cc3d-4c24-9263-c85af59cab64",
    activeStatus: true,
  },
  {
    transferId: 2,
    sourceAccount: "barclays-savings_brian",
    destinationAccount: "wellsfargo-savings_kari",
    transactionDate: new Date("2025-01-04"),
    amount: 2.0,
    guidSource: "00a8a750-cc3d-4c24-9263-c85af59cab64",
    guidDestination: "00a8a750-cc3d-4c24-9263-c85af59cab64",
    activeStatus: true,
  },
];

const fetchTransferData = async (): Promise<Transfer[]> => {
  try {
    const response = await fetch("https://finance.lan/api/transfer/select", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        //Authorization: basicAuth(),
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log("Data not found (404)");
        return dataTest;
      }
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    // Uncomment the line below for debugging
    // console.debug(JSON.stringify(data));
    return data;
  } catch (error) {
    console.log("Error fetching transfer data:", error);
    return dataTest;
  }
};

export default function useTransferFetch() {
  const queryResult = useQuery<Transfer[], Error>({
    queryKey: ["transfer"],
    queryFn: fetchTransferData,
  });

  if (queryResult.isError) {
    console.error(
      "Error occurred while fetching transfer data:",
      queryResult.error?.message,
    );
  }

  return queryResult;
}
