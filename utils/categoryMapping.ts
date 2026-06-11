export function getCategoryFromDescription(description: string): string {
  const desc = description.toLowerCase().trim();

  // Paycheck / salary (check first — direct deposit is most commonly a paycheck)
  if (
    desc.includes("direct deposit") ||
    desc.includes("payroll") ||
    desc.includes("salary")
  ) {
    return "paycheck";
  }

  // Incoming payment / credit
  if (
    desc.includes("electronic payment received") ||
    desc.includes("payment received") ||
    desc.includes("ach credit")
  ) {
    return "payment";
  }

  // Bill pay — outgoing payment to a biller
  if (desc === "payment" || desc.startsWith("payment ")) {
    return "bill_pay";
  }

  // Interest income
  if (desc.includes("interest")) {
    return "interest";
  }

  // Rewards and cashback
  if (
    desc.includes("rewards") ||
    desc.includes("cashback") ||
    desc.includes("cash back") ||
    desc.includes("cash rewards") ||
    desc.includes("my deals cash back")
  ) {
    return "cashback";
  }

  // Account transfers (check before banking to avoid mis-classification)
  if (desc.includes("transfer")) {
    return "transfer";
  }

  // Gas / fuel stations (check before costco/target/walmart — they have gas stations too)
  if (
    desc.includes(" gas ") ||
    desc.includes(" gas#") ||
    desc.startsWith("gas ") ||
    desc.endsWith(" gas") ||
    desc.includes("gas stop") ||
    desc.includes("gas station") ||
    desc.includes("shell") ||
    desc.includes("exxon") ||
    (desc.includes("mobil") &&
      !desc.includes("t-mobile") &&
      !desc.includes("tmobile")) ||
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
    desc.includes("anoka gas stop") ||
    desc.includes("circle k") ||
    desc.includes("7-eleven") ||
    desc.includes("7 eleven") ||
    (desc.includes("bp") && !desc.includes("subway"))
  ) {
    return "fuel";
  }

  // Costco (after fuel — Costco Gas is caught above)
  if (desc.includes("costco")) {
    return "costco";
  }

  // target.com → online shopping (before general target check)
  if (desc.includes("target.com")) {
    return "online";
  }

  // Bullseye cafe (Target's in-store cafe) → restaurant, before target check
  if (desc.includes("bullseye cafe") || desc.includes("target bullseye")) {
    return "restaurant";
  }

  // Target physical stores
  if (desc.includes("target")) {
    return "target";
  }

  // Garbage / waste services
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

  // Utilities
  if (
    desc.includes("centerpoint energy") ||
    desc.includes("xcel energy") ||
    desc.includes("connexus energy") ||
    desc.includes("northern states power") ||
    (desc.startsWith("city of") && !desc.includes("cafe"))
  ) {
    return "utilities";
  }

  // Postage / shipping
  if (
    desc.includes("usps") ||
    desc.includes("post office") ||
    desc.includes("stamps.com") ||
    desc.includes("fedex") ||
    desc.startsWith("ups ")
  ) {
    return "postage";
  }

  // Lodging / hotels (before transportation to avoid holiday inn hitting holiday station fuel)
  if (
    desc.includes("sheraton") ||
    desc.includes("marriott") ||
    desc.includes("hilton") ||
    desc.includes("hyatt") ||
    desc.includes("courtyard") ||
    desc.includes("hampton inn") ||
    desc.includes("holiday inn") ||
    desc.includes("best western") ||
    desc.includes("radisson") ||
    desc.includes("embassy suites") ||
    desc.includes("doubletree") ||
    desc.includes("fairfield inn") ||
    desc.includes("comfort inn") ||
    desc.includes("la quinta") ||
    desc.includes("days inn") ||
    desc.includes("motel 6") ||
    desc.includes("airbnb") ||
    desc.includes("vrbo") ||
    desc.includes("condado")
  ) {
    return "lodging";
  }

  // Food delivery (check before uber/lyft → transportation)
  if (
    desc.includes("uber eats") ||
    desc.includes("doordash") ||
    desc.includes("grubhub") ||
    desc.includes("instacart")
  ) {
    return "restaurant";
  }

  // Transportation — rideshare, airlines, rentals, parking, taxis
  if (
    desc.includes("uber") ||
    desc.includes("lyft") ||
    desc.includes("taxi") ||
    desc.includes("rideshare") ||
    desc.includes("curb") ||
    desc.includes(" bus ") ||
    desc.startsWith("bus ") ||
    desc.endsWith(" bus") ||
    desc === "bus" ||
    desc.includes("parking") ||
    desc.includes("toll") ||
    desc.includes("tvm ") ||
    (desc.includes("trp") && desc.includes("fee")) ||
    (desc.includes("trip") && desc.includes("fee")) ||
    (desc.includes("navan") && desc.includes("fee")) ||
    desc.includes("delta airline") ||
    desc.includes("delta air ") ||
    desc.includes("american airlines") ||
    desc.includes("united airlines") ||
    desc.includes("southwest airlines") ||
    desc.includes("spirit airlines") ||
    desc.includes("frontier airlines") ||
    desc.includes("alaska airlines") ||
    desc.includes("sun country") ||
    desc.includes("enterprise rent") ||
    desc.includes("hertz") ||
    desc.includes("avis") ||
    desc.includes("budget car") ||
    desc.includes("national car") ||
    desc.startsWith("tsa ")
  ) {
    return "transportation";
  }

  // Chiropractic (before dental and medical)
  if (desc.includes("chiropractic") || desc.includes("chiropractor")) {
    return "chiropractic";
  }

  // Dental (before general medical)
  if (
    desc.includes("dental") ||
    desc.includes("dentist") ||
    desc.includes("orthodontist") ||
    desc.includes("orthodontics")
  ) {
    return "dental";
  }

  // Medical — pharmacies, clinics, hospitals
  if (
    desc.includes("pharmacy") ||
    desc.includes("farmacia") ||
    desc.includes("medical") ||
    (desc.includes("hospital") && !desc.includes("cafeteria")) ||
    desc.includes("clinic") ||
    desc.includes("cvs") ||
    desc.includes("walgreens") ||
    desc.includes("rite aid") ||
    desc.includes("allina") ||
    desc.includes("health partners") ||
    desc.includes("healthpartners") ||
    desc.includes("quest diagnostics") ||
    desc.includes("adapthealth") ||
    desc.includes("pediatric") ||
    desc.includes("optometrist") ||
    desc.includes("eye care") ||
    desc.includes("eye institute")
  ) {
    return "medical";
  }

  // Gym / fitness memberships
  if (
    desc.includes("lifetime fitness") ||
    desc.includes("xperience fitness") ||
    desc.includes("anytime fitness") ||
    desc.includes("planet fitness") ||
    desc.includes("ymca") ||
    desc.includes("gym membership")
  ) {
    return "gym_membership";
  }

  // Vehicle tabs / registration (MN DVS — check before automotive)
  if (desc.startsWith("dvs")) {
    return "vehicle_tabs";
  }

  // Automotive — repairs, tires, oil changes
  if (
    desc.includes("discount tire") ||
    desc.includes("tires plus") ||
    desc.includes("firestone") ||
    desc.includes("jiffy lube") ||
    desc.includes("oil change") ||
    desc.includes("take 5 oil") ||
    desc.includes("valvoline") ||
    desc.includes("midas") ||
    desc.includes("autozone") ||
    desc.includes("auto zone") ||
    desc.includes("o'reilly auto") ||
    desc.includes("napa auto") ||
    desc.includes("car wash")
  ) {
    return "automotive";
  }

  // Restaurants and dining
  if (
    desc.includes("mcdonalds") ||
    desc.includes("mcdonald's") ||
    desc.includes("pizza") ||
    desc.includes("restaurant") ||
    desc.includes("burger") ||
    desc.includes("kfc") ||
    desc.includes("taco bell") ||
    desc.includes("taco john") ||
    (desc.includes("subway") && !desc.includes("subway system")) ||
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
    desc.includes("panda express") ||
    desc.includes("aw sa wan") ||
    desc.includes("truffles and tortes") ||
    desc.includes("boulevard bar and grill") ||
    desc.includes("buffalo wild wings") ||
    desc.includes("crave") ||
    desc.includes("vending")
  ) {
    return "restaurant";
  }

  // Grocery stores and supermarkets
  if (
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
    desc.includes("cash wise") ||
    desc.includes("grass roots cooperative")
  ) {
    return "groceries";
  }

  // Home improvement (before general shopping)
  if (
    desc.includes("menards") ||
    desc.includes("home depot") ||
    desc.includes("homedepot") ||
    desc.includes("lowes") ||
    desc.includes("lowe's") ||
    desc.includes("ace hardware") ||
    desc.includes("true value")
  ) {
    return "home_improvement";
  }

  // Communication / phone / internet providers
  if (
    desc.includes("t-mobile") ||
    desc.includes("tmobile") ||
    desc.includes("xfinity") ||
    desc.includes("comcast") ||
    desc.includes("verizon") ||
    desc.includes("at&t") ||
    desc.includes("spectrum") ||
    desc.includes("centurylink") ||
    desc.includes("century link")
  ) {
    return "communication";
  }

  // Entertainment — streaming, events, media
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
    desc.includes("redbox") ||
    desc.includes("family video") ||
    desc.includes("star tribune") ||
    desc.includes("anoka county parks") ||
    desc.includes("anoka halloween") ||
    desc.includes("mid minnesota entertainment")
  ) {
    return "entertainment";
  }

  // Liquor stores and bars
  if (
    desc.includes("liquor") ||
    desc.includes("wine") ||
    desc.includes("brewery") ||
    desc.includes("brewing")
  ) {
    return "liquor";
  }

  // Online shopping, marketplaces, and software subscriptions
  if (
    desc.includes("amazon") ||
    desc.includes("ebay") ||
    desc.includes("aliexpress") ||
    desc.includes("newegg") ||
    desc.includes("tigerdirect") ||
    desc.includes("claude.ai") ||
    desc.includes("openai") ||
    desc.includes("perplexity") ||
    desc.includes("anthropic") ||
    desc.includes("mullvad") ||
    desc.includes("namecheap") ||
    desc.includes("gofantix") ||
    desc.includes("gofan") ||
    desc.includes("google play") ||
    desc.includes("apple.com/bill")
  ) {
    return "online";
  }

  // Shopping / retail
  if (
    desc.includes("walmart") ||
    desc.includes("best buy") ||
    desc.includes("macy") ||
    desc.includes("nordstrom") ||
    desc.includes("kohls") ||
    desc.includes("kohl's") ||
    desc.includes("five below") ||
    desc.includes("platos closet") ||
    desc.includes("plato's closet") ||
    desc.includes("skechers") ||
    desc.includes("dollar tree") ||
    desc.includes("goodwill") ||
    desc.includes("good will") ||
    desc.includes("savers") ||
    desc.includes("dicks sporting goods") ||
    desc.includes("dick's sporting goods") ||
    desc.includes("once upon a child") ||
    desc.includes("bath and body works") ||
    desc.includes("altar d state") ||
    desc.includes("t.j. maxx") ||
    desc.includes("tjmaxx") ||
    desc.includes("tj maxx") ||
    desc.includes("great clips") ||
    desc.includes("hobby lobby") ||
    desc.includes("old navy") ||
    desc.includes("ladybugs")
  ) {
    return "shopping";
  }

  // Donations
  if (
    (desc.includes("church") && !desc.includes("chicken")) ||
    desc.includes("donation") ||
    desc.includes("red cross") ||
    desc.includes("foundation") ||
    desc.includes("archdiocese")
  ) {
    return "donation";
  }

  // School fees
  if (
    desc.includes("school district") ||
    desc.includes("anoka-hennepin") ||
    desc.includes("anoka hennepin") ||
    desc.includes("tads")
  ) {
    return "school_fee";
  }

  // Banking and financial
  if (
    desc.includes("bank") ||
    desc.includes("atm") ||
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

  return "imported";
}
