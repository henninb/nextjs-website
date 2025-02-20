import { useMutation, useQueryClient } from "@tanstack/react-query";
import Parameter from "../model/Parameter";
//import { basicAuth } from "../Common";

// const insertParameter = async (payload: Parameter): Promise<Parameter> => {
//   try {
//     const response = await fetch("https://finance.lan/api/parameter/insert", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(payload),
//     });

//     if (!response.ok) {
//       try {
//         const contentType = response.headers.get("content-type");
//         console.log(contentType);
//         const errorBody = await response.json();
//         console.log("errorBody: " + JSON.stringify(errorBody));
//         console.log(contentType);
//         throw new Error(`${errorBody.response}`);
//       } catch {
//         throw new Error("Failed to parse error response");
//       }
//     }

//     // if (!response.ok) {
//     //   try {
//     //     const rawText = await response.text(); // Get raw response
//     //     console.log("Raw Response:", rawText);

//     //     const errorBody = JSON.parse(rawText); // Try to parse manually
//     //     console.log("Parsed Error Body:", errorBody);

//     //     throw new Error(errorBody.response || "Unknown error occurred");
//     //   } catch (err) {
//     //     console.error("Parsing error:", err);
//     //     throw new Error("Failed to parse error response");
//     //   }
//     // }

//     return await response.json();
//   } catch (error) {
//     console.error("Error in insertParameter:", error.message);
//     throw error;
//   }
// };

const insertParameter = async (payload: Parameter): Promise<Parameter> => {
  try {
    const endpoint = "https://finance.lan/api/parameter/insert";

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
          console.log("No error message returned.")
          throw new Error("No error message returned.")
        }
      } catch (error) {
        console.log(`Failed to parse error response: ${error.message}`);
        throw new Error(`Failed to parse error response: ${error.message}`);
      }

      console.log(errorMessage || "cannot throw a null value");
      throw new Error(errorMessage || "cannot throw a null value");
    }

    return response.status !== 204 ? await response.json() : null;
  } catch (error) {
    console.error(`An error occurred: ${error.message}`);
    throw error;
  }
};

export default function useParameterInsert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["insertParameter"],
    mutationFn: (variables: { payload: Parameter }) =>
      insertParameter(variables.payload),
    onError: (error) => {
      console.log(error ? error : "error is undefined.");
    },
    onSuccess: (newParameter) => {
      const oldData: any = queryClient.getQueryData(["parameter"]) || [];
      queryClient.setQueryData(["parameter"], [newParameter, ...oldData]);
    },
  });
}
