import { QueryClient } from "@tanstack/react-query";
import {
  CacheUpdateStrategies,
  QueryKeys,
  getAccountKey,
  getTotalsKey,
} from "../../utils/cacheUtils";

describe("cacheUtils", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe("CacheUpdateStrategies.addToList", () => {
    it("should add item to start of existing list", () => {
      const existingData = [
        { id: 1, name: "item1" },
        { id: 2, name: "item2" },
      ];
      const newItem = { id: 3, name: "item3" };

      queryClient.setQueryData(["test"], existingData);

      CacheUpdateStrategies.addToList(queryClient, ["test"], newItem, "start");

      const updatedData = queryClient.getQueryData(["test"]);
      expect(updatedData).toEqual([newItem, ...existingData]);
    });

    it("should add item to end of existing list", () => {
      const existingData = [
        { id: 1, name: "item1" },
        { id: 2, name: "item2" },
      ];
      const newItem = { id: 3, name: "item3" };

      queryClient.setQueryData(["test"], existingData);

      CacheUpdateStrategies.addToList(queryClient, ["test"], newItem, "end");

      const updatedData = queryClient.getQueryData(["test"]);
      expect(updatedData).toEqual([...existingData, newItem]);
    });

    it("should default to adding at start", () => {
      const existingData = [{ id: 1, name: "item1" }];
      const newItem = { id: 2, name: "item2" };

      queryClient.setQueryData(["test"], existingData);

      CacheUpdateStrategies.addToList(queryClient, ["test"], newItem);

      const updatedData = queryClient.getQueryData<typeof existingData>([
        "test",
      ]);
      expect(updatedData![0]).toEqual(newItem);
    });

    it("should create new array when no existing data", () => {
      const newItem = { id: 1, name: "item1" };

      CacheUpdateStrategies.addToList(queryClient, ["test"], newItem);

      const updatedData = queryClient.getQueryData(["test"]);
      expect(updatedData).toEqual([newItem]);
    });

    it("should work with readonly query keys", () => {
      const queryKey = QueryKeys.account();
      const newItem = { id: 1, name: "account1" };

      CacheUpdateStrategies.addToList(queryClient, queryKey, newItem);

      const updatedData = queryClient.getQueryData(queryKey);
      expect(updatedData).toEqual([newItem]);
    });
  });

  describe("CacheUpdateStrategies.updateInList", () => {
    it("should update matching item in list", () => {
      const existingData = [
        { id: 1, name: "item1" },
        { id: 2, name: "item2" },
        { id: 3, name: "item3" },
      ];
      const updatedItem = { id: 2, name: "updated_item2" };

      queryClient.setQueryData(["test"], existingData);

      CacheUpdateStrategies.updateInList(
        queryClient,
        ["test"],
        updatedItem,
        "id",
      );

      const updatedData = queryClient.getQueryData<typeof existingData>([
        "test",
      ]);
      expect(updatedData).toEqual([
        { id: 1, name: "item1" },
        { id: 2, name: "updated_item2" },
        { id: 3, name: "item3" },
      ]);
    });

    it("should not modify non-matching items", () => {
      const existingData = [
        { id: 1, name: "item1" },
        { id: 2, name: "item2" },
      ];
      const updatedItem = { id: 2, name: "updated" };

      queryClient.setQueryData(["test"], existingData);

      CacheUpdateStrategies.updateInList(
        queryClient,
        ["test"],
        updatedItem,
        "id",
      );

      const updatedData = queryClient.getQueryData<typeof existingData>([
        "test",
      ]);
      expect(updatedData![0]).toEqual(existingData[0]); // First item unchanged
    });

    it("should invalidate queries when no existing data", () => {
      const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");
      const updatedItem = { id: 1, name: "item1" };

      CacheUpdateStrategies.updateInList(
        queryClient,
        ["test"],
        updatedItem,
        "id",
      );

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["test"] });
    });

    it("should work with different id keys", () => {
      const existingData = [
        { guid: "abc", value: 100 },
        { guid: "def", value: 200 },
      ];
      const updatedItem = { guid: "abc", value: 150 };

      queryClient.setQueryData(["test"], existingData);

      CacheUpdateStrategies.updateInList(
        queryClient,
        ["test"],
        updatedItem,
        "guid",
      );

      const updatedData = queryClient.getQueryData<typeof existingData>([
        "test",
      ]);
      expect(updatedData![0].value).toBe(150);
    });

    it("should work with readonly query keys", () => {
      const queryKey = QueryKeys.category();
      const existingData = [{ id: 1, name: "cat1" }];
      const updatedItem = { id: 1, name: "updated" };

      queryClient.setQueryData(queryKey, existingData);

      CacheUpdateStrategies.updateInList(
        queryClient,
        queryKey,
        updatedItem,
        "id",
      );

      const updatedData = queryClient.getQueryData(queryKey);
      expect(updatedData).toEqual([updatedItem]);
    });
  });

  describe("CacheUpdateStrategies.removeFromList", () => {
    it("should remove matching item from list", () => {
      const existingData = [
        { id: 1, name: "item1" },
        { id: 2, name: "item2" },
        { id: 3, name: "item3" },
      ];
      const itemToRemove = { id: 2, name: "item2" };

      queryClient.setQueryData(["test"], existingData);

      CacheUpdateStrategies.removeFromList(
        queryClient,
        ["test"],
        itemToRemove,
        "id",
      );

      const updatedData = queryClient.getQueryData<typeof existingData>([
        "test",
      ]);
      expect(updatedData).toEqual([
        { id: 1, name: "item1" },
        { id: 3, name: "item3" },
      ]);
      expect(updatedData).toHaveLength(2);
    });

    it("should do nothing if no existing data", () => {
      const itemToRemove = { id: 1, name: "item1" };

      CacheUpdateStrategies.removeFromList(
        queryClient,
        ["test"],
        itemToRemove,
        "id",
      );

      const updatedData = queryClient.getQueryData(["test"]);
      expect(updatedData).toBeUndefined();
    });

    it("should do nothing if item not found", () => {
      const existingData = [
        { id: 1, name: "item1" },
        { id: 2, name: "item2" },
      ];
      const itemToRemove = { id: 99, name: "nonexistent" };

      queryClient.setQueryData(["test"], existingData);

      CacheUpdateStrategies.removeFromList(
        queryClient,
        ["test"],
        itemToRemove,
        "id",
      );

      const updatedData = queryClient.getQueryData(["test"]);
      expect(updatedData).toEqual(existingData);
    });

    it("should work with different id keys", () => {
      const existingData = [
        { accountName: "chase_brian", balance: 1000 },
        { accountName: "savings_account", balance: 5000 },
      ];
      const itemToRemove = { accountName: "chase_brian", balance: 1000 };

      queryClient.setQueryData(["test"], existingData);

      CacheUpdateStrategies.removeFromList(
        queryClient,
        ["test"],
        itemToRemove,
        "accountName",
      );

      const updatedData = queryClient.getQueryData<typeof existingData>([
        "test",
      ]);
      expect(updatedData).toHaveLength(1);
      expect(updatedData![0].accountName).toBe("savings_account");
    });
  });

  describe("CacheUpdateStrategies.invalidateRelated", () => {
    it("should invalidate multiple query keys", () => {
      const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

      CacheUpdateStrategies.invalidateRelated(queryClient, [
        ["account"],
        ["category"],
        ["transaction", "chase_brian"],
      ]);

      expect(invalidateSpy).toHaveBeenCalledTimes(3);
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["account"] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["category"] });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["transaction", "chase_brian"],
      });
    });

    it("should handle empty array", () => {
      const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

      CacheUpdateStrategies.invalidateRelated(queryClient, []);

      expect(invalidateSpy).not.toHaveBeenCalled();
    });

    it("should work with QueryKeys", () => {
      const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

      CacheUpdateStrategies.invalidateRelated(queryClient, [
        QueryKeys.account(),
        QueryKeys.category(),
        QueryKeys.totals("chase_brian"),
      ]);

      expect(invalidateSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe("CacheUpdateStrategies.updateTotals", () => {
    it("should update existing totals", () => {
      const existingTotals = { total: 1000, count: 10 };
      const updateFn = (old: typeof existingTotals) => ({
        ...old,
        total: old.total + 100,
        count: old.count + 1,
      });

      queryClient.setQueryData(["totals"], existingTotals);

      CacheUpdateStrategies.updateTotals(queryClient, ["totals"], updateFn);

      const updatedTotals = queryClient.getQueryData(["totals"]);
      expect(updatedTotals).toEqual({ total: 1100, count: 11 });
    });

    it("should invalidate when no existing data", () => {
      const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");
      const updateFn = jest.fn();

      CacheUpdateStrategies.updateTotals(queryClient, ["totals"], updateFn);

      expect(updateFn).not.toHaveBeenCalled();
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["totals"] });
    });

    it("should preserve other properties", () => {
      const existingTotals = {
        total: 1000,
        cleared: 500,
        pending: 500,
        accountName: "chase_brian",
      };

      queryClient.setQueryData(["totals"], existingTotals);

      CacheUpdateStrategies.updateTotals(queryClient, ["totals"], (old) => ({
        ...old,
        total: old.total + 100,
      }));

      const updatedTotals = queryClient.getQueryData<typeof existingTotals>([
        "totals",
      ]);
      expect(updatedTotals!.accountName).toBe("chase_brian");
      expect(updatedTotals!.cleared).toBe(500);
    });
  });

  describe("CacheUpdateStrategies.clearCaches", () => {
    it("should remove queries with specified prefixes", () => {
      queryClient.setQueryData(["account"], []);
      queryClient.setQueryData(["transaction"], []);
      queryClient.setQueryData(["category"], []);

      CacheUpdateStrategies.clearCaches(queryClient, [
        "account",
        "transaction",
      ]);

      expect(queryClient.getQueryData(["account"])).toBeUndefined();
      expect(queryClient.getQueryData(["transaction"])).toBeUndefined();
      expect(queryClient.getQueryData(["category"])).toEqual([]); // Not cleared
    });

    it("should handle empty prefix array", () => {
      queryClient.setQueryData(["test"], []);

      CacheUpdateStrategies.clearCaches(queryClient, []);

      expect(queryClient.getQueryData(["test"])).toEqual([]); // Still there
    });

    it("should clear nested queries with same prefix", () => {
      queryClient.setQueryData(["transaction"], []);
      queryClient.setQueryData(["transaction", "chase_brian"], []);
      queryClient.setQueryData(["transaction", "category", "gas"], []);

      CacheUpdateStrategies.clearCaches(queryClient, ["transaction"]);

      expect(queryClient.getQueryData(["transaction"])).toBeUndefined();
      // Note: removeQueries with prefix removes all nested queries
    });
  });

  describe("QueryKeys", () => {
    it("should provide readonly query keys", () => {
      const accountKey = QueryKeys.account();
      expect(accountKey).toEqual(["account"]);
      // TypeScript ensures it's readonly at compile time
    });

    it("should provide account keys", () => {
      expect(QueryKeys.account()).toEqual(["account"]);
      expect(QueryKeys.accountGql()).toEqual(["accountsGQL"]);
    });

    it("should provide category keys", () => {
      expect(QueryKeys.category()).toEqual(["category"]);
      expect(QueryKeys.categoryGql()).toEqual(["categoriesGQL"]);
    });

    it("should provide description keys", () => {
      expect(QueryKeys.description()).toEqual(["description"]);
      expect(QueryKeys.descriptionGql()).toEqual(["descriptionsGQL"]);
    });

    it("should provide parameter keys", () => {
      expect(QueryKeys.parameter()).toEqual(["parameter"]);
      expect(QueryKeys.parameterGql()).toEqual(["parametersGQL"]);
    });

    it("should provide payment keys", () => {
      expect(QueryKeys.payment()).toEqual(["payment"]);
      expect(QueryKeys.paymentGql()).toEqual(["paymentsGQL"]);
      expect(QueryKeys.paymentRequired()).toEqual(["paymentRequired"]);
    });

    it("should provide transfer keys", () => {
      expect(QueryKeys.transfer()).toEqual(["transfer"]);
      expect(QueryKeys.transferGql()).toEqual(["transfersGQL"]);
    });

    it("should provide transaction keys with parameters", () => {
      expect(QueryKeys.transactionByAccount("chase_brian")).toEqual([
        "transaction",
        "chase_brian",
      ]);

      expect(QueryKeys.transactionByCategory("gas")).toEqual([
        "transaction",
        "category",
        "gas",
      ]);

      expect(QueryKeys.transactionByDescription("costco")).toEqual([
        "transaction",
        "description",
        "costco",
      ]);
    });

    it("should provide pending transaction keys", () => {
      expect(QueryKeys.pendingTransaction()).toEqual(["pendingTransaction"]);
    });

    it("should provide medical expense keys", () => {
      expect(QueryKeys.medicalExpense()).toEqual(["medicalExpense"]);
    });

    it("should provide family member keys", () => {
      expect(QueryKeys.familyMember()).toEqual(["familyMember"]);
    });

    it("should provide validation amount keys", () => {
      expect(QueryKeys.validationAmount("testAccount")).toEqual([
        "validationAmount",
        "testAccount",
      ]);
      expect(QueryKeys.validationAmountAll("testAccount")).toEqual([
        "validationAmount",
        "testAccount",
        "all",
      ]);
    });

    it("should provide totals keys with parameters", () => {
      expect(QueryKeys.totals("chase_brian")).toEqual([
        "totals",
        "chase_brian",
      ]);
      expect(QueryKeys.totalsPerAccount()).toEqual(["totalsPerAccount"]);
    });

    it("should provide spending trends keys", () => {
      expect(QueryKeys.spendingTrends()).toEqual(["spendingTrends"]);
    });

    it("should provide user keys", () => {
      expect(QueryKeys.user()).toEqual(["user"]);
      expect(QueryKeys.me()).toEqual(["me"]);
    });
  });

  describe("getAccountKey", () => {
    it("should return transaction key for account", () => {
      const key = getAccountKey("chase_brian");
      expect(key).toEqual(["transaction", "chase_brian"]);
    });

    it("should be backwards compatible", () => {
      // Test that old code using getAccountKey still works
      const key = getAccountKey("savings_account");
      queryClient.setQueryData(key, [{ id: 1 }]);

      const data = queryClient.getQueryData(key);
      expect(data).toEqual([{ id: 1 }]);
    });

    it("should match QueryKeys.transactionByAccount", () => {
      const accountName = "chase_brian";
      expect(getAccountKey(accountName)).toEqual(
        QueryKeys.transactionByAccount(accountName),
      );
    });
  });

  describe("getTotalsKey", () => {
    it("should return totals key for account", () => {
      const key = getTotalsKey("chase_brian");
      expect(key).toEqual(["totals", "chase_brian"]);
    });

    it("should be backwards compatible", () => {
      const key = getTotalsKey("savings_account");
      queryClient.setQueryData(key, { total: 5000 });

      const data = queryClient.getQueryData(key);
      expect(data).toEqual({ total: 5000 });
    });

    it("should match QueryKeys.totals", () => {
      const accountName = "chase_brian";
      expect(getTotalsKey(accountName)).toEqual(QueryKeys.totals(accountName));
    });
  });

  describe("Integration: Real-world scenarios", () => {
    it("should handle account insert flow", () => {
      // Initial state
      const existingAccounts = [
        { accountNameOwner: "chase_brian", balance: 1000 },
      ];
      queryClient.setQueryData(QueryKeys.account(), existingAccounts);

      // Insert new account
      const newAccount = { accountNameOwner: "savings_account", balance: 5000 };
      CacheUpdateStrategies.addToList(
        queryClient,
        QueryKeys.account(),
        newAccount,
        "start",
      );

      const accounts = queryClient.getQueryData(QueryKeys.account());
      expect(accounts).toHaveLength(2);
      expect(accounts).toEqual([newAccount, ...existingAccounts]);
    });

    it("should handle transaction update with totals", () => {
      // Initial transaction state
      const transactions = [
        { guid: "abc", amount: 100, accountNameOwner: "chase_brian" },
        { guid: "def", amount: 200, accountNameOwner: "chase_brian" },
      ];
      queryClient.setQueryData(
        QueryKeys.transactionByAccount("chase_brian"),
        transactions,
      );

      // Initial totals
      const totals = { total: 300, cleared: 300, pending: 0 };
      queryClient.setQueryData(QueryKeys.totals("chase_brian"), totals);

      // Update transaction amount
      const updatedTransaction = { ...transactions[0], amount: 150 };
      CacheUpdateStrategies.updateInList(
        queryClient,
        QueryKeys.transactionByAccount("chase_brian"),
        updatedTransaction,
        "guid",
      );

      // Update totals
      CacheUpdateStrategies.updateTotals(
        queryClient,
        QueryKeys.totals("chase_brian"),
        (old) => ({
          ...old,
          total: old.total + 50, // Difference from 100 to 150
        }),
      );

      const updatedTransactions = queryClient.getQueryData(
        QueryKeys.transactionByAccount("chase_brian"),
      );
      const updatedTotals = queryClient.getQueryData<typeof totals>(
        QueryKeys.totals("chase_brian"),
      );

      expect(updatedTransactions[0].amount).toBe(150);
      expect(updatedTotals!.total).toBe(350);
    });

    it("should handle account delete with cache cleanup", () => {
      const accounts = [
        { accountNameOwner: "chase_brian", balance: 1000 },
        { accountNameOwner: "savings_account", balance: 5000 },
      ];
      queryClient.setQueryData(QueryKeys.account(), accounts);

      // Delete account
      const accountToDelete = accounts[0];
      CacheUpdateStrategies.removeFromList(
        queryClient,
        QueryKeys.account(),
        accountToDelete,
        "accountNameOwner",
      );

      // Invalidate related queries
      CacheUpdateStrategies.invalidateRelated(queryClient, [
        QueryKeys.transactionByAccount("chase_brian"),
        QueryKeys.totals("chase_brian"),
      ]);

      const updatedAccounts = queryClient.getQueryData(QueryKeys.account());
      expect(updatedAccounts).toHaveLength(1);
      expect(updatedAccounts[0].accountNameOwner).toBe("savings_account");
    });
  });
});
