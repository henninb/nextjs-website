import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import useTotalsFetch from "../../hooks/useTotalsFetch";
import Totals from "../../model/Totals";

// Setup MSW server for Node environment
const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Create a fresh QueryClient for each test
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

const createWrapper =
  (queryClient: QueryClient) =>
  ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

describe("useTotalsFetch", () => {
  it("should fetch totals successfully", async () => {
    const queryClient = createTestQueryClient();

    const mockTotals: Totals = {
      totals: 1500.50,
      totalsFuture: 2000.75,
      totalsCleared: 1200.25,
      totalsOutstanding: 300.25,
    };

    server.use(
      http.get("https://finance.bhenning.com/api/account/totals", () => {
        return HttpResponse.json(mockTotals, { status: 200 });
      }),
    );

    const { result } = renderHook(() => useTotalsFetch(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockTotals);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it("should handle 404 errors and return dummy data", async () => {
    const queryClient = createTestQueryClient();

    server.use(
      http.get("https://finance.bhenning.com/api/account/totals", () => {
        return HttpResponse.json(
          { message: "Not found" },
          { status: 404 },
        );
      }),
    );

    const consoleSpy = jest.spyOn(console, "log");

    const { result } = renderHook(() => useTotalsFetch(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    // Should return dummy data when 404
    expect(result.current.data).toBeDefined();
    expect(consoleSpy).toHaveBeenCalledWith("Resource not found (404).");
    expect(consoleSpy).toHaveBeenCalledWith("Error fetching totals data:", expect.anything());

    consoleSpy.mockRestore();
  });

  it("should handle 500 server errors and return dummy data", async () => {
    const queryClient = createTestQueryClient();

    server.use(
      http.get("https://finance.bhenning.com/api/account/totals", () => {
        return HttpResponse.json(
          { message: "Internal server error" },
          { status: 500 },
        );
      }),
    );

    const consoleSpy = jest.spyOn(console, "log");

    const { result } = renderHook(() => useTotalsFetch(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    // Should return dummy data on error
    expect(result.current.data).toBeDefined();
    expect(consoleSpy).toHaveBeenCalledWith("Error fetching totals data:", expect.anything());

    consoleSpy.mockRestore();
  });

  it("should handle network errors and return dummy data", async () => {
    const queryClient = createTestQueryClient();

    server.use(
      http.get("https://finance.bhenning.com/api/account/totals", () => {
        throw new Error("Network failure");
      }),
    );

    const consoleSpy = jest.spyOn(console, "log");

    const { result } = renderHook(() => useTotalsFetch(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    // Should return dummy data on network error
    expect(result.current.data).toBeDefined();
    expect(consoleSpy).toHaveBeenCalledWith("Error fetching totals data:", expect.anything());

    consoleSpy.mockRestore();
  });

  it("should log errors when query has error state", async () => {
    const queryClient = createTestQueryClient();

    server.use(
      http.get("https://finance.bhenning.com/api/account/totals", () => {
        throw new Error("Persistent error");
      }),
    );

    const consoleSpy = jest.spyOn(console, "log");

    const { result } = renderHook(() => useTotalsFetch(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Should have logged the fetch error
    expect(consoleSpy).toHaveBeenCalledWith("Error fetching totals data:", expect.anything());

    consoleSpy.mockRestore();
  });

  it("should include correct headers in request", async () => {
    const queryClient = createTestQueryClient();

    const mockTotals: Totals = {
      totals: 100.0,
      totalsFuture: 200.0,
      totalsCleared: 150.0,
      totalsOutstanding: 50.0,
    };

    let capturedHeaders: any;

    server.use(
      http.get("https://finance.bhenning.com/api/account/totals", ({ request }) => {
        capturedHeaders = Object.fromEntries(request.headers.entries());
        return HttpResponse.json(mockTotals, { status: 200 });
      }),
    );

    const { result } = renderHook(() => useTotalsFetch(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify correct headers were sent
    expect(capturedHeaders["content-type"]).toBe("application/json");
    expect(capturedHeaders["accept"]).toBe("application/json");
  });

  it("should use payment_required as query key", async () => {
    const queryClient = createTestQueryClient();

    const mockTotals: Totals = {
      totals: 100.0,
      totalsFuture: 200.0,
      totalsCleared: 150.0,
      totalsOutstanding: 50.0,
    };

    server.use(
      http.get("https://finance.bhenning.com/api/account/totals", () => {
        return HttpResponse.json(mockTotals, { status: 200 });
      }),
    );

    const { result } = renderHook(() => useTotalsFetch(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify data was cached with the correct key
    const cachedData = queryClient.getQueryData(["payment_required"]);
    expect(cachedData).toEqual(mockTotals);
  });

  it("should return object structure from dummy data on error", async () => {
    const queryClient = createTestQueryClient();

    server.use(
      http.get("https://finance.bhenning.com/api/account/totals", () => {
        return HttpResponse.json(
          { message: "Unauthorized" },
          { status: 401 },
        );
      }),
    );

    const { result } = renderHook(() => useTotalsFetch(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Should return dummy totals (object format)
    expect(typeof result.current.data).toBe("object");
    expect(result.current.data).toBeDefined();
    expect(result.current.data).toHaveProperty("totals");
    expect(result.current.data).toHaveProperty("totalsFuture");
    expect(result.current.data).toHaveProperty("totalsCleared");
    expect(result.current.data).toHaveProperty("totalsOutstanding");
  });
});