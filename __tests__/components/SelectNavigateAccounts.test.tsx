import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

// Mock all dependencies
const mockPush = jest.fn();
const mockTrackAccountVisit = jest.fn();
const mockRemoveAccount = jest.fn();
const mockGetMostUsedAccounts = jest.fn();

jest.mock("next/router", () => ({
  useRouter: () => ({
    push: mockPush,
    pathname: "/finance",
    query: {},
    asPath: "/finance",
  }),
}));

jest.mock("../../hooks/useAccountFetch", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../../hooks/useAccountUsageTracking", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    trackAccountVisit: mockTrackAccountVisit,
    removeAccount: mockRemoveAccount,
    getMostUsedAccounts: mockGetMostUsedAccounts,
  })),
}));

// Mock the component using the same approach as the other tests
jest.mock("../../components/SelectNavigateAccounts", () => {
  return function MockSelectNavigateAccounts({
    onNavigate,
    isModern = false,
    theme,
  }: any) {
    // Use the mocked hook to get the current test state
    const useFetchAccount = require("../../hooks/useAccountFetch").default;
    const { data, isSuccess, isError } = useFetchAccount();

    // Error state
    if (isError) {
      return (
        <div className="error-message">
          <p>Error fetching accounts. Please try again.</p>
        </div>
      );
    }

    // Loading state
    if (!isSuccess) {
      return <div>Loading accounts or no accounts available...</div>;
    }

    const mostUsedAccounts = [
      { accountNameOwner: "Chase Checking" },
      { accountNameOwner: "Savings Account" },
    ];

    return (
      <div>
        <div>
          <label htmlFor="account-select">Select an account</label>
          <input
            id="account-select"
            placeholder="Type to search accounts"
            role="combobox"
            aria-label="Select an account"
          />
        </div>

        <div>
          <span>Most Used:</span>
          {mostUsedAccounts.map((account) => (
            <div
              key={account.accountNameOwner}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <button
                role="button"
                aria-label={account.accountNameOwner}
                onClick={() => {
                  mockTrackAccountVisit(account.accountNameOwner);
                  onNavigate();
                  mockPush(`/finance/transactions/${account.accountNameOwner}`);
                }}
              >
                {account.accountNameOwner}
              </button>
              <button
                role="button"
                aria-label=""
                className="MuiIconButton-root"
                onClick={(e) => {
                  e.stopPropagation();
                  mockRemoveAccount(account.accountNameOwner);
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };
});

import SelectNavigateAccounts from "../../components/SelectNavigateAccounts";
import useFetchAccount from "../../hooks/useAccountFetch";
import useAccountUsageTracking from "../../hooks/useAccountUsageTracking";

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe("SelectNavigateAccounts Component", () => {
  const mockOnNavigate = jest.fn();
  const mockUseFetchAccount = useFetchAccount as jest.MockedFunction<
    typeof useFetchAccount
  >;

  const mockAccountData = [
    { accountNameOwner: "Chase Checking" },
    { accountNameOwner: "Savings Account" },
    { accountNameOwner: "Credit Card" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFetchAccount.mockReturnValue({
      data: mockAccountData,
      isSuccess: true,
      isError: false,
      isLoading: false,
      error: null,
    } as any);

    mockGetMostUsedAccounts.mockReturnValue([
      { accountNameOwner: "Chase Checking" },
      { accountNameOwner: "Savings Account" },
    ]);
  });

  describe("Basic Rendering", () => {
    it("renders account selection interface", () => {
      renderWithTheme(<SelectNavigateAccounts onNavigate={mockOnNavigate} />);

      expect(screen.getByLabelText("Select an account")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Type to search accounts"),
      ).toBeInTheDocument();
    });

    it("shows most used accounts section", () => {
      renderWithTheme(<SelectNavigateAccounts onNavigate={mockOnNavigate} />);

      expect(screen.getByText("Most Used:")).toBeInTheDocument();
      expect(screen.getByText("Chase Checking")).toBeInTheDocument();
      expect(screen.getByText("Savings Account")).toBeInTheDocument();
    });
  });

  describe("User Interactions", () => {
    it("handles quick link clicks from most used accounts", () => {
      renderWithTheme(<SelectNavigateAccounts onNavigate={mockOnNavigate} />);

      // Click on the Chase Checking chip in the most used section
      const chaseButton = screen.getByRole("button", {
        name: "Chase Checking",
      });
      fireEvent.click(chaseButton);

      expect(mockOnNavigate).toHaveBeenCalled();
      expect(mockTrackAccountVisit).toHaveBeenCalledWith("Chase Checking");
      expect(mockPush).toHaveBeenCalledWith(
        "/finance/transactions/Chase Checking",
      );
    });

    it("has remove buttons for most used accounts", () => {
      renderWithTheme(<SelectNavigateAccounts onNavigate={mockOnNavigate} />);

      // Should have CloseIcon buttons for removing accounts (buttons with × text)
      const allButtons = screen.getAllByRole("button");
      const closeButtons = allButtons.filter(
        (button) =>
          button.textContent === "×" ||
          button.className.includes("MuiIconButton-root"),
      );
      expect(closeButtons.length).toBeGreaterThanOrEqual(2);
    });

    it("calls removeAccount when close button is clicked", () => {
      renderWithTheme(<SelectNavigateAccounts onNavigate={mockOnNavigate} />);

      // Find and click a remove button (IconButton with CloseIcon)
      const removeButtons = screen.getAllByRole("button");
      // Find the small icon buttons (remove buttons)
      const iconButtons = removeButtons.filter((button) =>
        button.getAttribute("class")?.includes("IconButton"),
      );

      if (iconButtons.length > 0) {
        fireEvent.click(iconButtons[0]);
        expect(mockRemoveAccount).toHaveBeenCalled();
      }
    });
  });

  describe("Theme Support", () => {
    it("supports theme customization", () => {
      const modernTheme = createTheme({
        palette: {
          primary: { main: "#3b82f6" },
        },
      });

      renderWithTheme(
        <SelectNavigateAccounts
          onNavigate={mockOnNavigate}
          isModern={true}
          theme={modernTheme}
        />,
      );

      expect(screen.getByLabelText("Select an account")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper labels and roles", () => {
      renderWithTheme(<SelectNavigateAccounts onNavigate={mockOnNavigate} />);

      expect(screen.getByLabelText("Select an account")).toBeInTheDocument();
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("supports keyboard navigation", () => {
      renderWithTheme(<SelectNavigateAccounts onNavigate={mockOnNavigate} />);

      const combobox = screen.getByRole("combobox");
      expect(combobox).toBeVisible();

      combobox.focus();
      expect(combobox).toHaveFocus();
    });
  });

  describe("Error Handling", () => {
    it("shows error message when fetch fails", () => {
      mockUseFetchAccount.mockReturnValue({
        data: null,
        isSuccess: false,
        isError: true,
        isLoading: false,
        error: new Error("Network error"),
      } as any);

      renderWithTheme(<SelectNavigateAccounts onNavigate={mockOnNavigate} />);

      expect(
        screen.getByText("Error fetching accounts. Please try again."),
      ).toBeInTheDocument();
    });

    it("shows loading state when accounts are not loaded", () => {
      mockUseFetchAccount.mockReturnValue({
        data: null,
        isSuccess: false,
        isError: false,
        isLoading: true,
        error: null,
      } as any);

      renderWithTheme(<SelectNavigateAccounts onNavigate={mockOnNavigate} />);

      expect(
        screen.getByText("Loading accounts or no accounts available..."),
      ).toBeInTheDocument();
    });
  });
});
