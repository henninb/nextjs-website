// PaymentsRequired (normalized)
import PaymentRequired from "../model/PaymentRequired";

export const dummyPaymentsRequired: PaymentRequired[] = [
  {
    accountNameOwner: "fte_brian",
    accountType: "credit",
    moniker: "0000",
    outstanding: 5000.75,
    future: 1000.0,
    cleared: 4000.75,
    validationDate: "2024-10-31",
  },
  {
    accountNameOwner: "bfe-savings_brian", // normalized to match dummyAccounts
    accountType: "debit",
    moniker: "0000",
    outstanding: 5000.75,
    future: 1000.0,
    cleared: 4000.75,
    validationDate: "2024-10-31",
  },
];