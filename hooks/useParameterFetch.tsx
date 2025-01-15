import { useQuery } from "react-query";
//import { basicAuth } from "../Common";

const fetchParameterData = async (): Promise<any> => {
  try {
    const response = await fetch("/api/parm/select/active", {
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
        return [{
          parameterId: Math.random(),
          parameterName: "payment_account", 
          parameterValue: "wfargo_brian"
        }];
      }
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    // Uncomment the line below for debugging
    // console.debug(JSON.stringify(data));
    return data;
  } catch (error) {
    console.log("Error fetching parameters data:", error);
    return [{
      parameterId: Math.random(),
      parameterName: "payment_account", 
      parameterValue: "wfargo_brian"
    }];
  }
};

export default function useParameterFetch() {
  return useQuery("parameter", () => fetchParameterData(), {
    onError: (error: any) => {
      console.log(error ? error : "error is undefined.");
    },
  });
}