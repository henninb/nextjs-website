export function validateAmountAndAccounts(
  amount: number | undefined,
  sourceAccount: string | undefined,
  destinationAccount: string | undefined,
): { amount?: string; accounts?: string } {
  const errs: { amount?: string; accounts?: string } = {};
  const amt = parseFloat(String(amount ?? 0));
  if (isNaN(amt) || amt < 0) errs.amount = "Amount cannot be negative";
  if (sourceAccount && destinationAccount && sourceAccount === destinationAccount)
    errs.accounts = "Source and destination must be different";
  return errs;
}
