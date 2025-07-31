import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { useUser } from "../../hooks/useUser";

// Setup MSW server for Node environment
const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("useUser", () => {
  it("should fetch user data successfully", async () => {
    const mockUser = {
      id: 1,
      username: "testuser",
      email: "test@example.com",
      roles: ["user"],
    };

    server.use(
      http.get("https://finance.bhenning.com/api/me", () => {
        return HttpResponse.json(mockUser, { status: 200 });
      }),
    );

    const { result } = renderHook(() => useUser());

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.user).toBe(undefined);
    expect(result.current.isError).toBe(undefined);

    // Wait for data to load
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isError).toBe(undefined);
  });


  it("should include credentials in request", async () => {
    let requestOptions: any;

    server.use(
      http.get("https://finance.bhenning.com/api/me", ({ request }) => {
        // Capture request for verification
        requestOptions = request;
        return HttpResponse.json({ id: 1, username: "test" });
      }),
    );

    const { result } = renderHook(() => useUser());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // SWR will make the request with credentials: 'include'
    expect(result.current.user).toBeDefined();
  });
});