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
    expect(getCategoryFromDescription("Shell Gas Station")).toBe("fuel");
    expect(getCategoryFromDescription("BP Fuel Stop")).toBe("fuel");
    expect(getCategoryFromDescription("shell")).toBe("fuel");
    expect(getCategoryFromDescription("FUEL")).toBe("fuel");
  });

  it("should categorize restaurant descriptions correctly", () => {
    expect(getCategoryFromDescription("McDonald's")).toBe("restaurants");
    expect(getCategoryFromDescription("Pizza Hut Restaurant")).toBe(
      "restaurants",
    );
    expect(getCategoryFromDescription("PIZZA")).toBe("restaurants");
    expect(getCategoryFromDescription("mcdonalds")).toBe("restaurants");
  });

  it("should categorize payment/income descriptions correctly", () => {
    expect(getCategoryFromDescription("Electronic Payment Received")).toBe(
      "payment",
    );
    expect(getCategoryFromDescription("ELECTRONIC PAYMENT RECEIVED")).toBe(
      "payment",
    );
    expect(getCategoryFromDescription("Payment Received")).toBe("payment");
    expect(getCategoryFromDescription("ACH Credit")).toBe("payment");
    expect(getCategoryFromDescription("Direct Deposit")).toBe("payment");
    expect(getCategoryFromDescription("Payroll")).toBe("payment");
    expect(getCategoryFromDescription("Salary Payment")).toBe("payment");
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
      ).toBe("fuel");
      expect(getCategoryFromDescription("Shell Gas Station")).toBe("fuel");
      expect(getCategoryFromDescription("Walmart Gas")).toBe("fuel");
    });

    it("should categorize Chick-fil-A with various spellings correctly", () => {
      expect(getCategoryFromDescription("Chick-fil-A")).toBe("restaurants");
      expect(getCategoryFromDescription("CHICK-FIL-A")).toBe("restaurants");
      expect(getCategoryFromDescription("Chik-fil-a")).toBe("restaurants");
      expect(getCategoryFromDescription("ChickFilA")).toBe("restaurants");
      expect(getCategoryFromDescription("Chick-fil-A - Store #1234")).toBe(
        "restaurants",
      );
    });

    it("should categorize Target as shopping, not groceries", () => {
      expect(getCategoryFromDescription("Target - Champlin")).toBe("shopping");
      expect(getCategoryFromDescription("Target Store")).toBe("shopping");
    });

    it("should categorize Bill's Superette as fuel (it's a gas station)", () => {
      expect(getCategoryFromDescription("Bill's Superette - Ramsey")).toBe(
        "fuel",
      );
      expect(getCategoryFromDescription("Bills Superette")).toBe("fuel");
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
      expect(getCategoryFromDescription("Bill's Superette")).toBe("fuel"); // Gas station
    });
  });
});
