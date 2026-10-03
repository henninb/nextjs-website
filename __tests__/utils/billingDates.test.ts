import { isBusinessDay, nthBusinessDayOfMonth } from "../../utils/billingDates";

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

describe("billingDates", () => {
  describe("isBusinessDay", () => {
    it("excludes weekends", () => {
      expect(isBusinessDay(new Date(2026, 9, 3))).toBe(false); // Sat
      expect(isBusinessDay(new Date(2026, 9, 4))).toBe(false); // Sun
      expect(isBusinessDay(new Date(2026, 9, 5))).toBe(true); // Mon
    });

    it("excludes federal holidays", () => {
      expect(isBusinessDay(new Date(2026, 0, 1))).toBe(false); // New Year's
      expect(isBusinessDay(new Date(2026, 0, 19))).toBe(false); // MLK
      expect(isBusinessDay(new Date(2026, 8, 7))).toBe(false); // Labor Day
      expect(isBusinessDay(new Date(2026, 9, 12))).toBe(false); // Columbus
      expect(isBusinessDay(new Date(2026, 10, 26))).toBe(false); // Thanksgiving
    });

    it("uses observed dates for weekend holidays", () => {
      // July 4, 2026 is a Saturday → observed Friday July 3
      expect(isBusinessDay(new Date(2026, 6, 3))).toBe(false);
      // Jan 1, 2028 is a Saturday → observed Friday Dec 31, 2027
      expect(isBusinessDay(new Date(2027, 11, 31))).toBe(false);
    });
  });

  describe("nthBusinessDayOfMonth", () => {
    it("matches US Bank statement close dates on the 8th business day", () => {
      const cases: Array<[number, string]> = [
        [0, "2026-01-13"],
        [1, "2026-02-11"],
        [2, "2026-03-11"],
        [3, "2026-04-10"],
        [5, "2026-06-10"],
        [6, "2026-07-13"],
        [8, "2026-09-11"],
      ];
      for (const [month, expected] of cases) {
        expect(ymd(nthBusinessDayOfMonth(2026, month, 8))).toBe(expected);
      }
    });

    it("normalizes month overflow", () => {
      expect(ymd(nthBusinessDayOfMonth(2026, -1, 1))).toBe("2025-12-01");
      expect(ymd(nthBusinessDayOfMonth(2025, 12, 1))).toBe("2026-01-02");
    });

    it("caps at the last business day when the month is short", () => {
      // Feb 2026 has 19 business days; the last is Feb 27
      expect(ymd(nthBusinessDayOfMonth(2026, 1, 23))).toBe("2026-02-27");
    });
  });
});
