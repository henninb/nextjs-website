jest.mock("../../utils/csrf", () => ({
  getCsrfHeaders: jest.fn(),
  clearCsrfToken: jest.fn(),
}));

import { graphqlRequest } from "../../utils/graphqlClient";
import { getCsrfHeaders, clearCsrfToken } from "../../utils/csrf";

describe("graphqlClient", () => {
  const originalEnvEndpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT;
  const originalBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const originalNodeEnv = process.env.NODE_ENV;
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock as any;
    (getCsrfHeaders as jest.Mock).mockResolvedValue({
      "X-CSRF-TOKEN": "token-123",
    });
    process.env.NODE_ENV = "test";
    delete process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT;
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT = originalEnvEndpoint;
    process.env.NEXT_PUBLIC_API_BASE_URL = originalBaseUrl;
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("sends a GraphQL request and returns response data", async () => {
    process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT = "https://api.example.com/graphql/";

    const signal = new AbortController().signal;
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: { entries: () => [["content-type", "application/json"]] },
      json: jest.fn().mockResolvedValue({
        data: { accounts: [{ id: 1 }] },
      }),
    });

    await expect(
      graphqlRequest<{ accounts: Array<{ id: number }> }>({
        query: "query GetAccounts { accounts { id } }",
        variables: { active: true },
        signal,
      }),
    ).resolves.toEqual({ accounts: [{ id: 1 }] });

    expect(fetchMock).toHaveBeenCalledWith("https://api.example.com/graphql", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-TOKEN": "token-123",
      },
      body: JSON.stringify({
        query: "query GetAccounts { accounts { id } }",
        variables: { active: true },
      }),
      signal,
    });
  });

  it("falls back to API base URL when explicit endpoint is not set", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://backend.example.com/";

    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: { entries: () => [] },
      json: jest.fn().mockResolvedValue({
        data: { ping: "pong" },
      }),
    });

    await expect(
      graphqlRequest<{ ping: string }>({
        query: "query Ping { ping }",
      }),
    ).resolves.toEqual({ ping: "pong" });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://backend.example.com//graphql",
      expect.any(Object),
    );
  });

  it("rethrows fetch failures", async () => {
    const fetchError = new Error("Network down");
    fetchMock.mockRejectedValue(fetchError);

    await expect(
      graphqlRequest({
        query: "mutation SaveThing { saveThing { id } }",
      }),
    ).rejects.toBe(fetchError);
  });

  it("clears csrf token on matching 403 responses", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      statusText: "Forbidden",
      headers: { entries: () => [] },
      text: jest.fn().mockResolvedValue("Invalid CSRF token"),
    });

    await expect(
      graphqlRequest({
        query: "mutation SaveThing { saveThing { id } }",
      }),
    ).rejects.toThrow("GraphQL HTTP error: 403 - Forbidden");

    expect(clearCsrfToken).toHaveBeenCalled();
  });

  it("does not clear csrf token for unrelated HTTP failures", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Server Error",
      headers: { entries: () => [] },
      text: jest.fn().mockResolvedValue("Unexpected failure"),
    });

    await expect(
      graphqlRequest({
        query: "query GetAccounts { accounts { id } }",
      }),
    ).rejects.toThrow("GraphQL HTTP error: 500 - Server Error");

    expect(clearCsrfToken).not.toHaveBeenCalled();
  });

  it("throws a parse error when JSON decoding fails", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: { entries: () => [] },
      json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
    });

    await expect(
      graphqlRequest({
        query: "query GetAccounts { accounts { id } }",
      }),
    ).rejects.toThrow("GraphQL JSON parse error: Invalid JSON");
  });

  it("throws combined GraphQL errors from the response body", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: { entries: () => [] },
      json: jest.fn().mockResolvedValue({
        data: null,
        errors: [{ message: "First error" }, { message: "Second error" }],
      }),
    });

    await expect(
      graphqlRequest({
        query: "query GetAccounts { accounts { id } }",
      }),
    ).rejects.toThrow("First error; Second error");
  });
});
