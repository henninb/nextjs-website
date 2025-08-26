import { getCategoryFromDescription } from "../../utils/categoryMapping";

describe("getCategoryFromDescription", () => {
  it("should categorize grocery store descriptions correctly", () => {
    expect(getCategoryFromDescription("Walmart Grocery Store")).toBe(
      "groceries",
    );
    expect(getCategoryFromDescription("Kroger Supermarket")).toBe("groceries");
    expect(getCategoryFromDescription("walmart")).toBe("groceries");
    expect(getCategoryFromDescription("GROCERY STORE")).toBe("groceries");
  });

  it("should categorize gas station descriptions correctly", () => {
    expect(getCategoryFromDescription("Shell Gas Station")).toBe("gas");
    expect(getCategoryFromDescription("BP Fuel Stop")).toBe("gas");
    expect(getCategoryFromDescription("shell")).toBe("gas");
    expect(getCategoryFromDescription("FUEL")).toBe("gas");
  });

  it("should categorize restaurant descriptions correctly", () => {
    expect(getCategoryFromDescription("McDonald's")).toBe("restaurants");
    expect(getCategoryFromDescription("Pizza Hut Restaurant")).toBe(
      "restaurants",
    );
    expect(getCategoryFromDescription("PIZZA")).toBe("restaurants");
    expect(getCategoryFromDescription("mcdonalds")).toBe("restaurants");
  });

  it("should categorize bill descriptions correctly", () => {
    expect(getCategoryFromDescription("Electric Bill")).toBe("bills");
    expect(getCategoryFromDescription("Water Utility")).toBe("bills");
    expect(getCategoryFromDescription("ELECTRIC")).toBe("bills");
    expect(getCategoryFromDescription("bill")).toBe("bills");
  });

  it("should default to imported for unrecognized descriptions", () => {
    expect(getCategoryFromDescription("Random Unknown Business")).toBe(
      "imported",
    );
    expect(getCategoryFromDescription("Some Random Store")).toBe("imported");
    expect(getCategoryFromDescription("")).toBe("imported");
  });

  describe("Specific edge cases and fixes", () => {
    it("should categorize gas stations correctly even when combined with store names", () => {
      expect(
        getCategoryFromDescription("COSTCO GAS #1344 SAINT CLOUD US"),
      ).toBe("gas");
      expect(getCategoryFromDescription("Shell Gas Station")).toBe("gas");
      expect(getCategoryFromDescription("Walmart Gas")).toBe("gas");
    });

    it("should categorize Target as shopping, not groceries", () => {
      expect(getCategoryFromDescription("Target - Champlin")).toBe("shopping");
      expect(getCategoryFromDescription("Target Store")).toBe("shopping");
    });

    it("should categorize superettes and small grocery stores correctly", () => {
      expect(getCategoryFromDescription("Bill's Superette - Ramsey")).toBe(
        "groceries",
      );
      expect(getCategoryFromDescription("Joe's Superette")).toBe("groceries");
    });

    it("should categorize transportation fees correctly", () => {
      expect(getCategoryFromDescription("Nvn Trp Fee Nns1we")).toBe(
        "transportation",
      );
      expect(getCategoryFromDescription("Trip Fee")).toBe("transportation");
    });

    it("should categorize Subway restaurant correctly", () => {
      expect(getCategoryFromDescription("Subway - Las Vegas")).toBe(
        "restaurants",
      );
      expect(getCategoryFromDescription("Subway Restaurant")).toBe(
        "restaurants",
      );
    });

    it("should categorize taxi services correctly", () => {
      expect(getCategoryFromDescription("Curb Las Vegas Taxi")).toBe(
        "transportation",
      );
      expect(getCategoryFromDescription("Yellow Taxi")).toBe("transportation");
    });

    it("should categorize pizza and food places correctly", () => {
      expect(getCategoryFromDescription("Slice Of Vegas")).toBe("restaurants");
      expect(getCategoryFromDescription("Pizza Slice")).toBe("restaurants");
    });

    it("should not confuse place names with gas stations", () => {
      // "Las Vegas" contains "gas" but shouldn't be categorized as gas
      expect(getCategoryFromDescription("Restaurant Las Vegas")).toBe(
        "restaurants",
      );
      expect(getCategoryFromDescription("Hotel Las Vegas")).toBe("imported");
    });

    it("should handle Bill's vs bill correctly", () => {
      expect(getCategoryFromDescription("Bill's Store")).toBe("imported"); // Person's store
      expect(getCategoryFromDescription("Electric Bill")).toBe("bills"); // Utility bill
      expect(getCategoryFromDescription("Bill's Superette")).toBe("groceries"); // Grocery store
    });
  });
});
