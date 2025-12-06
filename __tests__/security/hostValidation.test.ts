/**
 * @jest-environment jsdom
 */

import {
  isLocalhost,
  isHostOrSubdomain,
  isLocalhostOrigin,
  isOriginForDomain,
  isVercelHost,
  isApprovedHost,
} from "../../utils/security/hostValidation";

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
        isHostOrSubdomain("staging.vercel.bhenning.com", "vercel.bhenning.com"),
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
      expect(isHostOrSubdomain("example.com.attacker.com", "example.com")).toBe(
        false,
      );
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
        isOriginForDomain("https://vercel.bhenning.com", "vercel.bhenning.com"),
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
        isOriginForDomain("https://vercel-bhenning.com", "vercel.bhenning.com"),
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
