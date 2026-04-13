/**
 * @jest-environment jsdom
 */

import { isSessionValid } from "../../utils/security/edgeAuth";

global.fetch = jest.fn();

// The fallback upstream origin used when no env vars are set
const UPSTREAM = "https://finance.bhenning.com";

function makeRequest(cookie?: string): Request {
  return new Request("http://localhost/api/categorize", {
    method: "POST",
    headers: cookie ? { cookie } : {},
  });
}

describe("edgeAuth — isSessionValid", () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    delete process.env.API_PROXY_TARGET;
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
  });

  describe("fast-path rejection (no network call)", () => {
    it("returns false and does not call fetch when cookie header is absent", async () => {
      const result = await isSessionValid(makeRequest());

      expect(result).toBe(false);
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe("upstream /api/me validation", () => {
    it("returns true when the backend returns 200", async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200 });

      const result = await isSessionValid(makeRequest("token=abc123"));

      expect(result).toBe(true);
    });

    it("returns false when the backend returns 401", async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 401 });

      const result = await isSessionValid(makeRequest("token=expired"));

      expect(result).toBe(false);
    });

    it("returns false when the backend returns 403", async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 403 });

      const result = await isSessionValid(makeRequest("token=abc123"));

      expect(result).toBe(false);
    });

    it("fails closed (returns false) on network failure", async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network failure"));

      const result = await isSessionValid(makeRequest("token=abc123"));

      expect(result).toBe(false);
    });
  });

  describe("request forwarding", () => {
    it("forwards the full cookie header to the upstream /api/me", async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200 });
      const cookieValue = "token=abc123; XSRF-TOKEN=xyz789";

      await isSessionValid(makeRequest(cookieValue));

      expect(fetch).toHaveBeenCalledWith(
        `${UPSTREAM}/api/me`,
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({ cookie: cookieValue }),
        }),
      );
    });

    it("calls the correct upstream URL", async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

      await isSessionValid(makeRequest("token=abc123"));

      const [url] = (fetch as jest.Mock).mock.calls[0];
      expect(url).toBe(`${UPSTREAM}/api/me`);
    });

    it("respects API_PROXY_TARGET env var when set", async () => {
      process.env.API_PROXY_TARGET = "https://custom-backend.example.com";
      (fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

      await isSessionValid(makeRequest("token=abc123"));

      const [url] = (fetch as jest.Mock).mock.calls[0];
      expect(url).toBe("https://custom-backend.example.com/api/me");

      delete process.env.API_PROXY_TARGET;
    });
  });
});
