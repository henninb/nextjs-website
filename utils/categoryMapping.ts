// Category mapping utility for dynamic transaction categorization
export function getCategoryFromDescription(description: string): string {
  const desc = description.toLowerCase().trim();

  // Check for gas stations first (before groceries) to handle "COSTCO GAS", "Walmart Gas"
  if (
    desc.includes(" gas ") ||
    desc.includes(" gas#") ||
    desc.startsWith("gas ") ||
    desc.endsWith(" gas") ||
    desc.includes(" gas station") ||
    desc.includes("shell") ||
    desc.includes("bp") ||
    desc.includes("exxon") ||
    desc.includes("mobil") ||
    desc.includes("chevron") ||
    desc.includes("texaco") ||
    desc.includes("fuel") ||
    desc.includes("gasoline") ||
    desc.includes("speedway") ||
    desc.includes("wawa") ||
    desc.includes("sunoco") ||
    desc.includes("marathon") ||
    desc.includes("bill's superette") ||
    desc.includes("bills superette")
  ) {
    return "fuel";
  }

  // Transportation (check early to catch taxi, uber, etc.)
  if (
    desc.includes("uber") ||
    desc.includes("lyft") ||
    desc.includes("taxi") ||
    desc.includes("curb") || // for "Curb Las Vegas Taxi"
    desc.includes(" bus ") ||
    desc.startsWith("bus ") ||
    desc.endsWith(" bus") ||
    desc === "bus" ||
    desc.includes("metro") ||
    desc.includes("parking") ||
    desc.includes("toll") ||
    (desc.includes("trp") && desc.includes("fee")) || // for "Nvn Trp Fee" (trip fee)
    (desc.includes("trip") && desc.includes("fee")) // for "Trip Fee"
  ) {
    return "transportation";
  }

  // Restaurants and dining (check before other categories to handle Subway, Slice, etc.)
  if (
    desc.includes("mcdonalds") ||
    desc.includes("mcdonald's") ||
    desc.includes("pizza") ||
    desc.includes("restaurant") ||
    desc.includes("burger") ||
    desc.includes("kfc") ||
    desc.includes("taco bell") ||
    (desc.includes("subway") && !desc.includes("subway system")) || // Subway restaurant, not subway transport
    desc.includes("starbucks") ||
    desc.includes("dunkin") ||
    desc.includes("chipotle") ||
    desc.includes("wendy's") ||
    desc.includes("dominos") ||
    desc.includes("papa john") ||
    desc.includes("applebee") ||
    desc.includes("olive garden") ||
    desc.includes("chick-fil-a") ||
    desc.includes("panera") ||
    desc.includes("cafe") ||
    desc.includes("coffee") ||
    desc.includes("slice") || // for "Slice Of Vegas"
    desc.includes("diner") ||
    desc.includes("grill")
  ) {
    return "restaurants";
  }

  // Grocery stores and supermarkets (moved after gas to avoid conflicts)
  if (
    desc.includes("walmart") ||
    desc.includes("kroger") ||
    desc.includes("grocery") ||
    desc.includes("supermarket") ||
    desc.includes("safeway") ||
    desc.includes("whole foods") ||
    desc.includes("trader joe") ||
    (desc.includes("costco") && !desc.includes(" gas")) || // Costco but not gas station
    desc.includes("food lion") ||
    desc.includes("publix") ||
    desc.includes("aldi") ||
    desc.includes("harris teeter") ||
    desc.includes("wegmans")
    // Removed "target" from here since it should be shopping
  ) {
    return "groceries";
  }

  // Bills and utilities (be more specific to avoid false matches)
  if (
    desc.includes("electric") ||
    desc.includes("electricity") ||
    desc.includes("water") ||
    desc.includes("utility") ||
    desc.includes("utilities") ||
    (desc.includes("bill") && !desc.includes("bill's")) || // "bill" but not "Bill's Store"
    desc.includes("internet") ||
    desc.includes("cable") ||
    desc.includes("phone") ||
    desc.includes("cell") ||
    desc.includes("wireless") ||
    desc.includes("verizon") ||
    desc.includes("at&t") ||
    desc.includes("tmobile") ||
    desc.includes("comcast") ||
    desc.includes("xfinity")
  ) {
    return "bills";
  }

  // Banking and financial (be more specific to avoid trip fees)
  if (
    desc.includes("bank") ||
    desc.includes("atm") ||
    desc.includes("transfer") ||
    (desc.includes("fee") && !desc.includes("trp") && !desc.includes("trip")) || // "fee" but not trip fees
    desc.includes("charge") ||
    desc.includes("deposit") ||
    desc.includes("withdrawal")
  ) {
    return "banking";
  }

  // Healthcare
  if (
    desc.includes("pharmacy") ||
    desc.includes("doctor") ||
    desc.includes("medical") ||
    desc.includes("hospital") ||
    desc.includes("dentist") ||
    desc.includes("clinic") ||
    desc.includes("cvs") ||
    desc.includes("walgreens") ||
    desc.includes("rite aid")
  ) {
    return "healthcare";
  }

  // Shopping and retail (specific stores only, avoid generic terms)
  if (
    desc.includes("amazon") ||
    desc.includes("target") || // Target should be shopping, not groceries
    desc.includes("best buy") ||
    desc.includes("home depot") ||
    desc.includes("lowes") ||
    desc.includes("macy") ||
    desc.includes("nordstrom") ||
    desc.includes("clothing store") ||
    desc.includes("department store") ||
    desc.includes("retail store")
  ) {
    return "shopping";
  }

  // Default to imported for unrecognized descriptions
  return "imported";
}
