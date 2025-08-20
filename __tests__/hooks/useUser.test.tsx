import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useUser } from "../../hooks/useUser";

// React Query provider for testing
const createWrapper = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

describe("useUser", () => {
  it("should fetch user data successfully", async () => {
    const mockUser = {
      id: 1,
      username: "testuser",
      email: "test@example.com",
      roles: ["user"],
    };

    // Mock the global fetch function
    const originalFetch = global.fetch;
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

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isError).toBeNull();

    // Restore original fetch
    global.fetch = originalFetch;
  });

  it("should include credentials in request", async () => {
    const mockUser = { id: 1, username: "test" };
    let fetchCall: any;

    // Mock the global fetch function and capture the call
    const originalFetch = global.fetch;
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
    global.fetch = originalFetch;
  });
});
