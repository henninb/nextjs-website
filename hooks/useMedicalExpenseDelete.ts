import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MedicalExpense } from "../model/MedicalExpense";

export default function useMedicalExpenseDelete() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { oldRow: MedicalExpense }>({
    mutationFn: async ({ oldRow }) => {
      const response = await fetch(
        `/api/medical-expenses/${oldRow.medicalExpenseId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete medical expense");
      }
    },
    onSuccess: () => {
      // Invalidate medical expenses queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ["medicalExpenses"] });
    },
  });
}
