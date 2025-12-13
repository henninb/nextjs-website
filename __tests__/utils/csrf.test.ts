import {
  fetchCsrfToken,
  getCsrfToken,
  getCsrfHeaders,
  clearCsrfToken,
  initCsrfToken,
} from "../../utils/csrf";

describe("csrf", () => {
  beforeEach(() => {
    // Clear token and reset mocks before each test
    clearCsrfToken();
    global.fetch = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("fetchCsrfToken", () => {
    it("fetches and caches CSRF token", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: "test-token-123",
          headerName: "X-CSRF-TOKEN",
          parameterName: "_csrf",
        }),
      });

      await fetchCsrfToken();

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/csrf",
        expect.objectContaining({
          credentials: "include",
        }),
      );

      const token = await getCsrfToken();
      expect(token).toBe("test-token-123");

      // Second call should use cached token, not fetch again
      const token2 = await getCsrfToken();
      expect(token2).toBe("test-token-123");
      expect(global.fetch).toHaveBeenCalledTimes(1); // Still only 1 call
    });

    it("throws error when fetch fails", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(fetchCsrfToken()).rejects.toThrow(
        "Failed to fetch CSRF token: 500",
      );
    });

    it("handles custom header name from backend", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: "custom-token",
          headerName: "X-CUSTOM-CSRF",
          parameterName: "_csrf",
        }),
      });

      await fetchCsrfToken();
      const headers = await getCsrfHeaders();

      expect(headers).toEqual({
        "X-CUSTOM-CSRF": "custom-token",
      });
    });
  });

  describe("getCsrfToken", () => {
    it("returns cached token if available", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: "cached-token",
          headerName: "X-CSRF-TOKEN",
        }),
      });

      const token1 = await getCsrfToken();
      const token2 = await getCsrfToken();

      expect(token1).toBe("cached-token");
      expect(token2).toBe("cached-token");
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("returns null if fetch fails", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 503,
      });

      const token = await getCsrfToken();
      expect(token).toBeNull();
    });

    it("fetches token if not cached", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: "new-token",
          headerName: "X-CSRF-TOKEN",
        }),
      });

      const token = await getCsrfToken();
      expect(token).toBe("new-token");
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("getCsrfHeaders", () => {
    it("returns headers with token", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: "header-token",
          headerName: "X-CSRF-TOKEN",
        }),
      });

      const headers = await getCsrfHeaders();

      expect(headers).toEqual({
        "X-CSRF-TOKEN": "header-token",
      });
    });

    it("returns empty object if token unavailable", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const headers = await getCsrfHeaders();
      expect(headers).toEqual({});
    });
  });

  describe("clearCsrfToken", () => {
    it("clears cached token forcing new fetch", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            token: "first-token",
            headerName: "X-CSRF-TOKEN",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            token: "second-token",
            headerName: "X-CSRF-TOKEN",
          }),
        });

      const token1 = await getCsrfToken();
      expect(token1).toBe("first-token");

      clearCsrfToken();

      const token2 = await getCsrfToken();
      expect(token2).toBe("second-token");
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("initCsrfToken", () => {
    it("prefetches token successfully", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: "prefetch-token",
          headerName: "X-CSRF-TOKEN",
        }),
      });

      await initCsrfToken();

      const token = await getCsrfToken();
      expect(token).toBe("prefetch-token");
      expect(global.fetch).toHaveBeenCalledTimes(1); // Only one fetch
    });

    it("silently handles fetch failure", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      // Should not throw
      await expect(initCsrfToken()).resolves.toBeUndefined();
    });
  });

  describe("concurrent fetch deduplication", () => {
    it("deduplicates concurrent fetch requests", async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({
                    token: "concurrent-token",
                    headerName: "X-CSRF-TOKEN",
                  }),
                }),
              100,
            ),
          ),
      );

      // Fire off 3 concurrent requests
      const [token1, token2, token3] = await Promise.all([
        getCsrfToken(),
        getCsrfToken(),
        getCsrfToken(),
      ]);

      expect(token1).toBe("concurrent-token");
      expect(token2).toBe("concurrent-token");
      expect(token3).toBe("concurrent-token");
      expect(global.fetch).toHaveBeenCalledTimes(1); // Only one actual fetch
    });
  });
});
