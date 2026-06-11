import { getCategoryFromDescription } from "../../utils/categoryMapping";

describe("getCategoryFromDescription", () => {
  it("should categorize grocery store descriptions correctly", () => {
    expect(getCategoryFromDescription("Walmart Grocery Store")).toBe(
      "groceries",
    ); // has "grocery" keyword
    expect(getCategoryFromDescription("Kroger Supermarket")).toBe("groceries");
    expect(getCategoryFromDescription("GROCERY STORE")).toBe("groceries");
  });

  it("should categorize walmart as shopping (general merchandise)", () => {
    expect(getCategoryFromDescription("walmart")).toBe("shopping");
    expect(getCategoryFromDescription("Walmart - Coon Rapids")).toBe("shopping");
  });

  it("should categorize gas station descriptions correctly", () => {
    expect(getCategoryFromDescription("Shell Gas Station")).toBe("fuel");
    expect(getCategoryFromDescription("BP Fuel Stop")).toBe("fuel");
    expect(getCategoryFromDescription("shell")).toBe("fuel");
    expect(getCategoryFromDescription("FUEL")).toBe("fuel");
  });

  it("should categorize restaurant descriptions correctly", () => {
    expect(getCategoryFromDescription("McDonald's")).toBe("restaurant");
    expect(getCategoryFromDescription("Pizza Hut Restaurant")).toBe("restaurant");
    expect(getCategoryFromDescription("PIZZA")).toBe("restaurant");
    expect(getCategoryFromDescription("mcdonalds")).toBe("restaurant");
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
      ).toBe("fuel");
      expect(getCategoryFromDescription("Shell Gas Station")).toBe("fuel");
      expect(getCategoryFromDescription("Walmart Gas")).toBe("fuel");
    });

    it("should categorize Chick-fil-A with various spellings correctly", () => {
      expect(getCategoryFromDescription("Chick-fil-A")).toBe("restaurant");
      expect(getCategoryFromDescription("CHICK-FIL-A")).toBe("restaurant");
      expect(getCategoryFromDescription("Chik-fil-a")).toBe("restaurant");
      expect(getCategoryFromDescription("ChickFilA")).toBe("restaurant");
      expect(getCategoryFromDescription("Chick-fil-A - Store #1234")).toBe(
        "restaurant",
      );
    });

    it("should categorize Costco with its own category (except gas)", () => {
      expect(getCategoryFromDescription("Costco Wholesale")).toBe("costco");
      expect(getCategoryFromDescription("COSTCO")).toBe("costco");
      expect(getCategoryFromDescription("Costco - Store #1234")).toBe("costco");
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

    it("should categorize target.com as online", () => {
      expect(getCategoryFromDescription("target.com")).toBe("online");
      expect(getCategoryFromDescription("Target.com")).toBe("online");
    });

    it("should categorize bullseye cafe as restaurant", () => {
      expect(getCategoryFromDescription("Bullseye Cafe - Minneapolis")).toBe(
        "restaurant",
      );
      expect(getCategoryFromDescription("Target Bullseye Cafe")).toBe(
        "restaurant",
      );
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
      expect(getCategoryFromDescription("Subway - Las Vegas")).toBe("restaurant");
      expect(getCategoryFromDescription("Subway Restaurant")).toBe("restaurant");
    });

    it("should categorize taxi services correctly", () => {
      expect(getCategoryFromDescription("Curb Las Vegas Taxi")).toBe(
        "transportation",
      );
      expect(getCategoryFromDescription("Yellow Taxi")).toBe("transportation");
    });

    it("should categorize pizza and food places correctly", () => {
      expect(getCategoryFromDescription("Slice Of Vegas")).toBe("restaurant");
      expect(getCategoryFromDescription("Pizza Slice")).toBe("restaurant");
    });

    it("should not confuse place names with gas stations", () => {
      expect(getCategoryFromDescription("Restaurant Las Vegas")).toBe(
        "restaurant",
      );
      expect(getCategoryFromDescription("Hotel Las Vegas")).toBe("imported");
    });

    it("should handle Bill's Superette correctly as fuel", () => {
      expect(getCategoryFromDescription("Bill's Store")).toBe("imported");
      expect(getCategoryFromDescription("Bill's Superette")).toBe("fuel");
      expect(getCategoryFromDescription("Bills Superette - Ramsey")).toBe(
        "fuel",
      );
    });

    it("should categorize local grocery stores correctly", () => {
      expect(getCategoryFromDescription("Mikes Discount Foods")).toBe(
        "groceries",
      );
      expect(getCategoryFromDescription("Mike's Discount Foods")).toBe(
        "groceries",
      );
      expect(getCategoryFromDescription("Cub Foods - Coon Rapids")).toBe(
        "groceries",
      );
      expect(getCategoryFromDescription("Coborns")).toBe("groceries");
      expect(getCategoryFromDescription("Coborns Superstore")).toBe("groceries");
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

    it("should split medical into chiropractic, dental, and medical", () => {
      expect(getCategoryFromDescription("Family First Chiropractic")).toBe(
        "chiropractic",
      );
      expect(getCategoryFromDescription("Abeler Chiropractic Clinic")).toBe(
        "chiropractic",
      );
      expect(getCategoryFromDescription("Ramsey Dental")).toBe("dental");
      expect(getCategoryFromDescription("Park Dental")).toBe("dental");
      expect(getCategoryFromDescription("Straight Smiles Orthodontist")).toBe(
        "dental",
      );
      expect(getCategoryFromDescription("Allina Health")).toBe("medical");
      expect(getCategoryFromDescription("Quest Diagnostics")).toBe("medical");
      expect(getCategoryFromDescription("CVS Pharmacy")).toBe("medical");
      expect(getCategoryFromDescription("Walgreens")).toBe("medical");
    });

    it("should categorize hospital cafeteria as restaurant not medical", () => {
      expect(getCategoryFromDescription("Mercy Hospital Cafeteria")).toBe(
        "restaurant",
      );
    });

    it("should categorize local restaurants correctly", () => {
      expect(getCategoryFromDescription("Culvers")).toBe("restaurant");
      expect(getCategoryFromDescription("Five Guys")).toBe("restaurant");
      expect(getCategoryFromDescription("Willy McCoys")).toBe("restaurant");
      expect(getCategoryFromDescription("Truffles And Tortes")).toBe("restaurant");
    });

    it("should categorize transportation correctly", () => {
      expect(getCategoryFromDescription("Lyft Rideshare")).toBe("transportation");
      expect(getCategoryFromDescription("Uber Rideshare")).toBe("transportation");
      expect(getCategoryFromDescription("Navan Trip Fee")).toBe("transportation");
      expect(getCategoryFromDescription("Delta Airlines")).toBe("transportation");
      expect(getCategoryFromDescription("Enterprise Rent-A-Car")).toBe(
        "transportation",
      );
    });

    it("should categorize transfers correctly", () => {
      expect(getCategoryFromDescription("Transfer Deposit")).toBe("transfer");
      expect(getCategoryFromDescription("Transfer Withdrawal")).toBe("transfer");
      expect(getCategoryFromDescription("Online Transfer")).toBe("transfer");
    });

    it("should categorize hotels as lodging", () => {
      expect(getCategoryFromDescription("Sheraton Fort Worth")).toBe("lodging");
      expect(getCategoryFromDescription("Marriott Marquis Houston")).toBe(
        "lodging",
      );
      expect(getCategoryFromDescription("Holiday Inn Express")).toBe("lodging");
      expect(getCategoryFromDescription("Courtyard By Marriott")).toBe("lodging");
    });

    it("should categorize home improvement stores correctly", () => {
      expect(getCategoryFromDescription("Menards - Coon Rapids")).toBe(
        "home_improvement",
      );
      expect(getCategoryFromDescription("Home Depot")).toBe("home_improvement");
      expect(getCategoryFromDescription("Lowes")).toBe("home_improvement");
    });

    it("should categorize gym memberships correctly", () => {
      expect(getCategoryFromDescription("Xperience Fitness")).toBe(
        "gym_membership",
      );
      expect(getCategoryFromDescription("Lifetime Fitness")).toBe(
        "gym_membership",
      );
    });

    it("should categorize online/AI subscriptions as online", () => {
      expect(getCategoryFromDescription("Claude.ai Subscription")).toBe("online");
      expect(getCategoryFromDescription("OpenAI ChatGPT Subscription")).toBe(
        "online",
      );
      expect(getCategoryFromDescription("Mullvad VPN")).toBe("online");
    });

    it("should categorize dollar tree and thrift stores as shopping", () => {
      expect(getCategoryFromDescription("Dollar Tree")).toBe("shopping");
      expect(getCategoryFromDescription("Dollar Tree - Anoka")).toBe("shopping");
      expect(getCategoryFromDescription("Goodwill")).toBe("shopping");
      expect(getCategoryFromDescription("Savers")).toBe("shopping");
      expect(getCategoryFromDescription("T.J. Maxx - Coon Rapids")).toBe(
        "shopping",
      );
    });

    it("should categorize school fees correctly", () => {
      expect(getCategoryFromDescription("Anoka-Hennepin School District")).toBe(
        "school_fee",
      );
    });
  });
});
