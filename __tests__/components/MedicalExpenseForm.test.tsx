import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MedicalExpenseForm from "../../components/MedicalExpenseForm";
import { MedicalExpense, ClaimStatus } from "../../model/MedicalExpense";
import { FamilyMember, FamilyRelationship } from "../../model/FamilyMember";

// Mock the hooks
jest.mock("../../hooks/useFamilyMemberFetch");

const MockedUseFamilyMemberFetch = jest.requireMock(
  "../../hooks/useFamilyMemberFetch",
).default;

const mockFamilyMembers: FamilyMember[] = [
  {
    familyMemberId: 1,
    owner: "testuser",
    memberName: "John Doe",
    relationship: FamilyRelationship.Self,
    dateOfBirth: new Date("1980-01-01"),
    insuranceMemberId: "INS123456",
    activeStatus: true,
    dateAdded: new Date(),
    dateUpdated: new Date(),
  },
];

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("MedicalExpenseForm", () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    MockedUseFamilyMemberFetch.mockReturnValue({
      data: mockFamilyMembers,
      isLoading: false,
      error: null,
    });
  });

  const renderForm = (props = {}) => {
    const defaultProps = {
      onSubmit: mockOnSubmit,
      onCancel: mockOnCancel,
      isEdit: false,
    };

    return render(
      <TestWrapper>
        <MedicalExpenseForm {...defaultProps} {...props} />
      </TestWrapper>,
    );
  };

  describe("Form Rendering", () => {
    it("should render all required form fields", () => {
      renderForm();

      expect(screen.getByLabelText("Service Date *")).toBeInTheDocument();
      expect(screen.getByLabelText("Transaction ID")).toBeInTheDocument();
      expect(screen.getByLabelText("Service Description")).toBeInTheDocument();
      expect(screen.getByLabelText("Billed Amount *")).toBeInTheDocument();
      expect(screen.getByLabelText("Insurance Discount")).toBeInTheDocument();
      expect(screen.getByLabelText("Insurance Paid")).toBeInTheDocument();
      expect(
        screen.getByLabelText("Patient Responsibility"),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Claim Status")).toBeInTheDocument();
    });

    it("should render submit and cancel buttons", () => {
      renderForm();

      expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /cancel/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("should not submit form when missing required data", async () => {
      renderForm();

      const saveButton = screen.getByRole("button", { name: /save/i });
      fireEvent.click(saveButton);

      // Wait a moment for any async validation
      await waitFor(() => {
        // Form should not submit if validation fails
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });
  });

  describe("Form Interaction", () => {
    it("should call onCancel when cancel button is clicked", async () => {
      renderForm();

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

  });

  describe("Form Submission", () => {
    it("should submit form with valid minimum data", async () => {
      renderForm();

      // Set a service date first (required field)
      const serviceDateInput = screen.getByLabelText("Service Date *");
      fireEvent.change(serviceDateInput, { target: { value: "2024-01-15" } });

      // Set billed amount (required field)
      const billedAmountInput = screen.getByLabelText("Billed Amount *");
      fireEvent.change(billedAmountInput, { target: { value: "250" } });

      // Optional: Set transaction ID
      const transactionIdInput = screen.getByLabelText("Transaction ID");
      fireEvent.change(transactionIdInput, { target: { value: "123" } });

      const saveButton = screen.getByRole("button", { name: /save/i });
      fireEvent.click(saveButton);

      // Wait for form to be processed
      await waitFor(
        () => {
          expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        },
        { timeout: 3000 },
      );

      // Verify submitted data structure
      const submittedData = mockOnSubmit.mock.calls[0][0];
      expect(submittedData).toMatchObject({
        transactionId: 123,
        billedAmount: 250,
      });
      expect(submittedData.serviceDate).toBeTruthy();
    });

    it("should populate form with initial data when editing", () => {
      const initialData: Partial<MedicalExpense> = {
        transactionId: 123,
        serviceDescription: "Annual physical",
        billedAmount: 250.0,
        claimStatus: ClaimStatus.Approved,
      };

      renderForm({ initialData, isEdit: true });

      expect(screen.getByDisplayValue("123")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Annual physical")).toBeInTheDocument();
    });
  });

  describe("Financial Input", () => {
    it("should accept financial input values", () => {
      renderForm();

      // Test that financial inputs accept values
      const billedAmountInput = screen.getByLabelText("Billed Amount *");
      fireEvent.change(billedAmountInput, { target: { value: "100" } });
      expect(billedAmountInput).toHaveValue(100);

      const insuranceDiscountInput = screen.getByLabelText("Insurance Discount");
      fireEvent.change(insuranceDiscountInput, { target: { value: "25" } });
      expect(insuranceDiscountInput).toHaveValue(25);

      const insurancePaidInput = screen.getByLabelText("Insurance Paid");
      fireEvent.change(insurancePaidInput, { target: { value: "50" } });
      expect(insurancePaidInput).toHaveValue(50);
    });
  });

  describe("Loading and Error States", () => {
    it("should handle family members loading state", () => {
      MockedUseFamilyMemberFetch.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      renderForm();

      const familyMemberInput = screen.getByLabelText("Family Member");
      expect(familyMemberInput).toBeInTheDocument();
    });
  });
});
