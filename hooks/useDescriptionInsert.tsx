import { useMutation, useQueryClient } from 'react-query';
import Description from "../model/Description";
//import { basicAuth } from "../Common";

const insertDescription = async (descriptionName: string): Promise<Description> => {
  try {
    const endpoint = "/api/description/insert";
    const payload = { description: descriptionName, activeStatus: true };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        //Authorization: basicAuth(),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.error("Resource not found (404).");
        return {
          descriptionId: Math.random(),
          descriptionName: descriptionName,
          activeStatus: true,
          dateAdded: new Date(),
          dateUpdated: new Date(),
        };
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("Error occurred:", error);
    throw error;
  }
};

export default function useDescriptionInsert() {
  const queryClient = useQueryClient();

  return useMutation(
    ["insertDescription"],
    (variables: any) => insertDescription(variables.descriptionName),
    {
      onError: (error: any) => {
        console.log(error ? error : "error is undefined.");
      },

      onSuccess: (response) => {
        const oldData: any = queryClient.getQueryData("description");
        const newData = [response, ...(oldData || [])];
        queryClient.setQueryData("description", newData);
      },
    },
  );
}