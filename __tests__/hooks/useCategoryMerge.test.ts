import React from "react";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import useCategoryMerge from "../../hooks/useCategoryMerge";


// Mock the useAuth hook

// Mock CSRF utilities
jest.mock("../../utils/csrf", () => ({
  getCsrfHeaders: jest.fn().mockResolvedValue({}),
  getCsrfToken: jest.fn().mockResolvedValue(null),
  fetchCsrfToken: jest.fn().mockResolvedValue(undefined),
  clearCsrfToken: jest.fn(),
  initCsrfToken: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../components/AuthProvider", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    loading: false,
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
  }),
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
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

describe("useCategoryMerge", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  afterEach(() => {
    // @ts-ignore
    global.fetch && (global.fetch as jest.Mock).mockReset?.();
  });

  it("posts merge payload and resolves on success", async () => {
    const client = createClient();

    const payload = { sourceNames: ["A", "B"], targetName: "C" };
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );

    const { result } = renderHook(() => useCategoryMerge(), {
      wrapper: createWrapper(client),
    });

    const res = await result.current.mutateAsync(payload);

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/category/merge",
      expect.objectContaining({ method: "POST" }),
    );
    expect(res).toStrictEqual({ ok: true });
  });

  it("surfaces API error body or status text", async () => {
    const client = createClient();
    const payload = { sourceNames: ["A"], targetName: "B" };

    // Mock error response using Response object
    global.fetch = jest.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Bad merge" }), {
        status: 400,
        statusText: "Bad Request",
      }),
    );

    const { result } = renderHook(() => useCategoryMerge(), {
      wrapper: createWrapper(client),
    });

    await expect(result.current.mutateAsync(payload)).rejects.toThrow();
  });
});
