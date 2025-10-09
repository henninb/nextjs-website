import { useQuery } from "@tanstack/react-query";
import { MedicalExpense } from "../model/MedicalExpense";

export default function useMedicalExpenseFetch() {
  return useQuery<MedicalExpense[]>({
    queryKey: ["medicalExpenses"],
    queryFn: async () => {
      const response = await fetch("/api/medical-expenses/active");

      if (!response.ok) {
        throw new Error("Failed to fetch medical expenses");
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}
