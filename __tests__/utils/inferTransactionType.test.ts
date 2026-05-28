import { inferTransactionType } from "../../utils/inferTransactionType";

describe("inferTransactionType", () => {
  describe("transfer detection", () => {
    it("detects ONLINE TRANSFER", () => {
      expect(inferTransactionType("ONLINE TRANSFER", 100, "credit")).toBe("transfer");
    });

    it("detects TRANSFER TO", () => {
      expect(inferTransactionType("TRANSFER TO SAVINGS", 200, "debit")).toBe("transfer");
    });

    it("detects TRANSFER FROM", () => {
      expect(inferTransactionType("TRANSFER FROM CHECKING", 200, "debit")).toBe("transfer");
    });
  });

  describe("income detection via description", () => {
    it("detects NAVAN INC reimbursement", () => {
      expect(inferTransactionType("NAVAN, INC", -135, "credit")).toBe("income");
    });

    it("detects REIMBURSEMENT keyword", () => {
      expect(inferTransactionType("EXPENSE REIMBURSEMENT", -200, "credit")).toBe("income");
    });

    it("detects PAYROLL", () => {
      expect(inferTransactionType("ACME CORPORATION PAYROLL", 2500, "debit")).toBe("income");
    });

    it("detects DIRECT DEPOSIT", () => {
      expect(inferTransactionType("DIRECT DEPOSIT EMPLOYER", 3000, "debit")).toBe("income");
    });

    it("detects REFUND", () => {
      expect(inferTransactionType("AMAZON REFUND", -45, "credit")).toBe("income");
    });

    it("detects RETURN", () => {
      expect(inferTransactionType("TARGET.COM CREDIT RETURN", -23, "credit")).toBe("income");
    });
  });

  describe("income detection via negative amount", () => {
    it("treats negative amount on credit as income", () => {
      expect(inferTransactionType("SOME MERCHANT", -50, "credit")).toBe("income");
    });

    it("treats negative amount on debit as income", () => {
      expect(inferTransactionType("SOME DEPOSIT", -100, "debit")).toBe("income");
    });
  });

  describe("expense default", () => {
    it("defaults to expense for credit account positive amount", () => {
      expect(inferTransactionType("ALDI 00000", 60, "credit")).toBe("expense");
    });

    it("defaults to expense for debit account positive amount", () => {
      expect(inferTransactionType("COSTCO", 150, "debit")).toBe("expense");
    });

    it("defaults to expense when amount is null", () => {
      expect(inferTransactionType("UNKNOWN", null, "credit")).toBe("expense");
    });
  });
});
