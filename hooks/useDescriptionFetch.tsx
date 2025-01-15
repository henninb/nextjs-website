import { useQuery } from "react-query";
//import { basicAuth } from "../Common";

const fetchDescriptionData = async (): Promise<any> => {
  try {
    const response = await fetch("/api/description/select/active", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        //Authorization: basicAuth(),
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log("Resource not found (404).");
        return [
          {
            descriptionId: Math.random(),
            descriptionName: 'test1',
            activeStatus: true
          },
          {
            descriptionId: Math.random(),
            descriptionName: 'test2',
            activeStatus: true
          }
        ];
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.log("Error fetching description data:", error);
    return [
      {
        descriptionId: Math.random(),
        descriptionName: 'test1',
        activeStatus: true
      },
      {
        descriptionId: Math.random(),
        descriptionName: 'test2',
        activeStatus: true
      }
    ];
  }
};

export default function useDescriptionFetch() {
  return useQuery("description", () => fetchDescriptionData(), {
    onError: (error: any) => {
      console.log(error ? error : "error is undefined.");
    },
  });
}