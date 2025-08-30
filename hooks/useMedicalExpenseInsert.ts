import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MedicalExpense,
  MedicalExpenseCreateRequest,
} from "../model/MedicalExpense";

export default function useMedicalExpenseInsert() {
  const queryClient = useQueryClient();

  return useMutation<
    MedicalExpense,
    Error,
    { payload: MedicalExpenseCreateRequest }
  >({
    mutationFn: async ({ payload }) => {
      const response = await fetch("/api/medical-expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to create medical expense");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate medical expenses queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ["medicalExpenses"] });
    },
  });
}
