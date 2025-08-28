import { useMutation } from "@tanstack/react-query";

type MergePayload = {
  sourceNames: string[];
  targetName: string;
};

const mergeCategories = async (payload: MergePayload): Promise<any> => {
  const response = await fetch("/api/category/merge", {
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
    } catch (_) {
      // ignore JSON parse error and fall through
    }
    throw new Error(response.statusText || "Failed to merge categories");
  }

  return await response.json();
};

export default function useCategoryMerge() {
  return useMutation({
    mutationKey: ["categoryMerge"],
    mutationFn: (payload: MergePayload) => mergeCategories(payload),
  });
}
