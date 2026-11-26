/**
 * Amount range meaning "no amount filter". Anything narrower is sent to the
 * server as minAmount/maxAmount and hides transactions outside it.
 */
export const DEFAULT_AMOUNT_RANGE: Readonly<{ min: number; max: number }> = {
  min: -10000,
  max: 10000,
};

export const isAmountRangeActive = (range: {
  min: number;
  max: number;
}): boolean =>
  range.min > DEFAULT_AMOUNT_RANGE.min || range.max < DEFAULT_AMOUNT_RANGE.max;
