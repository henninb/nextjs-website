/**
 * @jest-environment jsdom
 */

import handler from "../../../pages/api/nba.js";

// Mock global fetch for API testing
global.fetch = jest.fn();

describe("/api/nba", () => {
  let mockReq;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      method: "GET",
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("Successful responses", () => {
    it("should return NBA data successfully", async () => {
      const mockNbaData = {
        fixtures: [
          {
            date: "2024-01-15",
            home_team: "Minnesota Timberwolves",
            away_team: "Los Angeles Lakers",
            score: "112-108",
          },
        ],
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockNbaData),
      });

      const result = await handler(mockReq);

      expect(global.fetch).toHaveBeenCalledWith(
        "https://fixturedownload.com/feed/json/nba-2024/minnesota-timberwolves",
        expect.objectContaining({
          method: "GET",
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; NextJS API)",
            Accept: "application/json",
          },
        }),
      );

      expect(result.status).toBe(200);

      // Parse the response body
      const responseBody = JSON.parse(result.body || "{}");
      expect(responseBody).toEqual(mockNbaData);

      // Check headers
      expect(result.headers.get("content-type")).toBe("application/json");
      expect(result.headers.get("Cache-Control")).toBe(
        "public, s-maxage=300, stale-while-revalidate=600",
      );
    });

    it("should handle empty response data", async () => {
      const emptyData = { fixtures: [] };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(emptyData),
      });

      const result = await handler(mockReq);

      expect(result.status).toBe(200);
      const responseBody = JSON.parse(result.body || "{}");
      expect(responseBody).toEqual(emptyData);
    });
  });

  describe("Error handling", () => {
    it("should return 405 for non-GET requests", async () => {
      mockReq.method = "POST";

      const result = await handler(mockReq);

      expect(result.status).toBe(405);
      expect(result.headers.get("content-type")).toBe("application/json");

      const responseBody = JSON.parse(result.body || "{}");
      expect(responseBody.message).toBe("Method not allowed");
    });

    it("should handle fetch failures gracefully", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await handler(mockReq);

      expect(result.status).toBe(500);
      expect(result.headers.get("content-type")).toBe("application/json");

      const responseBody = JSON.parse(result.body || "{}");
      expect(responseBody.message).toBe("Internal server error");
    });

    it("should handle HTTP error responses", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
      });

      const result = await handler(mockReq);

      expect(result.status).toBe(500);

      const responseBody = JSON.parse(result.body || "{}");
      expect(responseBody.message).toBe("Internal server error");
    });

    it("should handle malformed JSON responses", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error("Invalid JSON")),
      });

      const result = await handler(mockReq);

      expect(result.status).toBe(500);

      const responseBody = JSON.parse(result.body || "{}");
      expect(responseBody.message).toBe("Internal server error");
    });

    it("should include error details in development", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      global.fetch.mockRejectedValueOnce(new Error("Specific network error"));

      const result = await handler(mockReq);

      expect(result.status).toBe(500);

      const responseBody = JSON.parse(result.body || "{}");
      expect(responseBody.error).toBe("Specific network error");

      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });

    it("should not include error details in production", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      global.fetch.mockRejectedValueOnce(new Error("Specific network error"));

      const result = await handler(mockReq);

      expect(result.status).toBe(500);

      const responseBody = JSON.parse(result.body || "{}");
      expect(responseBody.error).toBeUndefined();

      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("HTTP methods", () => {
    const invalidMethods = ["POST", "PUT", "DELETE", "PATCH"];

    invalidMethods.forEach((method) => {
      it(`should return 405 for ${method} requests`, async () => {
        mockReq.method = method;

        const result = await handler(mockReq);

        expect(result.status).toBe(405);
        expect(global.fetch).not.toHaveBeenCalled();

        const responseBody = JSON.parse(result.body || "{}");
        expect(responseBody.message).toBe("Method not allowed");
      });
    });
  });

  describe("Response headers", () => {
    it("should set correct response headers", async () => {
      const mockData = { fixtures: [] };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData),
      });

      const result = await handler(mockReq);

      expect(result.headers.get("content-type")).toBe("application/json");
      expect(result.headers.get("Cache-Control")).toBe(
        "public, s-maxage=300, stale-while-revalidate=600",
      );
    });
  });

  describe("Edge cases", () => {
    it("should handle timeout scenarios", async () => {
      // Simulate a timeout
      global.fetch.mockRejectedValueOnce(new Error("Fetch timeout"));

      const result = await handler(mockReq);

      expect(result.status).toBe(500);

      const responseBody = JSON.parse(result.body || "{}");
      expect(responseBody.message).toBe("Internal server error");
    });

    it("should handle large response payloads", async () => {
      // Create a large mock dataset
      const largeData = {
        fixtures: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          date: "2024-01-15",
          home_team: "Minnesota Timberwolves",
          away_team: "Team " + i,
          score: "112-108",
        })),
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(largeData),
      });

      const result = await handler(mockReq);

      expect(result.status).toBe(200);
      const responseBody = JSON.parse(result.body || "{}");
      expect(responseBody.fixtures).toHaveLength(1000);
    });
  });
});
