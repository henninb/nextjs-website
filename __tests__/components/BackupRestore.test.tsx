import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import BackupRestore from "../../components/BackupRestore";

// Mock the hooks
jest.mock("../../hooks/useAccountFetch", () => ({
  __esModule: true,
  default: () => ({ data: [{ accountId: 1, name: "Test Account" }] }),
}));
jest.mock("../../hooks/useCategoryFetch", () => ({
  __esModule: true,
  default: () => ({ data: [{ categoryId: 1, name: "Test Category" }] }),
}));
jest.mock("../../hooks/useDescriptionFetch", () => ({
  __esModule: true,
  default: () => ({ data: [{ descriptionId: 1, name: "Test Description" }] }),
}));
jest.mock("../../hooks/useParameterFetch", () => ({
  __esModule: true,
  default: () => ({ data: [{ parameterId: 1, name: "Test Parameter" }] }),
}));
jest.mock("../../hooks/usePaymentFetch", () => ({
  __esModule: true,
  default: () => ({ data: [{ paymentId: 1, name: "Test Payment" }] }),
}));
jest.mock("../../hooks/usePendingTransactionFetch", () => ({
  __esModule: true,
  default: () => ({
    data: [{ pendingTransactionId: 1, name: "Test Pending Transaction" }],
  }),
}));
jest.mock("../../hooks/useTransactionByAccountFetch", () => ({
  __esModule: true,
  default: () => ({ data: [{ transactionId: 1, name: "Test Transaction" }] }),
}));
jest.mock("../../hooks/useTransferFetch", () => ({
  __esModule: true,
  default: () => ({ data: [{ transferId: 1, name: "Test Transfer" }] }),
}));

const mockInsertAccount = jest.fn();
jest.mock("../../hooks/useAccountInsert", () => ({
  __esModule: true,
  default: () => ({ mutateAsync: mockInsertAccount }),
}));

const mockInsertCategory = jest.fn();
jest.mock("../../hooks/useCategoryInsert", () => ({
  __esModule: true,
  default: () => ({ mutateAsync: mockInsertCategory }),
}));

const mockInsertDescription = jest.fn();
jest.mock("../../hooks/useDescriptionInsert", () => ({
  __esModule: true,
  default: () => ({ mutateAsync: mockInsertDescription }),
}));

const mockInsertParameter = jest.fn();
jest.mock("../../hooks/useParameterInsert", () => ({
  __esModule: true,
  default: () => ({ mutateAsync: mockInsertParameter }),
}));

const mockInsertPayment = jest.fn();
jest.mock("../../hooks/usePaymentInsert", () => ({
  __esModule: true,
  default: () => ({ mutateAsync: mockInsertPayment }),
}));

const mockInsertPendingTransaction = jest.fn();
jest.mock("../../hooks/usePendingTransactionInsert", () => ({
  __esModule: true,
  default: () => ({ mutateAsync: mockInsertPendingTransaction }),
}));

const mockInsertTransaction = jest.fn();
jest.mock("../../hooks/useTransactionInsert", () => ({
  __esModule: true,
  default: () => ({ mutateAsync: mockInsertTransaction }),
}));

const mockInsertTransfer = jest.fn();
jest.mock("../../hooks/useTransferInsert", () => ({
  __esModule: true,
  default: () => ({ mutateAsync: mockInsertTransfer }),
}));

describe("BackupRestore", () => {
  beforeEach(() => {
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = jest.fn();
    global.URL.revokeObjectURL = jest.fn();
  });

  it("renders the component", () => {
    render(<BackupRestore />);
    expect(screen.getByText("Backup and Restore")).toBeInTheDocument();
    expect(screen.getByText("Backup to File")).toBeInTheDocument();
    expect(screen.getByText("Restore from File")).toBeInTheDocument();
  });

  it("handles backup correctly", async () => {
    render(<BackupRestore />);
    fireEvent.click(screen.getByText("Backup to File"));

    await waitFor(() => {
      expect(screen.getByText("Backup successful!")).toBeInTheDocument();
    });
  });

  it("handles restore correctly", async () => {
    const backupData = {
      accounts: [{ accountId: 1, name: "Restored Account" }],
      categories: [{ categoryId: 1, name: "Restored Category" }],
    };
    const file = new File([JSON.stringify(backupData)], "backup.json", {
      type: "application/json",
    });

    render(<BackupRestore />);
    const input = screen.getByTestId("restore-input");

    Object.defineProperty(input, "files", {
      value: [file],
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(mockInsertAccount).toHaveBeenCalledWith({
        payload: backupData.accounts[0],
      });
      expect(mockInsertCategory).toHaveBeenCalledWith({
        payload: backupData.categories[0],
      });
      expect(screen.getByText("Restore successful!")).toBeInTheDocument();
    });
  });
});
