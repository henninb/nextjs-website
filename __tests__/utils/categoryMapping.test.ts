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

  it("should categorize paycheck descriptions correctly", () => {
    expect(getCategoryFromDescription("Direct Deposit")).toBe("paycheck");
    expect(getCategoryFromDescription("Payroll")).toBe("paycheck");
    expect(getCategoryFromDescription("Salary Payment")).toBe("paycheck");
  });

  it("should categorize generic payment descriptions correctly", () => {
    expect(getCategoryFromDescription("Electronic Payment Received")).toBe(
      "payment",
    );
    expect(getCategoryFromDescription("ELECTRONIC PAYMENT RECEIVED")).toBe(
      "payment",
    );
    expect(getCategoryFromDescription("Payment Received")).toBe("payment");
    expect(getCategoryFromDescription("ACH Credit")).toBe("payment");
  });

  it("should categorize utility descriptions correctly", () => {
    expect(getCategoryFromDescription("Centerpoint Energy")).toBe("utilities");
    expect(getCategoryFromDescription("Xcel Energy")).toBe("utilities");
    expect(getCategoryFromDescription("Connexus Energy")).toBe("utilities");
    expect(getCategoryFromDescription("City of Coon Rapids")).toBe("utilities");
  });

  it("should categorize communication providers correctly", () => {
    expect(getCategoryFromDescription("T-Mobile")).toBe("communication");
    expect(getCategoryFromDescription("Comcast")).toBe("communication");
    expect(getCategoryFromDescription("Xfinity")).toBe("communication");
    expect(getCategoryFromDescription("Verizon")).toBe("communication");
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
      ).toBe("fuel"); // Costco Gas is fuel, not costco
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

    it("should categorize Costco with its own category (except gas)", () => {
      expect(getCategoryFromDescription("Costco Wholesale")).toBe("costco");
      expect(getCategoryFromDescription("COSTCO")).toBe("costco");
      expect(getCategoryFromDescription("Costco - Store #1234")).toBe("costco");
      // But Costco Gas should be fuel
      expect(
        getCategoryFromDescription("COSTCO GAS #1344 SAINT CLOUD US"),
      ).toBe("fuel");
      expect(getCategoryFromDescription("Costco Gas")).toBe("fuel");
    });

    it("should categorize Target with its own category", () => {
      expect(getCategoryFromDescription("Target - Champlin")).toBe("target");
      expect(getCategoryFromDescription("Target Store")).toBe("target");
      expect(getCategoryFromDescription("TARGET")).toBe("target");
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

    it("should handle Bill's Superette correctly as fuel", () => {
      expect(getCategoryFromDescription("Bill's Store")).toBe("imported"); // Person's store - not recognized
      expect(getCategoryFromDescription("Bill's Superette")).toBe("fuel"); // Gas station
      expect(getCategoryFromDescription("Bills Superette - Ramsey")).toBe(
        "fuel",
      ); // Gas station variant
    });

    it("should categorize local grocery stores correctly", () => {
      expect(getCategoryFromDescription("Mikes Discount Foods")).toBe(
        "groceries",
      );
      expect(getCategoryFromDescription("Cub Foods - Coon Rapids")).toBe(
        "groceries",
      );
      expect(getCategoryFromDescription("Coborns")).toBe("groceries");
      expect(getCategoryFromDescription("Hy-Vee")).toBe("groceries");
      expect(getCategoryFromDescription("Rainbow Foods")).toBe("groceries");
    });

    it("should categorize local fuel stations correctly", () => {
      expect(getCategoryFromDescription("Superamerica - Coon Rapids")).toBe(
        "fuel",
      );
      expect(getCategoryFromDescription("Holiday Station Stores")).toBe("fuel");
      expect(getCategoryFromDescription("Kwik Trip")).toBe("fuel");
      expect(getCategoryFromDescription("Caseys")).toBe("fuel");
      expect(getCategoryFromDescription("PDQ - Anoka")).toBe("fuel");
      expect(getCategoryFromDescription("Anoka Gas Stop")).toBe("fuel");
    });

    it("should categorize garbage/waste services correctly", () => {
      expect(getCategoryFromDescription("Ace Solid Waste")).toBe("garbage");
      expect(getCategoryFromDescription("Curbeside Waste")).toBe("garbage");
      expect(getCategoryFromDescription("Walters Recycling")).toBe("garbage");
      expect(getCategoryFromDescription("Republic Services")).toBe("garbage");
    });

    it("should categorize healthcare providers correctly", () => {
      expect(getCategoryFromDescription("Allina Health")).toBe("healthcare");
      expect(getCategoryFromDescription("Quest Diagnostics")).toBe(
        "healthcare",
      );
      expect(getCategoryFromDescription("Family First Chiropractic")).toBe(
        "healthcare",
      );
      expect(getCategoryFromDescription("Ramsey Dental")).toBe("healthcare");
    });

    it("should categorize local restaurants correctly", () => {
      expect(getCategoryFromDescription("Culvers")).toBe("restaurants");
      expect(getCategoryFromDescription("Five Guys")).toBe("restaurants");
      expect(getCategoryFromDescription("Mercy Hospital Cafeteria")).toBe(
        "restaurants",
      );
      expect(getCategoryFromDescription("Willy McCoys")).toBe("restaurants");
    });

    it("should categorize transportation correctly", () => {
      expect(getCategoryFromDescription("Lyft Rideshare")).toBe(
        "transportation",
      );
      expect(getCategoryFromDescription("Uber Rideshare")).toBe(
        "transportation",
      );
      expect(getCategoryFromDescription("Navan Trip Fee")).toBe(
        "transportation",
      );
    });
  });
});
