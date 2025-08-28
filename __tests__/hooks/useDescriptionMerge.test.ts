import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Module under test
import useDescriptionMerge from "../../hooks/useDescriptionMerge";

// Mock next/router
jest.mock("next/router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: "/",
    route: "/",
    asPath: "/",
    query: {},
  }),
}));

const createClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

const createWrapper = (client: QueryClient) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client },
      children as any,
    );
  };

describe("useDescriptionMerge", () => {
  afterEach(() => {
    // @ts-ignore
    global.fetch && (global.fetch as jest.Mock).mockReset?.();
  });

  it("posts merge payload and resolves on success", async () => {
    const client = createClient();

    // Arrange
    const payload = { sourceNames: ["A", "B"], targetName: "C" };
    // Mock success
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );

    const { result } = renderHook(() => useDescriptionMerge(), {
      wrapper: createWrapper(client),
    });

    // Act
    const res = await result.current.mutateAsync(payload);

    // Assert
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/description/merge",
      expect.objectContaining({ method: "POST" }),
    );
    expect(res).toEqual({ ok: true });
  });

  it("surfaces API error body", async () => {
    const client = createClient();
    const payload = { sourceNames: ["A"], targetName: "B" };

    // Create a mock response where statusText contains the expected error
    const mockResponse = {
      ok: false,
      status: 400,
      statusText: "Bad merge",
      json: jest.fn().mockResolvedValue({}), // No response field
    };

    global.fetch = jest.fn().mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useDescriptionMerge(), {
      wrapper: createWrapper(client),
    });

    await expect(result.current.mutateAsync(payload)).rejects.toThrow(
      /Bad merge/,
    );
  });
});
