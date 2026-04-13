/**
 * @jest-environment jsdom
 */

// Mock the edge auth module before importing the route
jest.mock("../../../utils/security/edgeAuth", () => ({
  isSessionValid: jest.fn(),
}));

import { POST } from "../../../app/api/categorize/route";
import { isSessionValid } from "../../../utils/security/edgeAuth";

const mockIsSessionValid = isSessionValid as jest.Mock;

function makeRequest(body: object, cookie?: string): Request {
  return new Request("http://localhost/api/categorize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });
}

const validBody = {
  description: "Starbucks",
  amount: 5.5,
  availableCategories: ["food", "coffee", "entertainment"],
};

describe("/api/categorize", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure no API key is set so route uses rule-based fallback (no external calls)
    delete process.env.PERPLEXITY_API_KEY;
  });

  describe("authentication gate", () => {
    it("returns 401 when session is invalid", async () => {
      mockIsSessionValid.mockResolvedValueOnce(false);

      const res = await POST(makeRequest(validBody) as any);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe("Unauthorized");
    });

    it("returns 401 without calling categorization logic when session is invalid", async () => {
      mockIsSessionValid.mockResolvedValueOnce(false);
      const fetchSpy = jest.spyOn(global, "fetch");

      await POST(makeRequest(validBody) as any);

      // The Perplexity API must not be called
      expect(fetchSpy).not.toHaveBeenCalled();
      fetchSpy.mockRestore();
    });

    it("proceeds past auth gate and returns 200 when session is valid", async () => {
      mockIsSessionValid.mockResolvedValueOnce(true);

      const res = await POST(makeRequest(validBody, "token=abc123") as any);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(typeof body.category).toBe("string");
    });
  });

  describe("input validation (authenticated)", () => {
    beforeEach(() => {
      mockIsSessionValid.mockResolvedValue(true);
    });

    it("returns 400 for a missing description", async () => {
      const req = makeRequest({ amount: 5.0, availableCategories: ["food"] });
      const res = await POST(req as any);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.success).toBe(false);
    });

    it("returns 400 when availableCategories is empty", async () => {
      const req = makeRequest({ description: "Starbucks", amount: 5.0, availableCategories: [] });
      const res = await POST(req as any);

      expect(res.status).toBe(400);
    });

    it("returns 400 when description exceeds 500 characters", async () => {
      const req = makeRequest({
        description: "x".repeat(501),
        amount: 5.0,
        availableCategories: ["food"],
      });
      const res = await POST(req as any);

      expect(res.status).toBe(400);
    });
  });

  describe("error response shape", () => {
    it("does not expose internal error details when JSON parsing fails", async () => {
      mockIsSessionValid.mockResolvedValueOnce(true);

      // Create a request whose json() throws a parse error (e.g. malformed body)
      const badRequest = {
        json: () => Promise.reject(new SyntaxError("Unexpected token X at position 0")),
        headers: { get: () => null },
      };

      const res = await POST(badRequest as any);

      expect(res.status).toBe(500);
      const body = await res.json();
      // The raw SyntaxError message must not be in the response
      expect(JSON.stringify(body)).not.toContain("Unexpected token");
      expect(body.message).toBeUndefined();
      expect(body.error).toBe("Internal server error");
    });
  });

  describe("fallback categorization (no API key)", () => {
    it("returns a category string from rule-based fallback", async () => {
      mockIsSessionValid.mockResolvedValueOnce(true);

      const res = await POST(makeRequest(validBody) as any);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(typeof body.category).toBe("string");
      expect(body.category.length).toBeGreaterThan(0);
    });

    it("returns private Cache-Control on fallback response", async () => {
      mockIsSessionValid.mockResolvedValueOnce(true);

      const res = await POST(makeRequest(validBody) as any);

      const cc = res.headers.get("cache-control");
      // Must not be publicly cached
      expect(cc).not.toMatch(/public/);
    });
  });
});
