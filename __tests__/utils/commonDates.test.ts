import {
  normalizeTransactionDate,
  formatDateForInput,
  formatDateForDisplay,
} from "../../components/Common";

describe("Common date utilities", () => {
  describe("normalizeTransactionDate", () => {
    it("normalizes date to noon UTC (string input)", () => {
      const n = normalizeTransactionDate("2024-01-15");
      expect(n.getUTCFullYear()).toBe(2024);
      expect(n.getUTCMonth()).toBe(0);
      expect(n.getUTCDate()).toBe(15);
      expect(n.getUTCHours()).toBe(12);
      expect(n.getUTCMinutes()).toBe(0);
    });

    it("parses YYYY-MM-DD strings at noon UTC", () => {
      const n = normalizeTransactionDate("2024-07-04");
      expect(n.getUTCFullYear()).toBe(2024);
      expect(n.getUTCMonth()).toBe(6); // July
      expect(n.getUTCDate()).toBe(4);
      expect(n.getUTCHours()).toBe(12);
    });

    it("handles other string formats by normalizing to noon UTC", () => {
      const n = normalizeTransactionDate("July 4, 2024");
      expect(n.getUTCHours()).toBe(12);
    });

    it("falls back to current date when input is falsy", () => {
      const n = normalizeTransactionDate("" as any);
      expect(n instanceof Date).toBe(true);
    });
  });

  describe("formatDateForInput", () => {
    it("formats Date to YYYY-MM-DD using UTC", () => {
      const d = new Date(Date.UTC(2024, 11, 31, 23, 59));
      expect(formatDateForInput(d)).toBe("2024-12-31");
    });

    it("formats YYYY-MM-DD string input unchanged", () => {
      expect(formatDateForInput("2024-01-01")).toBe("2024-01-01");
    });
  });

  describe("formatDateForDisplay", () => {
    it("renders MM/DD/YYYY using UTC locale rules", () => {
      expect(formatDateForDisplay("2024-03-01")).toMatch(
        /3\/1\/2024|03\/01\/2024/,
      );
    });

    it("returns empty string for falsy input", () => {
      expect(formatDateForDisplay(undefined as any)).toBe("");
    });
  });
});
