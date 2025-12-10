import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useUser } from "../../hooks/useUser";


// Mock the useAuth hook
jest.mock("../../components/AuthProvider", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    loading: false,
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
  }),
}));

// React Query provider for testing
const createWrapper = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client },
      children as any,
    );
  };
};

describe("useUser", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("should fetch user data successfully", async () => {
    const mockUser = {
      id: 1,
      username: "testuser",
      email: "test@example.com",
      roles: ["user"],
    };

    // Mock the global fetch function
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(mockUser), { status: 200 }),
      );

    const { result } = renderHook(() => useUser(), {
      wrapper: createWrapper(),
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.user).toBe(undefined);
    expect(result.current.isError).toBeNull();

    // Wait for data to load
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.user).toStrictEqual(mockUser);
    expect(result.current.isError).toBeNull();

    // Restore original fetch
  });

  it("should include credentials in request", async () => {
    const mockUser = { id: 1, username: "test" };
    let fetchCall: any;

    // Mock the global fetch function and capture the call
    global.fetch = jest.fn().mockImplementation((url, options) => {
      fetchCall = { url, options };
      return Promise.resolve(
        new Response(JSON.stringify(mockUser), { status: 200 }),
      );
    });

    const { result } = renderHook(() => useUser(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Verify the request was made with credentials: 'include'
    expect(result.current.user).toBeDefined();
    expect(fetchCall.options.credentials).toBe("include");

    // Restore original fetch
  });
});
