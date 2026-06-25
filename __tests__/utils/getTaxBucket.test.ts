import { getTaxBucketLabel } from "../../utils/getTaxBucket";
import { TaxBucket } from "../../model/Account";

describe("getTaxBucketLabel", () => {
  it.each([
    ["pretax", "Pre-tax"],
    ["roth", "Roth"],
    ["taxable", "Taxable"],
    [undefined, "Taxable"],
  ] as [TaxBucket | undefined, string][])(
    "maps %s → %s",
    (bucket, expected) => {
      expect(getTaxBucketLabel(bucket)).toBe(expected);
    },
  );
});
