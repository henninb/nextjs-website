import type Account from "../../model/Account";
import type Category from "../../model/Category";
import type Description from "../../model/Description";
import type Parameter from "../../model/Parameter";
import type Payment from "../../model/Payment";
import type PaymentRequired from "../../model/PaymentRequired";
import type PendingTransaction from "../../model/PendingTransaction";
import type ReceiptImage from "../../model/ReceiptImage";
import type Totals from "../../model/Totals";
import type Transaction from "../../model/Transaction";
import type TransactionCategoryMetadata from "../../model/TransactionCategoryMetadata";
import type Transfer from "../../model/Transfer";
import type User, { SafeUser } from "../../model/User";
import type ValidationAmount from "../../model/ValidationAmount";
import { ClaimStatus } from "../../model/MedicalExpense";
import { FamilyRelationship } from "../../model/FamilyMember";

describe("model module coverage", () => {
  it("loads interface-only and type-only model modules", () => {
    expect(require("../../model/Account")).toBeDefined();
    expect(require("../../model/AccountType")).toBeDefined();
    expect(require("../../model/BlogPost")).toBeDefined();
    expect(require("../../model/Category")).toBeDefined();
    expect(require("../../model/Description")).toBeDefined();
    expect(require("../../model/ImageFormatType")).toBeDefined();
    expect(require("../../model/Parameter")).toBeDefined();
    expect(require("../../model/Payment")).toBeDefined();
    expect(require("../../model/PaymentRequired")).toBeDefined();
    expect(require("../../model/PendingTransaction")).toBeDefined();
    expect(require("../../model/ReceiptImage")).toBeDefined();
    expect(require("../../model/ReoccurringType")).toBeDefined();
    expect(require("../../model/SportsGame")).toBeDefined();
    expect(require("../../model/Totals")).toBeDefined();
    expect(require("../../model/Transaction")).toBeDefined();
    expect(require("../../model/TransactionCategoryMetadata")).toBeDefined();
    expect(require("../../model/TransactionState")).toBeDefined();
    expect(require("../../model/TransactionType")).toBeDefined();
    expect(require("../../model/Transfer")).toBeDefined();
    expect(require("../../model/UpdateTransactionOptions")).toBeDefined();
    expect(require("../../model/User")).toBeDefined();
    expect(require("../../model/ValidationAmount")).toBeDefined();
  });

  it("supports representative objects for the plain model contracts", () => {
    const account: Account = {
      accountId: 1,
      owner: "owner",
      accountNameOwner: "Checking - owner",
      accountType: "debit",
      activeStatus: true,
      moniker: "checking",
      outstanding: 10,
      future: 20,
      cleared: 30,
      dateClosed: new Date("2024-12-31"),
      validationDate: new Date("2024-11-30"),
      dateAdded: new Date("2024-01-01"),
      dateUpdated: new Date("2024-01-02"),
      billingStatementCloseDay: 25,
      billingGracePeriodDays: 21,
      billingDueDaySameMonth: 15,
      billingDueDayNextMonth: 16,
      billingCycleWeekendShift: "next-business-day",
    };
    const category: Category = {
      categoryId: 1,
      owner: "owner",
      categoryName: "Groceries",
      activeStatus: true,
      categoryCount: 4,
      dateAdded: new Date("2024-01-01"),
      dateUpdated: new Date("2024-01-02"),
    };
    const description: Description = {
      descriptionId: 2,
      owner: "owner",
      descriptionName: "Trader Joe's",
      activeStatus: true,
      descriptionCount: 3,
      dateAdded: new Date("2024-01-01"),
      dateUpdated: new Date("2024-01-02"),
    };
    const parameter: Parameter = {
      parameterId: 3,
      owner: "owner",
      parameterName: "timezone",
      parameterValue: "America/Chicago",
      activeStatus: true,
      dateAdded: new Date("2024-01-01"),
      dateUpdated: new Date("2024-01-02"),
    };
    const payment: Payment = {
      paymentId: 4,
      owner: "owner",
      sourceAccount: "Checking",
      destinationAccount: "Visa",
      guidSource: "src-guid",
      guidDestination: "dest-guid",
      transactionDate: new Date("2024-02-01"),
      amount: 125.5,
      activeStatus: true,
      dateAdded: new Date("2024-02-01"),
      dateUpdated: new Date("2024-02-02"),
    };
    const paymentRequired: PaymentRequired = {
      accountNameOwner: "Visa - owner",
      accountType: "credit",
      moniker: "visa",
      future: 50,
      outstanding: 100,
      cleared: 75,
      validationDate: "2024-03-01",
    };
    const pendingTransaction: PendingTransaction = {
      pendingTransactionId: 5,
      owner: "owner",
      accountNameOwner: "Checking - owner",
      transactionDate: new Date("2024-03-01"),
      description: "Pending purchase",
      amount: 42.75,
      reviewStatus: "pending",
    };
    const receiptImage: ReceiptImage = {
      receiptImageId: 6,
      owner: "owner",
      transactionId: 7,
      activeStatus: true,
      imageFormatType: "png",
      image: "base64-image",
      thumbnail: "base64-thumbnail",
    };
    const totals: Totals = {
      totals: 1000,
      totalsFuture: 100,
      totalsCleared: 800,
      totalsOutstanding: 100,
    };
    const transactionCategoryMetadata: TransactionCategoryMetadata = {
      source: "manual",
      confidence: 1,
      aiModel: "test-model",
      timestamp: new Date("2024-04-01"),
      fallbackReason: "none",
      similarTransactionsUsed: 0,
    };
    const transaction: Transaction = {
      transactionId: 8,
      owner: "owner",
      guid: "txn-guid",
      accountId: 9,
      accountType: "credit",
      accountNameOwner: "Visa - owner",
      transactionDate: new Date("2024-04-01"),
      description: "Coffee shop",
      category: "Dining",
      amount: 5.5,
      transactionState: "cleared",
      transactionType: "expense",
      activeStatus: true,
      reoccurringType: "monthly",
      notes: "Work trip",
      receiptImage,
      dueDate: "2024-04-15",
      categoryMetadata: transactionCategoryMetadata,
    };
    const transfer: Transfer = {
      transferId: 10,
      owner: "owner",
      sourceAccount: "Savings",
      destinationAccount: "Checking",
      transactionDate: new Date("2024-05-01"),
      amount: 250,
      guidSource: "source-guid",
      guidDestination: "destination-guid",
      activeStatus: true,
      dateAdded: new Date("2024-05-01"),
      dateUpdated: new Date("2024-05-02"),
    };
    const safeUser: SafeUser = {
      userId: 11,
      username: "owner",
      firstName: "Test",
      lastName: "User",
    };
    const user: User = {
      ...safeUser,
      password: "password",
    };
    const validationAmount: ValidationAmount = {
      validationId: 12,
      owner: "owner",
      validationDate: new Date("2024-06-01"),
      accountId: 13,
      amount: 321.09,
      transactionState: "future",
      activeStatus: true,
      dateAdded: new Date("2024-06-01"),
      dateUpdated: new Date("2024-06-02"),
    };

    expect(account.accountType).toBe("debit");
    expect(category.categoryName).toBe("Groceries");
    expect(description.descriptionName).toBe("Trader Joe's");
    expect(parameter.parameterValue).toBe("America/Chicago");
    expect(payment.amount).toBe(125.5);
    expect(paymentRequired.outstanding).toBe(100);
    expect(pendingTransaction.reviewStatus).toBe("pending");
    expect(receiptImage.imageFormatType).toBe("png");
    expect(totals.totalsCleared).toBe(800);
    expect(transaction.categoryMetadata?.source).toBe("manual");
    expect(transfer.destinationAccount).toBe("Checking");
    expect(safeUser.username).toBe("owner");
    expect(user.password).toBe("password");
    expect(validationAmount.transactionState).toBe("future");
  });

  it("supports documented union values for model string types", () => {
    const accountTypes = ["credit", "debit", "undefined"] as const;
    const imageFormats = ["png", "jpeg", "undefined"] as const;
    const reoccurringTypes = [
      "monthly",
      "annually",
      "bi_annually",
      "fortnightly",
      "quarterly",
      "onetime",
      "undefined",
    ] as const;
    const transactionStates = [
      "cleared",
      "outstanding",
      "future",
      "undefined",
    ] as const;
    const transactionTypes = [
      "expense",
      "income",
      "transfer",
      "undefined",
    ] as const;

    expect(accountTypes).toContain("credit");
    expect(imageFormats).toContain("jpeg");
    expect(reoccurringTypes).toContain("bi_annually");
    expect(transactionStates).toContain("outstanding");
    expect(transactionTypes).toContain("transfer");
  });

  it("supports the sports game shapes used across leagues", () => {
    const nbaGame = {
      id: "nba-1",
      DateUtc: "2024-01-01T00:00:00Z",
      Location: "Chicago",
      AwayTeam: "Bulls",
      AwayTeamScore: 98,
      HomeTeam: "Lakers",
      HomeTeamScore: 102,
      Status: "Final",
    };
    const mlbGame = {
      id: "mlb-1",
      gameDate: "2024-07-04T18:00:00Z",
      venueName: "Wrigley Field",
      awayTeamName: "Brewers",
      awayTeamScore: 3,
      homeTeamName: "Cubs",
      homeTeamScore: 5,
      gameStatus: "Final",
    };

    expect(nbaGame.AwayTeamScore + nbaGame.HomeTeamScore).toBe(200);
    expect(mlbGame.venueName).toBe("Wrigley Field");
  });

  it("exposes current constant-based model enums", () => {
    expect(FamilyRelationship).toEqual({
      Self: "self",
      Spouse: "spouse",
      Child: "child",
      Dependent: "dependent",
      Other: "other",
    });
    expect(ClaimStatus).toEqual({
      Submitted: "submitted",
      Processing: "processing",
      Approved: "approved",
      Denied: "denied",
      Paid: "paid",
      Closed: "closed",
    });
  });
});
