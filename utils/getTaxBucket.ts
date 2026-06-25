import { TaxBucket } from "../model/Account";

export function getTaxBucketLabel(bucket: TaxBucket | undefined): string {
  switch (bucket) {
    case "pretax":
      return "Pre-tax";
    case "roth":
      return "Roth";
    case "taxable":
      return "Taxable";
    default:
      return "Taxable";
  }
}
