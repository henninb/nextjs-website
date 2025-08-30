import {
  MedicalExpense,
  ClaimStatus,
  MedicalExpenseCreateRequest,
  validateFinancialConsistency,
  calculateNetAmount,
  isFullyPaid,
  isOutstanding,
} from "../../model/MedicalExpense";

describe("MedicalExpense Model", () => {
  const mockMedicalExpense: MedicalExpense = {
    medicalExpenseId: 1,
    transactionId: 100,
    providerId: 1,
    familyMemberId: 1,
    serviceDate: new Date("2024-01-15"),
    serviceDescription: "Annual physical exam",
    procedureCode: "99213",
    diagnosisCode: "Z00.00",
    billedAmount: 250.0,
    insuranceDiscount: 50.0,
    insurancePaid: 150.0,
    patientResponsibility: 50.0,
    paidDate: null,
    isOutOfNetwork: false,
    claimNumber: "CL123456",
    claimStatus: ClaimStatus.Approved,
    activeStatus: true,
    dateAdded: new Date("2024-01-15T10:00:00Z"),
    dateUpdated: new Date("2024-01-15T10:00:00Z"),
  };

  describe("MedicalExpense Interface", () => {
    it("should create valid medical expense object with all fields", () => {
      expect(mockMedicalExpense.medicalExpenseId).toBe(1);
      expect(mockMedicalExpense.transactionId).toBe(100);
      expect(mockMedicalExpense.billedAmount).toBe(250.0);
      expect(mockMedicalExpense.claimStatus).toBe(ClaimStatus.Approved);
      expect(mockMedicalExpense.activeStatus).toBe(true);
    });

    it("should create minimal medical expense object with required fields only", () => {
      const minimalExpense: MedicalExpense = {
        medicalExpenseId: 2,
        transactionId: 101,
        serviceDate: new Date("2024-02-01"),
        billedAmount: 100.0,
        insuranceDiscount: 0,
        insurancePaid: 0,
        patientResponsibility: 100.0,
        isOutOfNetwork: false,
        claimStatus: ClaimStatus.Submitted,
        activeStatus: true,
      };

      expect(minimalExpense.medicalExpenseId).toBe(2);
      expect(minimalExpense.transactionId).toBe(101);
      expect(minimalExpense.billedAmount).toBe(100.0);
      expect(minimalExpense.patientResponsibility).toBe(100.0);
    });

    it("should handle optional fields correctly", () => {
      const expenseWithOptionals: MedicalExpense = {
        ...mockMedicalExpense,
        providerId: undefined,
        familyMemberId: undefined,
        serviceDescription: undefined,
        procedureCode: undefined,
        diagnosisCode: undefined,
        paidDate: undefined,
        claimNumber: undefined,
        dateAdded: undefined,
        dateUpdated: undefined,
      };

      expect(expenseWithOptionals.providerId).toBeUndefined();
      expect(expenseWithOptionals.serviceDescription).toBeUndefined();
      expect(expenseWithOptionals.paidDate).toBeUndefined();
    });
  });

  describe("ClaimStatus Enum", () => {
    it("should contain all expected claim status values", () => {
      expect(ClaimStatus.Submitted).toBe("submitted");
      expect(ClaimStatus.Processing).toBe("processing");
      expect(ClaimStatus.Approved).toBe("approved");
      expect(ClaimStatus.Denied).toBe("denied");
      expect(ClaimStatus.Paid).toBe("paid");
      expect(ClaimStatus.Closed).toBe("closed");
    });

    it("should have 6 status values", () => {
      const statusValues = Object.values(ClaimStatus);
      expect(statusValues).toHaveLength(6);
    });
  });

  describe("validateFinancialConsistency", () => {
    it("should validate when allocated amounts equal billed amount", () => {
      const result = validateFinancialConsistency(250, 50, 150, 50);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should validate when allocated amounts are less than billed amount", () => {
      const result = validateFinancialConsistency(300, 50, 150, 50);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should fail validation when allocated amounts exceed billed amount", () => {
      const result = validateFinancialConsistency(200, 50, 150, 50);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(
        "Total allocated amount ($250.00) cannot exceed billed amount ($200.00)",
      );
    });

    it("should validate with default zero values for optional parameters", () => {
      const result = validateFinancialConsistency(100);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should handle edge case where billed amount is zero", () => {
      const result = validateFinancialConsistency(0, 0, 0, 0);
      expect(result.isValid).toBe(true);
    });

    it("should handle partial allocation correctly", () => {
      const result = validateFinancialConsistency(100, 20, 0, 30);
      expect(result.isValid).toBe(true);
    });

    it("should handle decimal precision correctly", () => {
      const result = validateFinancialConsistency(100.5, 25.25, 50.25, 25.01);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("$100.51");
      expect(result.error).toContain("$100.50");
    });
  });

  describe("calculateNetAmount", () => {
    it("should calculate net amount correctly", () => {
      const expense = {
        billedAmount: 300,
        insuranceDiscount: 50,
        insurancePaid: 200,
      };

      const netAmount = calculateNetAmount(expense);
      expect(netAmount).toBe(50);
    });

    it("should handle zero discount and payment", () => {
      const expense = {
        billedAmount: 100,
        insuranceDiscount: 0,
        insurancePaid: 0,
      };

      const netAmount = calculateNetAmount(expense);
      expect(netAmount).toBe(100);
    });

    it("should handle decimal values correctly", () => {
      const expense = {
        billedAmount: 123.45,
        insuranceDiscount: 23.45,
        insurancePaid: 50.0,
      };

      const netAmount = calculateNetAmount(expense);
      expect(netAmount).toBe(50.0);
    });

    it("should return negative value when discounts exceed billed amount", () => {
      const expense = {
        billedAmount: 100,
        insuranceDiscount: 60,
        insurancePaid: 60,
      };

      const netAmount = calculateNetAmount(expense);
      expect(netAmount).toBe(-20);
    });
  });

  describe("isFullyPaid", () => {
    it("should return true when patient responsibility is zero", () => {
      const expense = {
        patientResponsibility: 0,
        paidDate: null,
      };

      expect(isFullyPaid(expense)).toBe(true);
    });

    it("should return true when paid date exists", () => {
      const expense = {
        patientResponsibility: 50,
        paidDate: new Date("2024-01-20"),
      };

      expect(isFullyPaid(expense)).toBe(true);
    });

    it("should return false when patient has responsibility and no paid date", () => {
      const expense = {
        patientResponsibility: 50,
        paidDate: null,
      };

      expect(isFullyPaid(expense)).toBe(false);
    });

    it("should return false when patient has responsibility and undefined paid date", () => {
      const expense = {
        patientResponsibility: 25.5,
        paidDate: undefined,
      };

      expect(isFullyPaid(expense)).toBe(false);
    });
  });

  describe("isOutstanding", () => {
    it("should return true when patient has responsibility and no paid date", () => {
      const expense = {
        patientResponsibility: 75,
        paidDate: null,
      };

      expect(isOutstanding(expense)).toBe(true);
    });

    it("should return false when patient responsibility is zero", () => {
      const expense = {
        patientResponsibility: 0,
        paidDate: null,
      };

      expect(isOutstanding(expense)).toBe(false);
    });

    it("should return false when paid date exists", () => {
      const expense = {
        patientResponsibility: 50,
        paidDate: new Date("2024-01-25"),
      };

      expect(isOutstanding(expense)).toBe(false);
    });

    it("should return false when both responsibility is zero and paid date exists", () => {
      const expense = {
        patientResponsibility: 0,
        paidDate: new Date("2024-01-25"),
      };

      expect(isOutstanding(expense)).toBe(false);
    });

    it("should handle decimal patient responsibility correctly", () => {
      const expense = {
        patientResponsibility: 0.01,
        paidDate: null,
      };

      expect(isOutstanding(expense)).toBe(true);
    });
  });

  describe("MedicalExpenseCreateRequest", () => {
    it("should create valid create request with required fields", () => {
      const createRequest: MedicalExpenseCreateRequest = {
        transactionId: 200,
        serviceDate: new Date("2024-03-01"),
        billedAmount: 150.0,
      };

      expect(createRequest.transactionId).toBe(200);
      expect(createRequest.serviceDate).toEqual(new Date("2024-03-01"));
      expect(createRequest.billedAmount).toBe(150.0);
    });

    it("should create valid create request with all fields", () => {
      const createRequest: MedicalExpenseCreateRequest = {
        transactionId: 200,
        providerId: 2,
        familyMemberId: 2,
        serviceDate: new Date("2024-03-01"),
        serviceDescription: "Specialist consultation",
        procedureCode: "99214",
        diagnosisCode: "M79.3",
        billedAmount: 350.0,
        insuranceDiscount: 70.0,
        insurancePaid: 210.0,
        patientResponsibility: 70.0,
        paidDate: new Date("2024-03-05"),
        isOutOfNetwork: true,
        claimNumber: "CL789012",
        claimStatus: ClaimStatus.Paid,
      };

      expect(createRequest.transactionId).toBe(200);
      expect(createRequest.isOutOfNetwork).toBe(true);
      expect(createRequest.claimStatus).toBe(ClaimStatus.Paid);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle negative financial amounts gracefully", () => {
      // When billed amount is negative but no allocations, total (0) > billed (-100) is true, so invalid
      const result = validateFinancialConsistency(-100, 0, 0, 0);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("cannot exceed billed amount");
    });

    it("should handle very large financial amounts", () => {
      const result = validateFinancialConsistency(
        999999.99,
        100000.0,
        500000.0,
        399999.99,
      );
      expect(result.isValid).toBe(true);
    });

    it("should handle extreme precision in financial calculations", () => {
      const expense = {
        billedAmount: 100.999,
        insuranceDiscount: 25.333,
        insurancePaid: 50.333,
      };

      const netAmount = calculateNetAmount(expense);
      expect(netAmount).toBeCloseTo(25.333, 3);
    });
  });
});
