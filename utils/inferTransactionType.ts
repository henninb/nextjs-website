import { AccountType } from "../model/AccountType";
import { TransactionType } from "../model/TransactionType";

const TRANSFER_PATTERNS = [
  /^ONLINE TRANSFER\b/i,
  /\bTRANSFER TO\b/i,
  /\bTRANSFER FROM\b/i,
  /\bACCOUNT TRANSFER\b/i,
];

const INCOME_PATTERNS = [
  /^NAVAN,?\s*INC\b/i,
  /\bREIMBURSEMENT\b/i,
  /\bPAYROLL\b/i,
  /\bDIRECT DEPOSIT\b/i,
  /\bDEPOSIT ACH\b/i,
  /\bACH DEPOSIT\b/i,
  /\bREFUND\b/i,
  /\bRETURN\b/i,
  /\bCASHBACK\b/i,
  /\bCASH BACK\b/i,
  /\bCREDIT ADJUSTMENT\b/i,
];

export function inferTransactionType(
  description: string,
  amount: number | null,
  accountType: AccountType | undefined,
): TransactionType {
  if (TRANSFER_PATTERNS.some((p) => p.test(description))) return "transfer";
  if (INCOME_PATTERNS.some((p) => p.test(description))) return "income";
  // Negative amount means money coming in (credit-card credits are stored negative by the parser)
  if (amount !== null && amount < 0) return "income";
  return "expense";
}
