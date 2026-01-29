// Category mapping utility for dynamic transaction categorization
// Updated with patterns from recent 12-month transaction history
export function getCategoryFromDescription(description: string): string {
  const desc = description.toLowerCase().trim();

  // Check for paycheck/salary transactions first (before other categories)
  if (
    desc.includes("direct deposit") ||
    desc.includes("payroll") ||
    desc.includes("salary")
  ) {
    return "paycheck";
  }

  // Generic payment/income transactions
  if (
    desc.includes("electronic payment received") ||
    desc.includes("payment received") ||
    desc.includes("ach credit")
  ) {
    return "payment";
  }

  // Interest income
  if (desc.includes("interest")) {
    return "interest";
  }

  // Check for gas stations first (before other categories to catch Costco Gas, Walmart Gas, etc.)
  if (
    desc.includes(" gas ") ||
    desc.includes(" gas#") ||
    desc.startsWith("gas ") ||
    desc.endsWith(" gas") ||
    desc.includes("gas stop") ||
    desc.includes("gas station") ||
    desc.includes("shell") ||
    desc.includes("exxon") ||
    (desc.includes("mobil") && !desc.includes("t-mobile") && !desc.includes("tmobile")) ||
    desc.includes("chevron") ||
    desc.includes("texaco") ||
    desc.includes("fuel") ||
    desc.includes("gasoline") ||
    desc.includes("speedway") ||
    desc.includes("wawa") ||
    desc.includes("sunoco") ||
    desc.includes("marathon") ||
    desc.includes("bill's superette") ||
    desc.includes("bills superette") ||
    desc.includes("superamerica") ||
    desc.includes("holiday station") ||
    desc.includes("holiday stationstore") ||
    desc.startsWith("holiday") ||
    desc.includes("kwik trip") ||
    desc.includes("caseys") ||
    desc.includes("casey's") ||
    desc.includes("valero") ||
    desc.includes("thortons") ||
    desc.includes("thorntons") ||
    desc.includes("get go") ||
    desc.includes("getgo") ||
    desc.includes("pilot") ||
    desc.includes("loves") ||
    desc.includes("lovs") ||
    desc.includes("rocket") ||
    desc.includes("pdq") ||
    desc.includes("ez stop") ||
    (desc.includes("bp") && !desc.includes("subway"))
  ) {
    return "fuel";
  }

  // Costco - specific category (but NOT Costco Gas, which is caught above)
  if (desc.includes("costco")) {
    return "costco";
  }

  // Target - specific category
  if (desc.includes("target")) {
    return "target";
  }

  // Garbage/waste services (check before utilities to avoid "curbeside" matching elsewhere)
  if (
    desc.includes("solid waste") ||
    desc.includes("curbeside") ||
    desc.includes("curbside waste") ||
    desc.includes("walters recycling") ||
    desc.includes("allied waste") ||
    desc.includes("republic services") ||
    desc.includes("waste management")
  ) {
    return "garbage";
  }

  // Utilities (specific utility companies)
  if (
    desc.includes("centerpoint energy") ||
    desc.includes("xcel energy") ||
    desc.includes("connexus energy") ||
    desc.includes("northern states power") ||
    (desc.startsWith("city of") && !desc.includes("cafe")) // city water bills
  ) {
    return "utilities";
  }

  // Transportation (check early to catch taxi, uber, etc.)
  if (
    desc.includes("uber") ||
    desc.includes("lyft") ||
    desc.includes("taxi") ||
    desc.includes("rideshare") ||
    desc.includes("curb") || // for "Curb Las Vegas Taxi"
    desc.includes(" bus ") ||
    desc.startsWith("bus ") ||
    desc.endsWith(" bus") ||
    desc === "bus" ||
    desc.includes("parking") ||
    desc.includes("toll") ||
    desc.includes("tvm ") || // transit vending machine
    (desc.includes("trp") && desc.includes("fee")) || // for "Nvn Trp Fee" (trip fee)
    (desc.includes("trip") && desc.includes("fee")) || // for "Trip Fee"
    (desc.includes("navan") && desc.includes("fee"))
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
    desc.includes("taco john") ||
    (desc.includes("subway") && !desc.includes("subway system")) || // Subway restaurant, not subway transport
    desc.includes("starbucks") ||
    desc.includes("dunkin") ||
    desc.includes("chipotle") ||
    desc.includes("wendy") ||
    desc.includes("dominos") ||
    desc.includes("domino's") ||
    desc.includes("papa john") ||
    desc.includes("applebee") ||
    desc.includes("olive garden") ||
    desc.includes("chick-fil-a") ||
    desc.includes("chik-fil-a") ||
    desc.includes("chick fil a") ||
    desc.includes("chickfila") ||
    desc.includes("panera") ||
    desc.includes("cafe") ||
    desc.includes("cafeteria") ||
    desc.includes("coffee") ||
    desc.includes("caribou") ||
    desc.includes("slice") ||
    desc.includes("diner") ||
    desc.includes("grill") ||
    desc.includes("culvers") ||
    desc.includes("culver's") ||
    desc.includes("shake shack") ||
    desc.includes("sonic") ||
    desc.includes("tgi friday") ||
    desc.includes("fridays") ||
    desc.includes("akita sushi") ||
    desc.includes("sushi") ||
    desc.includes("willy mccoy") ||
    desc.includes("senor patron") ||
    desc.includes("chapala") ||
    desc.includes("mcduffs") ||
    desc.includes("king of the wing") ||
    desc.includes("five guys") ||
    desc.includes("arbys") ||
    desc.includes("arby's") ||
    desc.includes("jimmy john") ||
    desc.includes("dairy queen") ||
    desc.includes("little caesar") ||
    desc.includes("red robin") ||
    desc.includes("buffet") ||
    desc.includes("texas roadhouse") ||
    desc.includes("perkins") ||
    desc.includes("hardees") ||
    desc.includes("hardee's") ||
    desc.includes("potbelly") ||
    desc.includes("which wich") ||
    desc.includes("panda express")
  ) {
    return "restaurants";
  }

  // Grocery stores and supermarkets
  if (
    desc.includes("walmart") ||
    desc.includes("kroger") ||
    desc.includes("grocery") ||
    desc.includes("supermarket") ||
    desc.includes("safeway") ||
    desc.includes("whole foods") ||
    desc.includes("trader joe") ||
    desc.includes("food lion") ||
    desc.includes("publix") ||
    desc.includes("aldi") ||
    desc.includes("harris teeter") ||
    desc.includes("wegmans") ||
    desc.includes("mikes discount foods") ||
    desc.includes("mike's discount foods") ||
    desc.includes("cub foods") ||
    desc.includes("cubfoods") ||
    desc.includes("rainbow foods") ||
    desc.includes("coborns") ||
    desc.includes("coborn's") ||
    desc.includes("hyvee") ||
    desc.includes("hy-vee") ||
    desc.includes("hy vee") ||
    desc.includes("frys food") ||
    desc.includes("fry's food") ||
    desc.includes("fred meyer") ||
    desc.includes("imperfect foods") ||
    desc.includes("lawrence foods") ||
    desc.includes("county market") ||
    desc.includes("festival foods") ||
    desc.includes("lunds") ||
    desc.includes("byerlys") ||
    desc.includes("byerly's") ||
    desc.includes("jewel osco") ||
    desc.includes("albertsons") ||
    desc.includes("superone") ||
    desc.includes("super one") ||
    desc.includes("zups foods") ||
    desc.includes("cash wise")
  ) {
    return "groceries";
  }

  // Communication/bills (specific providers)
  if (
    desc.includes("t-mobile") ||
    desc.includes("tmobile") ||
    desc.includes("xfinity") ||
    desc.includes("comcast") ||
    desc.includes("verizon") ||
    desc.includes("at&t") ||
    desc.includes("spectrum")
  ) {
    return "communication";
  }

  // Entertainment
  if (
    desc.includes("netflix") ||
    desc.includes("hulu") ||
    desc.includes("disney+") ||
    desc.includes("spotify") ||
    desc.includes("cinema") ||
    desc.includes("theater") ||
    desc.includes("theatre") ||
    desc.includes("playstation") ||
    desc.includes("xbox") ||
    desc.includes("steam") ||
    desc.includes("redbox")
  ) {
    return "entertainment";
  }

  // Liquor stores
  if (
    desc.includes("liquor") ||
    desc.includes("wine") ||
    desc.includes("brewery") ||
    desc.includes("brewing")
  ) {
    return "liquor";
  }

  // Healthcare and medical
  if (
    desc.includes("pharmacy") ||
    desc.includes("doctor") ||
    desc.includes("medical") ||
    desc.includes("hospital") ||
    desc.includes("dentist") ||
    desc.includes("dental") ||
    desc.includes("clinic") ||
    desc.includes("cvs") ||
    desc.includes("walgreens") ||
    desc.includes("rite aid") ||
    desc.includes("chiropractic") ||
    desc.includes("chiropractor") ||
    desc.includes("allina") ||
    desc.includes("health partners") ||
    desc.includes("healthpartners") ||
    desc.includes("quest diagnostics") ||
    desc.includes("adapthealth") ||
    desc.includes("pediatric") ||
    desc.includes("orthodontist") ||
    desc.includes("optometrist") ||
    desc.includes("eye care") ||
    desc.includes("eye institute")
  ) {
    return "healthcare";
  }

  // Shopping and retail (specific stores only, avoid generic terms)
  if (
    desc.includes("amazon") ||
    desc.includes("best buy") ||
    desc.includes("home depot") ||
    desc.includes("lowes") ||
    desc.includes("lowe's") ||
    desc.includes("macy") ||
    desc.includes("nordstrom") ||
    desc.includes("kohls") ||
    desc.includes("kohl's") ||
    desc.includes("menards") ||
    desc.includes("clothing store") ||
    desc.includes("department store") ||
    desc.includes("retail store") ||
    desc.includes("five below") ||
    desc.includes("platos closet") ||
    desc.includes("plato's closet") ||
    desc.includes("skechers")
  ) {
    return "shopping";
  }

  // Banking and financial (be more specific to avoid trip fees)
  if (
    desc.includes("bank") ||
    desc.includes("atm") ||
    desc.includes("transfer") ||
    (desc.includes("fee") &&
      !desc.includes("trp") &&
      !desc.includes("trip") &&
      !desc.includes("navan") &&
      !desc.includes("school")) ||
    desc.includes("charge") ||
    desc.includes("deposit") ||
    desc.includes("withdrawal")
  ) {
    return "banking";
  }

  // Default to imported for unrecognized descriptions
  return "imported";
}
