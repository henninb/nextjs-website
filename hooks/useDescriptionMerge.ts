import { useMutation } from "@tanstack/react-query";

type MergePayload = {
  sourceNames: string[];
  targetName: string;
};

const mergeDescriptions = async (payload: MergePayload): Promise<any> => {
  try {
    const response = await fetch("/api/description/merge", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      try {
        const body = await response.json();
        if (body && body.response) {
          throw new Error(body.response);
        }
      } catch (e: any) {
        // fallthrough: if parsing fails, include status text
      }
      throw new Error(response.statusText || "Failed to merge descriptions");
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

export default function useDescriptionMerge() {
  return useMutation({
    mutationKey: ["descriptionMerge"],
    mutationFn: (payload: MergePayload) => mergeDescriptions(payload),
  });
}
