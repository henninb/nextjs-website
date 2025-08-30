import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MedicalExpense,
  MedicalExpenseUpdateRequest,
} from "../model/MedicalExpense";

export default function useMedicalExpenseUpdate() {
  const queryClient = useQueryClient();

  return useMutation<
    MedicalExpense,
    Error,
    { newRow: MedicalExpense; oldRow: MedicalExpense }
  >({
    mutationFn: async ({ newRow }) => {
      const updateRequest: MedicalExpenseUpdateRequest = {
        medicalExpenseId: newRow.medicalExpenseId,
        transactionId: newRow.transactionId,
        providerId: newRow.providerId,
        familyMemberId: newRow.familyMemberId,
        serviceDate: newRow.serviceDate,
        serviceDescription: newRow.serviceDescription,
        procedureCode: newRow.procedureCode,
        diagnosisCode: newRow.diagnosisCode,
        billedAmount: newRow.billedAmount,
        insuranceDiscount: newRow.insuranceDiscount,
        insurancePaid: newRow.insurancePaid,
        patientResponsibility: newRow.patientResponsibility,
        paidDate: newRow.paidDate,
        isOutOfNetwork: newRow.isOutOfNetwork,
        claimNumber: newRow.claimNumber,
        claimStatus: newRow.claimStatus,
      };

      const response = await fetch(
        `/api/medical-expenses/${newRow.medicalExpenseId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateRequest),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update medical expense");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate medical expenses queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ["medicalExpenses"] });
    },
  });
}
