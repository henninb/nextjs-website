import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useDescriptionInsert from "../../hooks/useDescriptionInsert";

// Mock fetch globally
global.fetch = jest.fn();

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
    logger: { log: console.log, warn: console.warn, error: () => {} },
  });

const createWrapper =
  (queryClient: QueryClient) =>
  ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

describe("useDescriptionInsert (validation)", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = createTestQueryClient();
  });

  it("rejects empty description name before fetch", async () => {
    const { result } = renderHook(() => useDescriptionInsert(), {
      wrapper: createWrapper(queryClient),
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({});

    result.current.mutate({ descriptionName: "" });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });
});

