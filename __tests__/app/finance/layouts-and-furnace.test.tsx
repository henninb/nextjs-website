import React from "react";
import { render, screen } from "@testing-library/react";

jest.mock("../../../layouts/FinanceLayout", () => ({
  __esModule: true,
  default: ({ children }: any) => (
    <div data-testid="finance-layout-wrapper">{children}</div>
  ),
}));

import FinanceLayout, {
  metadata as financeMetadata,
} from "../../../app/finance/layout";
import CategoriesLayout, {
  metadata as categoriesMetadata,
} from "../../../app/finance/categories/layout";
import ConfigurationLayout, {
  metadata as configurationMetadata,
} from "../../../app/finance/configuration/layout";
import DescriptionsLayout, {
  metadata as descriptionsMetadata,
} from "../../../app/finance/descriptions/layout";
import MedicalExpensesLayout, {
  metadata as medicalExpensesMetadata,
} from "../../../app/finance/medical-expenses/layout";
import PaymentsLayout, {
  metadata as paymentsMetadata,
} from "../../../app/finance/payments/layout";
import TransfersLayout, {
  metadata as transfersMetadata,
} from "../../../app/finance/transfers/layout";
import TrendsLayout, {
  metadata as trendsMetadata,
} from "../../../app/finance/trends/layout";
import TransactionsLayout, {
  metadata as transactionsMetadata,
} from "../../../app/finance/transactions/layout";
import FurnaceLayout, {
  metadata as furnaceMetadata,
} from "../../../app/furnace/layout";
import FurnacePage from "../../../app/furnace/page";

describe("finance layouts", () => {
  it("renders finance layout through the shared wrapper", () => {
    render(
      <FinanceLayout>
        <div>finance-child</div>
      </FinanceLayout>,
    );

    expect(screen.getByTestId("finance-layout-wrapper")).toHaveTextContent(
      "finance-child",
    );
    expect(financeMetadata.title).toEqual({
      default: "Finance Management",
      template: "%s | Finance App",
    });
  });

  it("renders leaf layouts and exports route metadata", () => {
    render(
      <div>
        <CategoriesLayout>
          <span>categories-child</span>
        </CategoriesLayout>
        <ConfigurationLayout>
          <span>configuration-child</span>
        </ConfigurationLayout>
        <DescriptionsLayout>
          <span>descriptions-child</span>
        </DescriptionsLayout>
        <MedicalExpensesLayout>
          <span>medical-child</span>
        </MedicalExpensesLayout>
        <PaymentsLayout>
          <span>payments-child</span>
        </PaymentsLayout>
        <TransfersLayout>
          <span>transfers-child</span>
        </TransfersLayout>
        <TrendsLayout>
          <span>trends-child</span>
        </TrendsLayout>
        <TransactionsLayout>
          <span>transactions-child</span>
        </TransactionsLayout>
        <FurnaceLayout>
          <span>furnace-child</span>
        </FurnaceLayout>
      </div>,
    );

    expect(screen.getByText("categories-child")).toBeInTheDocument();
    expect(screen.getByText("configuration-child")).toBeInTheDocument();
    expect(screen.getByText("descriptions-child")).toBeInTheDocument();
    expect(screen.getByText("medical-child")).toBeInTheDocument();
    expect(screen.getByText("payments-child")).toBeInTheDocument();
    expect(screen.getByText("transfers-child")).toBeInTheDocument();
    expect(screen.getByText("trends-child")).toBeInTheDocument();
    expect(screen.getByText("transactions-child")).toBeInTheDocument();
    expect(screen.getByText("furnace-child")).toBeInTheDocument();

    expect(categoriesMetadata.title).toBe("Transaction Categories");
    expect(configurationMetadata.title).toBe("Account Configuration");
    expect(descriptionsMetadata.title).toBe("Transaction Descriptions");
    expect(medicalExpensesMetadata.title).toBe("Medical Expenses Tracker");
    expect(paymentsMetadata.title).toBe("Payment Management");
    expect(transfersMetadata.title).toBe("Transfer Management");
    expect(trendsMetadata.title).toBe("Financial Trends & Analytics");
    expect(transactionsMetadata.title).toEqual({
      default: "Transactions",
      template: "%s | Finance App",
    });
    expect(furnaceMetadata.title).toBe("Furnace Monitor");
  });
});

describe("app/furnace/page", () => {
  it("renders the furnace reference content and external resources", () => {
    render(<FurnacePage />);

    expect(
      screen.getByText("Armstrong Furnace Reference"),
    ).toBeInTheDocument();
    expect(screen.getByText("Model: G1D93AU090D16C-1A")).toBeInTheDocument();
    expect(screen.getByText("Technical Specifications")).toBeInTheDocument();
    expect(screen.getByText("Troubleshooting & Error Codes")).toBeInTheDocument();
    expect(
      screen.getByText("Maintenance Schedule & DIY Procedures"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Performance Optimization & Efficiency Tips"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Sizing, Installation & Compatibility Notes"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /product literature/i }),
    ).toHaveAttribute("href", "https://www.armstrongair.com/owners/literature/");
  });
});
