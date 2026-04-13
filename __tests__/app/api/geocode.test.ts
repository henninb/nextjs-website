/**
 * @jest-environment jsdom
 */

jest.mock("../../../utils/security/edgeAuth", () => ({
  isSessionValid: jest.fn(),
}));

import { GET } from "../../../app/api/geocode/route";
import { isSessionValid } from "../../../utils/security/edgeAuth";

global.fetch = jest.fn();

const mockIsSessionValid = isSessionValid as jest.Mock;

function makeRequest(query?: string, cookie?: string): Request {
  const url = query
    ? `http://localhost/api/geocode?q=${encodeURIComponent(query)}`
    : "http://localhost/api/geocode";
  return new Request(url, {
    method: "GET",
    headers: cookie ? { cookie } : {},
  });
}

describe("/api/geocode", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("authentication gate", () => {
    it("returns 401 when session is invalid", async () => {
      mockIsSessionValid.mockResolvedValueOnce(false);

      const res = await GET(makeRequest("Central Park") as any);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Unauthorized");
    });

    it("does not call Nominatim when session is invalid", async () => {
      mockIsSessionValid.mockResolvedValueOnce(false);

      await GET(makeRequest("Central Park") as any);

      expect(fetch).not.toHaveBeenCalled();
    });

    it("proceeds past auth gate when session is valid", async () => {
      mockIsSessionValid.mockResolvedValueOnce(true);
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ display_name: "Central Park, New York" }]),
      });

      const res = await GET(makeRequest("Central Park", "token=abc123") as any);

      expect(res.status).toBe(200);
    });
  });

  describe("input validation (authenticated)", () => {
    beforeEach(() => {
      mockIsSessionValid.mockResolvedValue(true);
    });

    it("returns 400 when query parameter is missing", async () => {
      const res = await GET(makeRequest(undefined, "token=abc123") as any);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Query too short");
    });

    it("returns 400 when query is a single character", async () => {
      const res = await GET(makeRequest("a", "token=abc123") as any);

      expect(res.status).toBe(400);
    });

    it("accepts a query of two or more characters", async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      const res = await GET(makeRequest("NY", "token=abc123") as any);

      expect(res.status).toBe(200);
    });
  });

  describe("upstream error handling (authenticated)", () => {
    beforeEach(() => {
      mockIsSessionValid.mockResolvedValue(true);
    });

    it("returns 502 when Nominatim is unavailable", async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 503 });

      const res = await GET(makeRequest("Central Park", "token=abc123") as any);

      expect(res.status).toBe(502);
      const body = await res.json();
      expect(body.error).toBe("Geocoding service unavailable");
    });

    it("returns 500 on network failure without leaking details", async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error("DNS resolution failed"));

      const res = await GET(makeRequest("Central Park", "token=abc123") as any);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe("Failed to fetch geocoding results");
      // Raw exception message must not leak
      expect(JSON.stringify(body)).not.toContain("DNS resolution failed");
    });
  });

  describe("Nominatim request hygiene (authenticated)", () => {
    beforeEach(() => {
      mockIsSessionValid.mockResolvedValue(true);
    });

    it("sets a User-Agent header on the upstream request", async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await GET(makeRequest("Paris", "token=abc123") as any);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("nominatim.openstreetmap.org"),
        expect.objectContaining({
          headers: expect.objectContaining({
            "User-Agent": expect.stringContaining("nextjs"),
          }),
        }),
      );
    });

    it("URL-encodes the query string", async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await GET(makeRequest("New York City", "token=abc123") as any);

      const [url] = (fetch as jest.Mock).mock.calls[0];
      expect(url).toContain("New%20York%20City");
    });
  });
});
