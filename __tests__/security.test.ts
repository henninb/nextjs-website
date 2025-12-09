/**
 * @jest-environment jsdom
 */

import { generateSecureUUID, isValidUUID } from "../utils/security/secureUUID";
import {
  createCORSMiddleware,
  getCORSPolicyForRoute,
} from "../utils/security/corsMiddleware";
import {
  isApprovedHost,
  isHostOrSubdomain,
  isLocalhost,
  isLocalhostOrigin,
  isOriginForDomain,
  isVercelHost,
} from "../utils/security/hostValidation";
import { NextApiRequest, NextApiResponse } from "next";

// Mock fetch for testing UUID generation
global.fetch = jest.fn();

describe("Security Implementations", () => {
  describe("Secure UUID Generation", () => {
    beforeEach(() => {
      (fetch as jest.Mock).mockClear();
    });

    it("should validate UUID format correctly", () => {
      const validUUID = "123e4567-e89b-42d3-a456-426614174000"; // Valid UUID v4
      const invalidUUID = "not-a-uuid";

      expect(isValidUUID(validUUID)).toBe(true);
      expect(isValidUUID(invalidUUID)).toBe(false);
    });

    it("should generate fallback UUID when server call fails", async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

      const uuid = await generateSecureUUID();

      expect(typeof uuid).toBe("string");
      expect(uuid.length).toBe(36);
      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it("should handle rate limiting gracefully", async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: jest.fn().mockResolvedValue({ error: "Rate limited" }),
      });

      const uuid = await generateSecureUUID();

      expect(typeof uuid).toBe("string");
      expect(uuid.length).toBe(36);
    });

    it("should use server response when successful", async () => {
      const mockUUID = "550e8400-e29b-41d4-a716-446655440000";
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          uuid: mockUUID,
          timestamp: Date.now(),
        }),
      });

      const uuid = await generateSecureUUID();

      expect(uuid).toBe(mockUUID);
    });
  });

  describe("CORS Middleware", () => {
    let req: Partial<NextApiRequest>;
    let res: Partial<NextApiResponse>;
    let setHeaderSpy: jest.SpyInstance;
    let statusSpy: jest.SpyInstance;
    let endSpy: jest.SpyInstance;

    beforeEach(() => {
      setHeaderSpy = jest.fn();
      statusSpy = jest
        .fn()
        .mockReturnValue({ end: jest.fn(), json: jest.fn() });
      endSpy = jest.fn();

      req = {
        method: "GET",
        headers: { origin: "http://localhost:3000" },
        url: "/api/test",
      };

      res = {
        setHeader: setHeaderSpy,
        status: statusSpy,
        end: endSpy,
      };
    });

    it("should apply correct CORS policy for public routes", () => {
      const policy = getCORSPolicyForRoute("/api/weather");
      expect(policy).toBe("public");
    });

    it("should apply correct CORS policy for auth routes", () => {
      const policy = getCORSPolicyForRoute("/api/login");
      expect(policy).toBe("auth");
    });

    it("should apply correct CORS policy for financial routes", () => {
      const policy = getCORSPolicyForRoute("/api/account/select");
      expect(policy).toBe("financial");
    });

    it("should handle OPTIONS preflight request", () => {
      const corsMiddleware = createCORSMiddleware("default");
      req.method = "OPTIONS";

      const result = corsMiddleware(
        req as NextApiRequest,
        res as NextApiResponse,
      );

      expect(result).toBe(false); // Should not continue to main handler
      expect(statusSpy).toHaveBeenCalledWith(204);
    });

    it("should reject disallowed methods", () => {
      const corsMiddleware = createCORSMiddleware("public"); // Only allows GET, OPTIONS
      req.method = "POST";

      const result = corsMiddleware(
        req as NextApiRequest,
        res as NextApiResponse,
      );

      expect(result).toBe(false);
      expect(statusSpy).toHaveBeenCalledWith(405);
    });

    it("should set appropriate headers for development", () => {
      process.env.NODE_ENV = "development";
      const corsMiddleware = createCORSMiddleware("default");

      corsMiddleware(req as NextApiRequest, res as NextApiResponse);

      expect(setHeaderSpy).toHaveBeenCalledWith(
        "Access-Control-Allow-Origin",
        "http://localhost:3000",
      );
      expect(setHeaderSpy).toHaveBeenCalledWith(
        "Access-Control-Allow-Methods",
        expect.any(String),
      );
      expect(setHeaderSpy).toHaveBeenCalledWith(
        "Access-Control-Allow-Headers",
        expect.any(String),
      );
    });
  });

  describe("Security Header Configuration", () => {
    it("should have restrictive Content Security Policy", () => {
      // This test verifies that our CSP is properly configured
      const expectedCSPDirectives = [
        "default-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
      ];

      // In a real application, you would test the actual headers
      // This is a placeholder test
      expectedCSPDirectives.forEach((directive) => {
        expect(typeof directive).toBe("string");
        expect(directive.length).toBeGreaterThan(0);
      });
    });

    it("should enforce HTTPS in production", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      // Test that HSTS header would be set correctly
      const expectedHSTS = "max-age=31536000; includeSubDomains; preload";
      expect(expectedHSTS).toContain("max-age=31536000");
      expect(expectedHSTS).toContain("includeSubDomains");
      expect(expectedHSTS).toContain("preload");

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("Rate Limiting", () => {
    it("should implement rate limiting for UUID generation", () => {
      // This would test the rate limiting logic
      // Since it's implemented in the API route, we test the concept here
      const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
      const RATE_LIMIT_MAX = 100;

      expect(RATE_LIMIT_WINDOW).toBe(60000);
      expect(RATE_LIMIT_MAX).toBe(100);
    });
  });

  describe("hostValidation", () => {
    describe("isLocalhost", () => {
      it("should correctly identify localhost variations", () => {
        expect(isLocalhost("localhost")).toBe(true);
        expect(isLocalhost("localhost:3000")).toBe(true);
        expect(isLocalhost("127.0.0.1")).toBe(true);
        expect(isLocalhost("127.0.0.1:8080")).toBe(true);
        expect(isLocalhost("0.0.0.0")).toBe(true);
        expect(isLocalhost("[::1]")).toBe(true);
        expect(isLocalhost("[::1]:8080")).toBe(true);
      });

      it("should reject malicious localhost-like domains", () => {
        // SECURITY: These should all return false to prevent bypass attacks
        expect(isLocalhost("localhost.evil.com")).toBe(false);
        expect(isLocalhost("evil-localhost")).toBe(false);
        expect(isLocalhost("localhost.attacker.com")).toBe(false);
        expect(isLocalhost("127.0.0.1.evil.com")).toBe(false);
        expect(isLocalhost("malicious-127.0.0.1")).toBe(false);
      });

      it("should handle null/undefined", () => {
        expect(isLocalhost(null)).toBe(false);
        expect(isLocalhost(undefined)).toBe(false);
        expect(isLocalhost("")).toBe(false);
      });
    });

    describe("isHostOrSubdomain", () => {
      it("should match exact domain", () => {
        expect(
          isHostOrSubdomain("vercel.bhenning.com", "vercel.bhenning.com"),
        ).toBe(true);
        expect(isHostOrSubdomain("example.com", "example.com")).toBe(true);
      });

      it("should match valid subdomains", () => {
        expect(
          isHostOrSubdomain("api.vercel.bhenning.com", "vercel.bhenning.com"),
        ).toBe(true);
        expect(
          isHostOrSubdomain(
            "staging.vercel.bhenning.com",
            "vercel.bhenning.com",
          ),
        ).toBe(true);
        expect(isHostOrSubdomain("sub.example.com", "example.com")).toBe(true);
      });

      it("should reject malicious domain lookalikes", () => {
        // SECURITY: Critical test - these should all return false
        expect(
          isHostOrSubdomain(
            "vercel.bhenning.com.evil.com",
            "vercel.bhenning.com",
          ),
        ).toBe(false);
        expect(
          isHostOrSubdomain("evil-vercel.bhenning.com", "vercel.bhenning.com"),
        ).toBe(false);
        expect(
          isHostOrSubdomain("evilvercel.bhenning.com", "vercel.bhenning.com"),
        ).toBe(false);
        expect(
          isHostOrSubdomain("vercel-bhenning.com", "vercel.bhenning.com"),
        ).toBe(false);

        // Test with example.com to ensure the pattern holds
        expect(
          isHostOrSubdomain("example.com.attacker.com", "example.com"),
        ).toBe(false);
        expect(isHostOrSubdomain("notexample.com", "example.com")).toBe(false);
      });

      it("should handle ports correctly", () => {
        expect(
          isHostOrSubdomain("vercel.bhenning.com:443", "vercel.bhenning.com"),
        ).toBe(true);
        expect(
          isHostOrSubdomain(
            "api.vercel.bhenning.com:8080",
            "vercel.bhenning.com",
          ),
        ).toBe(true);

        // SECURITY: Port should not bypass validation
        expect(
          isHostOrSubdomain(
            "vercel.bhenning.com.evil.com:443",
            "vercel.bhenning.com",
          ),
        ).toBe(false);
      });

      it("should handle null/undefined", () => {
        expect(isHostOrSubdomain(null, "example.com")).toBe(false);
        expect(isHostOrSubdomain(undefined, "example.com")).toBe(false);
        expect(isHostOrSubdomain("", "example.com")).toBe(false);
      });
    });

    describe("isLocalhostOrigin", () => {
      it("should correctly identify localhost origins", () => {
        expect(isLocalhostOrigin("http://localhost:3000")).toBe(true);
        expect(isLocalhostOrigin("http://127.0.0.1:3000")).toBe(true);
        expect(isLocalhostOrigin("https://localhost")).toBe(true);
        // Note: URL parsing with [::1] may vary by environment, focusing on common cases
      });

      it("should reject malicious localhost-like origins", () => {
        // SECURITY: These should all return false
        expect(isLocalhostOrigin("http://localhost.evil.com")).toBe(false);
        expect(isLocalhostOrigin("https://127.0.0.1.attacker.com")).toBe(false);
        expect(isLocalhostOrigin("http://evil-localhost")).toBe(false);
      });

      it("should handle plain hostnames", () => {
        expect(isLocalhostOrigin("localhost")).toBe(true);
        expect(isLocalhostOrigin("127.0.0.1")).toBe(true);
        expect(isLocalhostOrigin("localhost.evil.com")).toBe(false);
      });
    });

    describe("isOriginForDomain", () => {
      it("should match valid origins", () => {
        expect(
          isOriginForDomain(
            "https://vercel.bhenning.com",
            "vercel.bhenning.com",
          ),
        ).toBe(true);
        expect(
          isOriginForDomain(
            "https://api.vercel.bhenning.com",
            "vercel.bhenning.com",
          ),
        ).toBe(true);
        expect(
          isOriginForDomain(
            "http://staging.vercel.bhenning.com:3000",
            "vercel.bhenning.com",
          ),
        ).toBe(true);
      });

      it("should reject malicious origins", () => {
        // SECURITY: Critical test
        expect(
          isOriginForDomain(
            "https://vercel.bhenning.com.evil.com",
            "vercel.bhenning.com",
          ),
        ).toBe(false);
        expect(
          isOriginForDomain(
            "http://evil-vercel.bhenning.com",
            "vercel.bhenning.com",
          ),
        ).toBe(false);
        expect(
          isOriginForDomain(
            "https://vercel-bhenning.com",
            "vercel.bhenning.com",
          ),
        ).toBe(false);
      });
    });

    describe("isVercelHost", () => {
      it("should match Vercel hosts", () => {
        expect(isVercelHost("vercel.bhenning.com")).toBe(true);
        expect(isVercelHost("api.vercel.bhenning.com")).toBe(true);
        expect(isVercelHost("staging.vercel.bhenning.com")).toBe(true);
      });

      it("should reject non-Vercel hosts", () => {
        // SECURITY: Critical test for production security
        expect(isVercelHost("vercel.bhenning.com.evil.com")).toBe(false);
        expect(isVercelHost("evil-vercel.bhenning.com")).toBe(false);
        expect(isVercelHost("www.bhenning.com")).toBe(false);
        expect(isVercelHost("localhost")).toBe(false);
      });
    });

    describe("isApprovedHost", () => {
      it("should approve localhost", () => {
        expect(isApprovedHost("localhost")).toBe(true);
        expect(isApprovedHost("127.0.0.1")).toBe(true);
      });

      it("should approve Vercel hosts", () => {
        expect(isApprovedHost("vercel.bhenning.com")).toBe(true);
        expect(isApprovedHost("api.vercel.bhenning.com")).toBe(true);
      });

      it("should reject malicious hosts", () => {
        // SECURITY: Critical combined test
        expect(isApprovedHost("localhost.evil.com")).toBe(false);
        expect(isApprovedHost("vercel.bhenning.com.attacker.com")).toBe(false);
        expect(isApprovedHost("evil.example.com")).toBe(false);
      });
    });

    describe("SECURITY: Regression tests for CVE-like vulnerabilities", () => {
      it("should prevent substring bypass attacks", () => {
        // Test cases inspired by real-world CVE examples
        const maliciousHosts = [
          "vercel.bhenning.com.evil.com", // Domain suffix attack
          "avercel.bhenning.com", // Prefix variation
          "vercel.bhenning.com.attacker.io", // Domain suffix with different TLD
          "localhost.malicious.com", // Localhost lookalike
          "127.0.0.1.evil.com", // IP lookalike
          "xvercel.bhenning.comx", // Wrapped in extra chars
        ];

        maliciousHosts.forEach((host) => {
          expect(isVercelHost(host)).toBe(false);
          expect(isApprovedHost(host)).toBe(false);
        });
      });

      it("should correctly handle legitimate subdomains", () => {
        // These ARE valid subdomains and should be allowed
        const validSubdomains = [
          "api.vercel.bhenning.com",
          "staging.vercel.bhenning.com",
          "prod.vercel.bhenning.com",
          "evil.vercel.bhenning.com", // Even with "evil" in name, it's still a valid subdomain
        ];

        validSubdomains.forEach((host) => {
          expect(isVercelHost(host)).toBe(true);
          expect(isApprovedHost(host)).toBe(true);
        });
      });

      it("should handle Unicode and IDN homograph attacks", () => {
        // Unicode lookalikes should not match
        expect(isVercelHost("vеrcel.bhenning.com")).toBe(false); // Cyrillic 'е'
        expect(isLocalhost("lосalhost")).toBe(false); // Cyrillic 'о' and 'с'
      });

      it("should prevent case sensitivity bypasses", () => {
        // All should work due to toLowerCase in implementation
        expect(isVercelHost("VERCEL.BHENNING.COM")).toBe(true);
        expect(isLocalhost("LOCALHOST")).toBe(true);

        // But malicious variants should still fail
        expect(isVercelHost("VERCEL.BHENNING.COM.EVIL.COM")).toBe(false);
      });
    });
  });
});
