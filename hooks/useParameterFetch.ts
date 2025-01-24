import { useQuery } from "@tanstack/react-query";
import Parameter from "../model/Parameter";
//import { basicAuth } from "../Common";

const fetchParameterData = async (): Promise<Parameter[]> => {
  try {
    const response = await fetch("https://finance.lan/api/parm/select/active", {
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
      }
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    // Uncomment the line below for debugging
    // console.debug(JSON.stringify(data));
    return data;
  } catch (error) {
    console.log("Error fetching parameters data:", error);
    return [
      {
        parameterId: Math.random(),
        parameterName: "payment_account",
        parameterValue: "wfargo-savings_brian",
        activeStatus: true,
      },
    ];
  }
};

export default function useParameterFetch() {
  const queryResult = useQuery<Parameter[], Error>({
    queryKey: ["parameter"], // Make the key an array to support caching and refetching better
    queryFn: fetchParameterData,
  });

  if (queryResult.isError) {
    console.error(
      "Error occurred while fetching parameter data:",
      queryResult.error?.message,
    );
  }

  return queryResult;
}

// export default function useParameterFetch() {
//   return useQuery("parameter", () => fetchParameterData(), {
//     onError: (error: any) => {
//       console.log(error ? error : "error is undefined.");
//     },
//   });
// }
