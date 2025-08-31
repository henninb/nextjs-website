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

      const insuranceDiscountInput =
        screen.getByLabelText("Insurance Discount");
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

  describe("Family Member Dropdown Functionality", () => {
    it("should display family members in dropdown when data is available", () => {
      renderForm();

      const autocompleteInput = screen.getByLabelText("Family Member");
      expect(autocompleteInput).toBeInTheDocument();

      // Click to open the dropdown
      fireEvent.click(autocompleteInput);
      fireEvent.keyDown(autocompleteInput, { key: "ArrowDown" });

      // Check that family member option appears
      expect(screen.getByText("John Doe (self)")).toBeInTheDocument();
    });

    it("should allow selection of a family member", async () => {
      renderForm();

      const autocompleteInput = screen.getByLabelText("Family Member");

      // Open dropdown and select family member
      fireEvent.click(autocompleteInput);
      fireEvent.keyDown(autocompleteInput, { key: "ArrowDown" });

      const familyMemberOption = screen.getByText("John Doe (self)");
      fireEvent.click(familyMemberOption);

      // Verify selection is made
      await waitFor(() => {
        expect(screen.getByDisplayValue("John Doe (self)")).toBeInTheDocument();
      });
    });

    it("should submit form with selected family member", async () => {
      renderForm();

      // Fill required fields
      const serviceDateInput = screen.getByLabelText("Service Date *");
      fireEvent.change(serviceDateInput, { target: { value: "2024-01-15" } });

      const billedAmountInput = screen.getByLabelText("Billed Amount *");
      fireEvent.change(billedAmountInput, { target: { value: "250" } });

      // Select family member
      const autocompleteInput = screen.getByLabelText("Family Member");
      fireEvent.click(autocompleteInput);
      fireEvent.keyDown(autocompleteInput, { key: "ArrowDown" });

      const familyMemberOption = screen.getByText("John Doe (self)");
      fireEvent.click(familyMemberOption);

      // Submit form
      const saveButton = screen.getByRole("button", { name: /save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      });

      // Verify submitted data includes family member
      const submittedData = mockOnSubmit.mock.calls[0][0];
      expect(submittedData.familyMemberId).toBe(1);
    });

    it("should handle family member API error gracefully", () => {
      MockedUseFamilyMemberFetch.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Failed to fetch family members"),
      });

      renderForm();

      // Family member field should still be present even with error
      const familyMemberInput = screen.getByLabelText("Family Member");
      expect(familyMemberInput).toBeInTheDocument();
    });

    it("should handle empty family members list", () => {
      MockedUseFamilyMemberFetch.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      renderForm();

      const familyMemberInput = screen.getByLabelText("Family Member");
      expect(familyMemberInput).toBeInTheDocument();

      // Dropdown should be empty when clicked
      fireEvent.click(familyMemberInput);
      fireEvent.keyDown(familyMemberInput, { key: "ArrowDown" });

      // Should not show any options
      expect(screen.queryByText("John Doe (self)")).not.toBeInTheDocument();
    });

    it("should clear family member selection when option is removed", async () => {
      const initialData: Partial<MedicalExpense> = {
        familyMemberId: 1,
        serviceDescription: "Test service",
        billedAmount: 100,
      };

      renderForm({ initialData, isEdit: true });

      const autocompleteInput = screen.getByLabelText("Family Member");

      // Verify initial selection
      await waitFor(() => {
        expect(screen.getByDisplayValue("John Doe (self)")).toBeInTheDocument();
      });

      // Clear the selection (simulate clicking the clear button)
      const clearButton = screen.getByTitle("Clear");
      fireEvent.click(clearButton);

      // Verify selection is cleared
      await waitFor(() => {
        expect(
          screen.queryByDisplayValue("John Doe (self)"),
        ).not.toBeInTheDocument();
      });
    });

    it("should display correct family member display name format", () => {
      const additionalFamilyMembers: FamilyMember[] = [
        ...mockFamilyMembers,
        {
          familyMemberId: 2,
          owner: "testuser",
          memberName: "Jane Doe",
          relationship: FamilyRelationship.Spouse,
          dateOfBirth: new Date("1982-05-15"),
          activeStatus: true,
          dateAdded: new Date(),
          dateUpdated: new Date(),
        },
      ];

      MockedUseFamilyMemberFetch.mockReturnValue({
        data: additionalFamilyMembers,
        isLoading: false,
        error: null,
      });

      renderForm();

      const autocompleteInput = screen.getByLabelText("Family Member");
      fireEvent.click(autocompleteInput);
      fireEvent.keyDown(autocompleteInput, { key: "ArrowDown" });

      // Check both family members are displayed with correct format
      expect(screen.getByText("John Doe (self)")).toBeInTheDocument();
      expect(screen.getByText("Jane Doe (spouse)")).toBeInTheDocument();
    });
  });
});
