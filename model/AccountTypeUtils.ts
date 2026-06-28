import { AccountType } from "./AccountType";

export const ASSET_ACCOUNT_TYPES: AccountType[] = [
  "debit", "checking", "savings", "certificate", "money_market",
  "brokerage", "retirement_401k", "retirement_ira", "retirement_roth", "pension",
  "hsa", "fsa", "medical_savings", "prepaid", "gift_card",
  "business_checking", "business_savings", "cash", "escrow", "trust",
];

export const LIABILITY_ACCOUNT_TYPES: AccountType[] = [
  "credit", "credit_card", "mortgage", "auto_loan", "student_loan",
  "personal_loan", "line_of_credit", "business_credit",
];

export const CREDIT_CARD_ACCOUNT_TYPES: AccountType[] = ["credit", "credit_card"];

export const ALL_ACCOUNT_TYPES: AccountType[] = [
  ...ASSET_ACCOUNT_TYPES, ...LIABILITY_ACCOUNT_TYPES, "utility",
];

export const isAssetAccount = (type: AccountType | string): boolean =>
  ASSET_ACCOUNT_TYPES.includes(type as AccountType);

export const isLiabilityAccount = (type: AccountType | string): boolean =>
  LIABILITY_ACCOUNT_TYPES.includes(type as AccountType);

export const isCreditCardAccount = (type: AccountType | string): boolean =>
  CREDIT_CARD_ACCOUNT_TYPES.includes(type as AccountType);
