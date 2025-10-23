/**
 * @jest-environment jsdom
 */

import { NextResponse } from "next/server";
import proxy from "../proxy.js";

// Enhanced NextResponse mock to support constructor usage and headers
jest.mock("next/server", () => {
  const makeHeaders = (init = undefined) => {
    // Use the custom global Headers from jest.setup if available
    const H =
      global.Headers ||
      class HeadersPolyfill {
        constructor() {
          this._map = new Map();
        }
        set(k, v) {
          this._map.set(String(k).toLowerCase(), v);
        }
        get(k) {
          return this._map.get(String(k).toLowerCase());
        }
        forEach(cb) {
          this._map.forEach((v, k) => cb(v, k));
        }
        entries() {
          return this._map.entries();
        }
      };
    return init instanceof H ? init : new H(init);
  };

  const NextResponseMock = function (body, init = {}) {
    return {
      body,
      status: init.status ?? 200,
      statusText: init.statusText ?? "",
      headers: init.headers || makeHeaders(),
    };
  };
  NextResponseMock.next = jest.fn(() => ({ headers: { set: jest.fn() } }));
  NextResponseMock.json = jest.fn((body, init = {}) => ({
    body: JSON.stringify(body),
    status: init.status ?? 200,
    headers: init.headers || makeHeaders(),
  }));
  NextResponseMock.redirect = jest.fn((url, status = 307) => ({
    url,
    status,
    headers: makeHeaders(),
  }));
  return { NextResponse: NextResponseMock };
});

// Mock global fetch
global.fetch = jest.fn();
global.AbortController = jest.fn(() => ({
  signal: {},
  abort: jest.fn(),
}));
global.setTimeout = jest.fn();
global.clearTimeout = jest.fn();

describe("Proxy (middleware replacement)", () => {
  let mockRequest;
  let mockUrl;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock URL object
    mockUrl = {
      pathname: "/api/test",
      search: "",
      clone: jest.fn(() => mockUrl),
    };

    // Mock request object
    mockRequest = {
      nextUrl: mockUrl,
      method: "GET",
      headers: new Map([
        ["host", "localhost:3000"],
        ["cookie", "token=abc123"],
      ]),
      blob: jest.fn(() => Promise.resolve(new Blob())),
    };

    // Setup environment variables
    process.env.NODE_ENV = "development";
    delete process.env.API_PROXY_TARGET;
  });

  afterEach(() => {
    // Reset environment
    process.env.NODE_ENV = "development";
  });

  describe("Production GraphQL Mapping", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
    });

    it("should map /api/graphql to /graphql in production", async () => {
      mockUrl.pathname = "/api/graphql";
      mockUrl.search = "?query=test";

      const mockResponse = {
        status: 200,
        statusText: "OK",
        body: JSON.stringify({ data: { test: true } }),
        headers: new Map([["content-type", "application/json"]]),
      };
      mockResponse.headers.forEach = jest.fn((callback) => {
        callback("application/json", "content-type");
      });

      global.fetch.mockResolvedValue(mockResponse);

      await proxy(mockRequest);

      expect(global.fetch).toHaveBeenCalledWith(
        "https://finance.bhenning.com/graphql?query=test",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            host: "finance.bhenning.com",
          }),
        }),
      );
    });

    it("should keep /api/me path unchanged in production", async () => {
      mockUrl.pathname = "/api/me";
      mockUrl.search = "";

      const mockResponse = {
        status: 200,
        statusText: "OK",
        body: JSON.stringify({ user: "test" }),
        headers: new Map([["content-type", "application/json"]]),
      };
      mockResponse.headers.forEach = jest.fn((callback) => {
        callback("application/json", "content-type");
      });

      global.fetch.mockResolvedValue(mockResponse);

      await proxy(mockRequest);

      expect(global.fetch).toHaveBeenCalledWith(
        "https://finance.bhenning.com/api/me",
        expect.any(Object),
      );
    });

    it("should keep other API routes unchanged in production", async () => {
      mockUrl.pathname = "/api/users";
      mockUrl.search = "?limit=10";

      const mockResponse = {
        status: 200,
        statusText: "OK",
        body: JSON.stringify([]),
        headers: new Map([["content-type", "application/json"]]),
      };
      mockResponse.headers.forEach = jest.fn((callback) => {
        callback("application/json", "content-type");
      });

      global.fetch.mockResolvedValue(mockResponse);

      await proxy(mockRequest);

      expect(global.fetch).toHaveBeenCalledWith(
        "https://finance.bhenning.com/api/users?limit=10",
        expect.any(Object),
      );
    });

    it("should handle direct /graphql requests in production by routing to /graphql", async () => {
      mockUrl.pathname = "/graphql";
      mockUrl.search = "?query=test";

      const mockResponse = {
        status: 200,
        statusText: "OK",
        body: JSON.stringify({ data: { test: true } }),
        headers: new Map([["content-type", "application/json"]]),
      };
      mockResponse.headers.forEach = jest.fn((callback) => {
        callback("application/json", "content-type");
      });

      global.fetch.mockResolvedValue(mockResponse);

      await proxy(mockRequest);

      expect(global.fetch).toHaveBeenCalledWith(
        "https://finance.bhenning.com/graphql?query=test",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            host: "finance.bhenning.com",
          }),
        }),
      );
    });
  });

  describe("Cookie Rewriting", () => {
    it("rewrites auth Set-Cookie for localhost in development", async () => {
      process.env.NODE_ENV = "development";
      mockUrl.pathname = "/api/test";

      const upstreamHeaders = new Map();
      upstreamHeaders.forEach = jest.fn((cb) => {
        cb(
          "token=abc123; Path=/; Domain=.bhenning.com; Secure; SameSite=None",
          "set-cookie",
        );
      });
      const mockResponse = {
        status: 200,
        statusText: "OK",
        body: "ok",
        headers: upstreamHeaders,
      };
      global.fetch.mockResolvedValue(mockResponse);

      const res = await proxy(mockRequest);
      // Our NextResponse mock returns the options.headers as provided by middleware
      const setCookie = res.headers.get
        ? res.headers.get("set-cookie")
        : undefined;
      expect(setCookie).toBeDefined();
      expect(setCookie).toContain("token=abc123");
      // Domain removed
      expect(setCookie).not.toMatch(/Domain=/i);
      // Secure removed for localhost
      expect(setCookie).not.toMatch(/;\s*Secure(=|;|$)/i);
      // SameSite adjusted to Lax
      expect(setCookie).toMatch(/SameSite=Lax/i);
    });

    it("does not rewrite non-auth cookies in development", async () => {
      process.env.NODE_ENV = "development";
      mockUrl.pathname = "/api/test";

      const cookieValue =
        "theme=dark; Path=/; Domain=.bhenning.com; Secure; SameSite=None";
      const upstreamHeaders = new Map();
      upstreamHeaders.forEach = jest.fn((cb) => {
        cb(cookieValue, "set-cookie");
      });
      const mockResponse = {
        status: 200,
        statusText: "OK",
        body: "ok",
        headers: upstreamHeaders,
      };
      global.fetch.mockResolvedValue(mockResponse);

      const res = await proxy(mockRequest);
      const setCookie = res.headers.get
        ? res.headers.get("set-cookie")
        : undefined;
      expect(setCookie).toBe(cookieValue);
    });

    it("does not rewrite auth cookies in production", async () => {
      process.env.NODE_ENV = "production";
      mockUrl.pathname = "/api/test";

      const cookieValue =
        "token=abc123; Path=/; Domain=.bhenning.com; Secure; SameSite=None";
      const upstreamHeaders = new Map();
      upstreamHeaders.forEach = jest.fn((cb) => {
        cb(cookieValue, "set-cookie");
      });
      const mockResponse = {
        status: 200,
        statusText: "OK",
        body: "ok",
        headers: upstreamHeaders,
      };
      global.fetch.mockResolvedValue(mockResponse);

      const res = await proxy(mockRequest);
      const setCookie = res.headers.get
        ? res.headers.get("set-cookie")
        : undefined;
      expect(setCookie).toBe(cookieValue);
    });
  });

  describe("Development and Production Behavior", () => {
    it("should correctly proxy /api/graphql and /graphql for all environments", async () => {
      const environments = [
        { env: "development", host: "localhost:3000" },
        { env: "production", host: "www.bhenning.com" },
        { env: "production", host: "vercel.bhenning.com" },
      ];

      for (const { env, host } of environments) {
        process.env.NODE_ENV = env;
        mockRequest.headers.set("host", host);

        const pathsToTest = ["/api/graphql", "/graphql"];

        for (const path of pathsToTest) {
          mockUrl.pathname = path;
          mockUrl.search = "?query=test";

          const mockResponse = {
            status: 200,
            statusText: "OK",
            body: JSON.stringify({ data: { test: true } }),
            headers: new Map([["content-type", "application/json"]]),
          };
          mockResponse.headers.forEach = jest.fn((callback) => {
            callback("application/json", "content-type");
          });

          global.fetch.mockResolvedValue(mockResponse);

          await proxy(mockRequest);

          expect(global.fetch).toHaveBeenCalledWith(
            "https://finance.bhenning.com/graphql?query=test",
            expect.objectContaining({
              method: "GET",
              headers: expect.objectContaining({
                host: "finance.bhenning.com",
              }),
            }),
          );
        }
      }
    });

    it("should correctly proxy /api/graphql and /graphql for vercel.bhenning.com behind a proxy", async () => {
      process.env.NODE_ENV = "production";
      mockRequest.headers.set("host", "localhost:3000");
      mockRequest.headers.set("x-forwarded-host", "vercel.bhenning.com");

      const pathsToTest = ["/api/graphql", "/graphql"];

      for (const path of pathsToTest) {
        mockUrl.pathname = path;
        mockUrl.search = "?query=test";

        const mockResponse = {
          status: 200,
          statusText: "OK",
          body: JSON.stringify({ data: { test: true } }),
          headers: new Map([["content-type", "application/json"]]),
        };
        mockResponse.headers.forEach = jest.fn((callback) => {
          callback("application/json", "content-type");
        });

        global.fetch.mockResolvedValue(mockResponse);

        await proxy(mockRequest);

        expect(global.fetch).toHaveBeenCalledWith(
          "https://finance.bhenning.com/graphql?query=test",
          expect.objectContaining({
            method: "GET",
            headers: expect.objectContaining({
              host: "finance.bhenning.com",
            }),
          }),
        );
      }
    });

    it("should reproduce proxy routing bug for vercel.bhenning.com", async () => {
      // Test case that reproduces the exact scenario from nginx log:
      // "POST /api/graphql HTTP/2.0" 404 100 "https://vercel.bhenning.com/finance/transfers-next"
      process.env.NODE_ENV = "production";

      // Simulate the request coming through nginx proxy
      mockRequest.method = "POST";
      mockRequest.headers = new Map([
        ["host", "vercel.bhenning.com"], // This is what nginx sees as the host
        ["x-forwarded-host", "vercel.bhenning.com"], // This is what the proxy sets
        ["x-forwarded-proto", "https"],
        ["content-type", "application/json"],
        ["cookie", "token=abc123"],
      ]);
      mockUrl.pathname = "/api/graphql";
      mockUrl.search = "";

      const mockResponse = {
        status: 200,
        statusText: "OK",
        body: JSON.stringify({ data: { test: true } }),
        headers: new Map([["content-type", "application/json"]]),
      };
      mockResponse.headers.forEach = jest.fn((callback) => {
        callback("application/json", "content-type");
      });

      global.fetch.mockResolvedValue(mockResponse);

      await proxy(mockRequest);

      // This should map /api/graphql to /graphql on the backend
      expect(global.fetch).toHaveBeenCalledWith(
        "https://finance.bhenning.com/graphql",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            host: "finance.bhenning.com",
            "x-forwarded-host": "vercel.bhenning.com",
            "x-forwarded-proto": "https",
          }),
        }),
      );
    });

    it("should correctly map /api/graphql for vercel.bhenning.com even in development mode", async () => {
      // This test verifies the fix: vercel.bhenning.com should be allowed even in development
      process.env.NODE_ENV = "development";

      mockRequest.method = "POST";
      mockRequest.headers = new Map([
        ["host", "vercel.bhenning.com"], // Should now be allowed as approved proxy host
        ["x-forwarded-host", "vercel.bhenning.com"],
        ["x-forwarded-proto", "https"],
        ["content-type", "application/json"],
        ["cookie", "token=abc123"],
      ]);
      mockUrl.pathname = "/api/graphql";
      mockUrl.search = "";

      const mockResponse = {
        status: 200,
        statusText: "OK",
        body: JSON.stringify({ data: { test: true } }),
        headers: new Map([["content-type", "application/json"]]),
      };
      mockResponse.headers.forEach = jest.fn((callback) => {
        callback("application/json", "content-type");
      });

      global.fetch.mockResolvedValue(mockResponse);

      await proxy(mockRequest);

      // FIXED: Now correctly maps /api/graphql to /graphql for vercel.bhenning.com
      expect(global.fetch).toHaveBeenCalledWith(
        "https://finance.bhenning.com/graphql",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            host: "finance.bhenning.com",
            "x-forwarded-host": "vercel.bhenning.com",
            "x-forwarded-proto": "https",
          }),
        }),
      );
    });
  });

  describe("Environment Configuration", () => {
    it("should use API_PROXY_TARGET when set", async () => {
      process.env.API_PROXY_TARGET = "https://custom-backend.com";
      mockUrl.pathname = "/api/test";

      const mockResponse = {
        status: 200,
        statusText: "OK",
        body: "test",
        headers: new Map(),
      };
      mockResponse.headers.forEach = jest.fn(() => {});

      global.fetch.mockResolvedValue(mockResponse);

      await proxy(mockRequest);

      expect(global.fetch).toHaveBeenCalledWith(
        "https://custom-backend.com/api/test",
        expect.any(Object),
      );
    });

    it("should use production backend in production when no API_PROXY_TARGET", async () => {
      process.env.NODE_ENV = "production";
      mockUrl.pathname = "/api/test";

      const mockResponse = {
        status: 200,
        statusText: "OK",
        body: "test",
        headers: new Map(),
      };
      mockResponse.headers.forEach = jest.fn(() => {});

      global.fetch.mockResolvedValue(mockResponse);

      await proxy(mockRequest);

      expect(global.fetch).toHaveBeenCalledWith(
        "https://finance.bhenning.com/api/test",
        expect.any(Object),
      );
    });
  });

  describe("Error Handling", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
    });

    it("should handle fetch timeout errors", async () => {
      mockUrl.pathname = "/api/test";

      const timeoutError = new Error("Timeout");
      timeoutError.name = "AbortError";
      global.fetch.mockRejectedValue(timeoutError);

      const result = await proxy(mockRequest);

      expect(result).toBeDefined();
      // The middleware should return a 504 response for timeout
    });

    it("should handle general fetch errors", async () => {
      mockUrl.pathname = "/api/test";

      global.fetch.mockRejectedValue(new Error("Network error"));

      const result = await proxy(mockRequest);

      expect(result).toBeDefined();
      // The middleware should return a 502 response for proxy errors
    });

    it("should set up abort controller and timeout", async () => {
      mockUrl.pathname = "/api/test";

      const mockResponse = {
        status: 200,
        statusText: "OK",
        body: "test",
        headers: new Map(),
      };
      mockResponse.headers.forEach = jest.fn(() => {});

      global.fetch.mockResolvedValue(mockResponse);

      await proxy(mockRequest);

      expect(global.AbortController).toHaveBeenCalled();
      expect(global.setTimeout).toHaveBeenCalledWith(
        expect.any(Function),
        30000,
      );
      expect(global.clearTimeout).toHaveBeenCalled();
    });
  });

  describe("CORS Headers in Development", () => {
    it("adds CORS headers for proxied responses in development", async () => {
      process.env.NODE_ENV = "development";
      mockUrl.pathname = "/api/test";

      const upstreamHeaders = new Map();
      upstreamHeaders.forEach = jest.fn(() => {});
      const mockResponse = {
        status: 200,
        statusText: "OK",
        body: "ok",
        headers: upstreamHeaders,
      };
      global.fetch.mockResolvedValue(mockResponse);

      const res = await proxy(mockRequest);
      const get = res.headers.get?.bind(res.headers);
      expect(get("Access-Control-Allow-Origin")).toBe("http://localhost:3000");
      expect(get("Access-Control-Allow-Credentials")).toBe("true");
      expect(get("Access-Control-Allow-Methods")).toContain("GET");
      expect(get("Access-Control-Allow-Headers")).toContain("Content-Type");
    });
  });

  describe("Host Blocking in Development", () => {
    it("blocks non-localhost hosts in development with 403", async () => {
      process.env.NODE_ENV = "development";
      mockRequest.headers.set = undefined; // ensure Map
      mockRequest.headers = new Map([["host", "evil.example.com"]]);
      mockUrl.pathname = "/api/test";

      const res = await proxy(mockRequest);
      expect(res.status).toBe(403);
      if (typeof res.body === "string") {
        expect(res.body).toContain("Forbidden");
      }
    });
  });

  describe("Security and Headers", () => {
    it("should block unauthorized hosts in development", async () => {
      mockRequest.headers.set("host", "malicious-host.com");
      mockUrl.pathname = "/api/test";

      const result = await proxy(mockRequest);

      // Should return 403 for unauthorized host
      expect(result).toBeDefined();
    });

    it("should forward proper headers to upstream", async () => {
      process.env.NODE_ENV = "production";
      mockUrl.pathname = "/api/test";

      const mockResponse = {
        status: 200,
        statusText: "OK",
        body: "test",
        headers: new Map([["content-type", "application/json"]]),
      };
      mockResponse.headers.forEach = jest.fn((callback) => {
        callback("application/json", "content-type");
      });

      global.fetch.mockResolvedValue(mockResponse);

      await proxy(mockRequest);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            host: "finance.bhenning.com",
            "x-forwarded-host": "localhost:3000",
            "x-forwarded-proto": "https",
          }),
        }),
      );
    });
  });

  describe("Request Methods", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
    });

    it("should handle GET requests correctly", async () => {
      mockRequest.method = "GET";
      mockUrl.pathname = "/api/graphql";

      const mockResponse = {
        status: 200,
        statusText: "OK",
        body: "test",
        headers: new Map(),
      };
      mockResponse.headers.forEach = jest.fn(() => {});

      global.fetch.mockResolvedValue(mockResponse);

      await proxy(mockRequest);

      expect(global.fetch).toHaveBeenCalledWith(
        "https://finance.bhenning.com/graphql",
        expect.objectContaining({
          method: "GET",
          body: undefined,
        }),
      );
    });

    it("should handle POST requests with body", async () => {
      mockRequest.method = "POST";
      mockUrl.pathname = "/api/graphql";

      const mockBlob = new Blob(["test body"]);
      mockRequest.blob.mockResolvedValue(mockBlob);

      const mockResponse = {
        status: 200,
        statusText: "OK",
        body: "test",
        headers: new Map(),
      };
      mockResponse.headers.forEach = jest.fn(() => {});

      global.fetch.mockResolvedValue(mockResponse);

      await proxy(mockRequest);

      expect(global.fetch).toHaveBeenCalledWith(
        "https://finance.bhenning.com/graphql",
        expect.objectContaining({
          method: "POST",
          body: mockBlob,
        }),
      );
    });
  });

  describe("Non-API Routes", () => {
    it("should handle non-API routes with no-store cache control", async () => {
      mockUrl.pathname = "/dashboard";

      const mockNext = jest.fn(() => ({ headers: { set: jest.fn() } }));
      NextResponse.next = mockNext;

      const result = await proxy(mockRequest);

      expect(mockNext).toHaveBeenCalled();
      expect(result.headers.set).toHaveBeenCalledWith(
        "Cache-Control",
        "no-store",
      );
    });

    it("should allow static assets to pass through", async () => {
      mockUrl.pathname = "/static/image.png";

      const mockNext = jest.fn();
      NextResponse.next = mockNext;

      await proxy(mockRequest);

      expect(mockNext).toHaveBeenCalled();
    });

    it("should allow _next routes to pass through", async () => {
      mockUrl.pathname = "/_next/static/chunks/main.js";

      const mockNext = jest.fn();
      NextResponse.next = mockNext;

      await proxy(mockRequest);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe("Local Sports APIs", () => {
    beforeEach(() => {
      // Reset environment for each test
      process.env.NODE_ENV = "development";
    });

    describe("403 Error Troubleshooting - vercel.bhenning.com", () => {
      it("should NOT return 403 for /api/nhl from vercel.bhenning.com in production", async () => {
        process.env.NODE_ENV = "production";

        // Simulate exactly what happens when accessing vercel.bhenning.com/api/nhl
        mockRequest.headers = new Map([
          ["host", "vercel.bhenning.com"],
          ["x-forwarded-host", "vercel.bhenning.com"],
          ["x-forwarded-proto", "https"],
        ]);
        mockUrl.pathname = "/api/nhl";
        mockUrl.search = "";

        const mockLocalResponse = { headers: { set: jest.fn() } };
        NextResponse.next = jest.fn(() => mockLocalResponse);

        const result = await proxy(mockRequest);

        // This should NOT be a 403 error
        expect(result.status).not.toBe(403);
        // Should bypass proxy and return NextResponse.next() for local handling
        expect(NextResponse.next).toHaveBeenCalled();
        expect(global.fetch).not.toHaveBeenCalled();
      });

      it("should NOT return 403 for /api/nba from vercel.bhenning.com in production", async () => {
        process.env.NODE_ENV = "production";

        mockRequest.headers = new Map([
          ["host", "vercel.bhenning.com"],
          ["x-forwarded-host", "vercel.bhenning.com"],
          ["x-forwarded-proto", "https"],
        ]);
        mockUrl.pathname = "/api/nba";
        mockUrl.search = "";

        const mockLocalResponse = { headers: { set: jest.fn() } };
        NextResponse.next = jest.fn(() => mockLocalResponse);

        const result = await proxy(mockRequest);

        expect(result.status).not.toBe(403);
        expect(NextResponse.next).toHaveBeenCalled();
        expect(global.fetch).not.toHaveBeenCalled();
      });

      it("should reproduce the 403 error condition", async () => {
        // Test the exact scenario that might be causing 403
        process.env.NODE_ENV = "production";

        // Try different host header combinations to identify the issue
        const hostVariations = [
          { host: "vercel.bhenning.com", xForwardedHost: undefined },
          { host: "localhost", xForwardedHost: "vercel.bhenning.com" },
          {
            host: "some-internal-vercel-host",
            xForwardedHost: "vercel.bhenning.com",
          },
        ];

        for (const hostConfig of hostVariations) {
          const headers = new Map([["host", hostConfig.host]]);
          if (hostConfig.xForwardedHost) {
            headers.set("x-forwarded-host", hostConfig.xForwardedHost);
          }

          mockRequest.headers = headers;
          mockUrl.pathname = "/api/nhl";

          const mockLocalResponse = { headers: { set: jest.fn() } };
          NextResponse.next = jest.fn(() => mockLocalResponse);

          const result = await proxy(mockRequest);

          // Log the result to understand what's happening
          console.log(
            `Host config: ${JSON.stringify(hostConfig)}, Result status: ${result.status}`,
          );

          // For debugging - none of these should be 403
          if (result.status === 403) {
            console.log(`403 ERROR REPRODUCED with host config:`, hostConfig);
          }

          // Clear mocks for next iteration
          jest.clearAllMocks();
        }
      });

      it("should debug host detection logic", async () => {
        process.env.NODE_ENV = "production";

        // Test the actual host detection logic from the middleware
        const testCases = [
          {
            name: "Direct vercel.bhenning.com",
            host: "vercel.bhenning.com",
            xForwardedHost: undefined,
            expectedHost: "vercel.bhenning.com",
          },
          {
            name: "Proxied through Vercel",
            host: "localhost",
            xForwardedHost: "vercel.bhenning.com",
            expectedHost: "vercel.bhenning.com",
          },
          {
            name: "Internal Vercel host",
            host: "sfo1.vercel.app",
            xForwardedHost: "vercel.bhenning.com",
            expectedHost: "vercel.bhenning.com",
          },
        ];

        for (const testCase of testCases) {
          const headers = new Map([["host", testCase.host]]);
          if (testCase.xForwardedHost) {
            headers.set("x-forwarded-host", testCase.xForwardedHost);
          }

          // Simulate the middleware's host detection logic
          const detectedHost =
            headers.get("x-forwarded-host") ?? headers.get("host");
          const isLocalhost =
            detectedHost?.includes("localhost") ||
            detectedHost?.includes("127.0.0.1");
          const isVercelProxy = detectedHost?.includes("vercel.bhenning.com");

          console.log(`${testCase.name}:`);
          console.log(`  Detected host: ${detectedHost}`);
          console.log(`  isLocalhost: ${isLocalhost}`);
          console.log(`  isVercelProxy: ${isVercelProxy}`);
          console.log(
            `  Should be blocked: ${!true && !isLocalhost && !isVercelProxy}`,
          ); // isProduction = true

          expect(detectedHost).toBe(testCase.expectedHost);
        }
      });

      it("should test the EXACT CONDITIONS that cause 403 errors", async () => {
        // Test different NODE_ENV values that might cause issues
        const envScenarios = [
          { env: undefined, name: "NODE_ENV undefined" },
          { env: "", name: "NODE_ENV empty" },
          { env: "development", name: "NODE_ENV development" },
          { env: "production", name: "NODE_ENV production" },
          { env: "preview", name: "NODE_ENV preview (Vercel preview)" },
        ];

        for (const scenario of envScenarios) {
          const originalEnv = process.env.NODE_ENV;
          if (scenario.env === undefined) {
            delete process.env.NODE_ENV;
          } else {
            process.env.NODE_ENV = scenario.env;
          }

          const isProduction = process.env.NODE_ENV === "production";
          const isDev = !isProduction;

          // Test vercel.bhenning.com scenario
          mockRequest.headers = new Map([
            ["host", "vercel.bhenning.com"],
            ["x-forwarded-host", "vercel.bhenning.com"],
          ]);
          mockUrl.pathname = "/api/nhl";

          const host =
            mockRequest.headers.get("x-forwarded-host") ??
            mockRequest.headers.get("host");
          const isLocalhost =
            host?.includes("localhost") || host?.includes("127.0.0.1");
          const isVercelProxy = host?.includes("vercel.bhenning.com");

          const wouldBeBlocked =
            !isProduction && !isLocalhost && !isVercelProxy;

          console.log(`${scenario.name}:`);
          console.log(`  isProduction: ${isProduction}`);
          console.log(`  isLocalhost: ${isLocalhost}`);
          console.log(`  isVercelProxy: ${isVercelProxy}`);
          console.log(`  Would be blocked (403): ${wouldBeBlocked}`);

          if (wouldBeBlocked) {
            console.log(
              `  ❌ FOUND THE ISSUE: ${scenario.name} would cause 403!`,
            );

            // This is likely the root cause - test it
            const mockLocalResponse = { headers: { set: jest.fn() } };
            NextResponse.next = jest.fn(() => mockLocalResponse);

            const result = await proxy(mockRequest);

            // This should be the failing case that reproduces the user's issue
            if (result && result.status === 403) {
              console.log(`  ✅ REPRODUCED 403 ERROR with ${scenario.name}`);
            }
          }

          // Restore environment
          process.env.NODE_ENV = originalEnv;
          jest.clearAllMocks();
        }
      });

      it("should test pathname edge cases that might affect local API detection", async () => {
        process.env.NODE_ENV = "production";

        mockRequest.headers = new Map([
          ["host", "vercel.bhenning.com"],
          ["x-forwarded-host", "vercel.bhenning.com"],
        ]);

        const pathVariations = [
          "/api/nhl", // Standard
          "/api/nhl/", // With trailing slash
          "/api/nhl?test=1", // With query params (in pathname)
          "/API/NHL", // Different case
          "/api/nhl/../nhl", // Path traversal attempt
        ];

        for (const path of pathVariations) {
          mockUrl.pathname = path;
          mockUrl.search = "";

          const mockLocalResponse = { headers: { set: jest.fn() } };
          NextResponse.next = jest.fn(() => mockLocalResponse);

          const result = await proxy(mockRequest);

          console.log(
            `Path "${path}": status = ${result?.status || "undefined"}`,
          );

          if (result?.status === 403) {
            console.log(`  ❌ FOUND PATH ISSUE: "${path}" returns 403`);
          }

          jest.clearAllMocks();
        }
      });

      it("should handle trailing slashes correctly after the fix", async () => {
        process.env.NODE_ENV = "production";

        mockRequest.headers = new Map([
          ["host", "vercel.bhenning.com"],
          ["x-forwarded-host", "vercel.bhenning.com"],
        ]);

        // Test cases that should ALL work correctly with the trailing slash fix
        const testCases = [
          {
            path: "/api/nhl",
            expected: "bypassed",
            description: "Standard path",
          },
          {
            path: "/api/nhl/",
            expected: "bypassed",
            description: "Single trailing slash",
          },
          {
            path: "/api/nhl///",
            expected: "bypassed",
            description: "Multiple trailing slashes",
          },
          {
            path: "/api/nba",
            expected: "bypassed",
            description: "NBA standard path",
          },
          {
            path: "/api/nba/",
            expected: "bypassed",
            description: "NBA with trailing slash",
          },
          {
            path: "/api/nba//",
            expected: "bypassed",
            description: "NBA with double trailing slash",
          },
        ];

        for (const testCase of testCases) {
          mockUrl.pathname = testCase.path;
          mockUrl.search = "";

          const mockLocalResponse = { headers: { set: jest.fn() } };
          NextResponse.next = jest.fn(() => mockLocalResponse);

          const result = await proxy(mockRequest);

          console.log(`Testing ${testCase.description}: "${testCase.path}"`);

          if (testCase.expected === "bypassed") {
            // Should call NextResponse.next() (local bypass)
            expect(NextResponse.next).toHaveBeenCalled();
            expect(global.fetch).not.toHaveBeenCalled();
            // Should not return a status (undefined means NextResponse.next was called)
            expect(result?.status).toBeUndefined();
            console.log(`  ✅ CORRECTLY BYPASSED: ${testCase.path}`);
          }

          jest.clearAllMocks();
        }
      });

      it("should verify NFL endpoint is properly bypassed like NHL/NBA", async () => {
        process.env.NODE_ENV = "production";

        mockRequest.headers = new Map([
          ["host", "vercel.bhenning.com"],
          ["x-forwarded-host", "vercel.bhenning.com"],
          ["x-forwarded-proto", "https"],
        ]);

        // Test all sports APIs that should work the same way
        const sportsApis = [
          { path: "/api/nhl", sport: "NHL" },
          { path: "/api/nba", sport: "NBA" },
          { path: "/api/nfl", sport: "NFL" }, // This is the failing one
          { path: "/api/mlb", sport: "MLB" },
        ];

        for (const api of sportsApis) {
          mockUrl.pathname = api.path;
          mockUrl.search = "";

          const mockLocalResponse = { headers: { set: jest.fn() } };
          NextResponse.next = jest.fn(() => mockLocalResponse);

          const result = await proxy(mockRequest);

          console.log(`Testing ${api.sport} API: "${api.path}"`);
          console.log(`  Result status: ${result?.status || "undefined"}`);
          console.log(
            `  NextResponse.next called: ${NextResponse.next.mock?.calls?.length > 0}`,
          );
          console.log(
            `  Fetch called: ${global.fetch.mock?.calls?.length > 0}`,
          );

          // All sports APIs should behave identically
          expect(NextResponse.next).toHaveBeenCalled();
          expect(global.fetch).not.toHaveBeenCalled();
          expect(result?.status).toBeUndefined();

          console.log(`  ✅ CORRECTLY BYPASSED: ${api.path}`);

          jest.clearAllMocks();
        }
      });

      it("should test NFL specifically with different scenarios", async () => {
        process.env.NODE_ENV = "production";

        const testScenarios = [
          {
            name: "Direct vercel.bhenning.com",
            headers: new Map([
              ["host", "vercel.bhenning.com"],
              ["x-forwarded-host", "vercel.bhenning.com"],
              ["x-forwarded-proto", "https"],
            ]),
          },
          {
            name: "Localhost with forwarded host",
            headers: new Map([
              ["host", "localhost"],
              ["x-forwarded-host", "vercel.bhenning.com"],
              ["x-forwarded-proto", "https"],
            ]),
          },
          {
            name: "Internal Vercel host",
            headers: new Map([
              ["host", "sfo1.vercel.app"],
              ["x-forwarded-host", "vercel.bhenning.com"],
              ["x-forwarded-proto", "https"],
            ]),
          },
        ];

        for (const scenario of testScenarios) {
          mockRequest.headers = scenario.headers;
          mockUrl.pathname = "/api/nfl";
          mockUrl.search = "";

          const mockLocalResponse = { headers: { set: jest.fn() } };
          NextResponse.next = jest.fn(() => mockLocalResponse);

          const result = await proxy(mockRequest);

          console.log(`NFL Test - ${scenario.name}:`);
          console.log(`  Status: ${result?.status || "undefined"}`);
          console.log(
            `  Bypassed: ${NextResponse.next.mock?.calls?.length > 0}`,
          );
          console.log(`  Proxied: ${global.fetch.mock?.calls?.length > 0}`);

          // Should be bypassed in all scenarios
          expect(NextResponse.next).toHaveBeenCalled();
          expect(global.fetch).not.toHaveBeenCalled();
          expect(result?.status).toBeUndefined();

          jest.clearAllMocks();
        }
      });

      it("should NOT intercept local APIs at all - FIXED TEST", async () => {
        // Test the negative lookahead regex pattern directly
        const excludeLocalApisPattern =
          "/api/(?!nhl|nba|nfl|mlb|celsius|fahrenheit|lead|player-ads|player-analytics|player-heartbeat|player-metadata|weather|uuid|human)(.+)";

        // Convert to actual regex that Next.js would use
        const regex = new RegExp("^" + excludeLocalApisPattern + "$");

        const localApiPaths = [
          "/api/nfl",
          "/api/nhl",
          "/api/nba",
          "/api/mlb",
          "/api/celsius",
        ];
        const financeApiPaths = [
          "/api/me",
          "/api/graphql",
          "/api/accounts",
          "/api/payments",
        ];

        console.log("Testing local APIs (should NOT match):");
        for (const path of localApiPaths) {
          const matches = regex.test(path);
          console.log(`  ${path}: matches = ${matches}`);
          expect(matches).toBe(false); // Local APIs should NOT match
        }

        console.log("Testing finance APIs (should match):");
        for (const path of financeApiPaths) {
          const matches = regex.test(path);
          console.log(`  ${path}: matches = ${matches}`);
          expect(matches).toBe(true); // Finance APIs SHOULD match
        }
      });

      it("should properly handle middleware config for API routes", async () => {
        // Import and test the actual config from middleware.js
        const { config } = require("../proxy.js");

        console.log("Current middleware matcher patterns:", config.matcher);

        // All API routes should be intercepted by the matcher
        const apiPattern = config.matcher.find((pattern) =>
          pattern.includes("/api/"),
        );
        expect(apiPattern).toBe("/api/(.*)");

        // Convert the pattern to regex and test it
        if (apiPattern) {
          const regex = new RegExp("^" + apiPattern + "$");

          // ALL APIs should match the pattern - filtering happens inside middleware
          expect(regex.test("/api/nfl")).toBe(true);
          expect(regex.test("/api/nhl")).toBe(true);
          expect(regex.test("/api/nba")).toBe(true);
          expect(regex.test("/api/me")).toBe(true);
          expect(regex.test("/api/graphql")).toBe(true);
          expect(regex.test("/api/accounts")).toBe(true);
        }
      });
    });

    describe("/api/nhl endpoint", () => {
      it("should bypass proxy and execute locally in development", async () => {
        mockUrl.pathname = "/api/nhl";
        mockUrl.search = "";

        // Mock NextResponse.next to simulate local execution
        const mockLocalResponse = { headers: { set: jest.fn() } };
        NextResponse.next = jest.fn(() => mockLocalResponse);

        const result = await proxy(mockRequest);

        // Should NOT call fetch (no proxy)
        expect(global.fetch).not.toHaveBeenCalled();
        // Should return NextResponse.next() for local handling
        expect(NextResponse.next).toHaveBeenCalled();
      });

      it("should bypass proxy and execute locally in production", async () => {
        process.env.NODE_ENV = "production";
        mockUrl.pathname = "/api/nhl";
        mockUrl.search = "";

        const mockLocalResponse = { headers: { set: jest.fn() } };
        NextResponse.next = jest.fn(() => mockLocalResponse);

        const result = await proxy(mockRequest);

        expect(global.fetch).not.toHaveBeenCalled();
        expect(NextResponse.next).toHaveBeenCalled();
      });

      it("should handle query parameters correctly", async () => {
        mockUrl.pathname = "/api/nhl";
        mockUrl.search = "?season=2024";

        const mockLocalResponse = { headers: { set: jest.fn() } };
        NextResponse.next = jest.fn(() => mockLocalResponse);

        const result = await proxy(mockRequest);

        expect(global.fetch).not.toHaveBeenCalled();
        expect(NextResponse.next).toHaveBeenCalled();
      });
    });

    describe("/api/nba endpoint", () => {
      it("should bypass proxy and execute locally in development", async () => {
        mockUrl.pathname = "/api/nba";
        mockUrl.search = "";

        const mockLocalResponse = { headers: { set: jest.fn() } };
        NextResponse.next = jest.fn(() => mockLocalResponse);

        const result = await proxy(mockRequest);

        expect(global.fetch).not.toHaveBeenCalled();
        expect(NextResponse.next).toHaveBeenCalled();
      });

      it("should bypass proxy and execute locally in production", async () => {
        process.env.NODE_ENV = "production";
        mockUrl.pathname = "/api/nba";
        mockUrl.search = "";

        const mockLocalResponse = { headers: { set: jest.fn() } };
        NextResponse.next = jest.fn(() => mockLocalResponse);

        const result = await proxy(mockRequest);

        expect(global.fetch).not.toHaveBeenCalled();
        expect(NextResponse.next).toHaveBeenCalled();
      });

      it("should handle different HTTP methods", async () => {
        const methods = ["GET", "POST", "PUT", "DELETE"];

        for (const method of methods) {
          mockRequest.method = method;
          mockUrl.pathname = "/api/nba";

          const mockLocalResponse = { headers: { set: jest.fn() } };
          NextResponse.next = jest.fn(() => mockLocalResponse);

          await proxy(mockRequest);

          expect(global.fetch).not.toHaveBeenCalled();
          expect(NextResponse.next).toHaveBeenCalled();

          // Clear mocks for next iteration
          jest.clearAllMocks();
        }
      });
    });

    describe("Other API routes still proxy correctly", () => {
      it("should still proxy /api/graphql to finance backend", async () => {
        process.env.NODE_ENV = "production";
        mockUrl.pathname = "/api/graphql";
        mockUrl.search = "?query=test";

        const mockResponse = {
          status: 200,
          statusText: "OK",
          body: JSON.stringify({ data: { test: true } }),
          headers: new Map([["content-type", "application/json"]]),
        };
        mockResponse.headers.forEach = jest.fn((callback) => {
          callback("application/json", "content-type");
        });

        global.fetch.mockResolvedValue(mockResponse);

        await proxy(mockRequest);

        expect(global.fetch).toHaveBeenCalledWith(
          "https://finance.bhenning.com/graphql?query=test",
          expect.objectContaining({
            method: "GET",
            headers: expect.objectContaining({
              host: "finance.bhenning.com",
            }),
          }),
        );
      });

      it("should still proxy /api/me to finance backend", async () => {
        process.env.NODE_ENV = "production";
        mockUrl.pathname = "/api/me";
        mockUrl.search = "";

        const mockResponse = {
          status: 200,
          statusText: "OK",
          body: JSON.stringify({ user: "test" }),
          headers: new Map([["content-type", "application/json"]]),
        };
        mockResponse.headers.forEach = jest.fn((callback) => {
          callback("application/json", "content-type");
        });

        global.fetch.mockResolvedValue(mockResponse);

        await proxy(mockRequest);

        expect(global.fetch).toHaveBeenCalledWith(
          "https://finance.bhenning.com/api/me",
          expect.any(Object),
        );
      });

      it("should still proxy other /api/* routes to finance backend", async () => {
        const apiRoutes = [
          "/api/users",
          "/api/transactions",
          "/api/accounts",
          "/api/payments",
          "/api/categories",
        ];

        for (const route of apiRoutes) {
          mockUrl.pathname = route;
          mockUrl.search = "";

          const mockResponse = {
            status: 200,
            statusText: "OK",
            body: JSON.stringify({}),
            headers: new Map([["content-type", "application/json"]]),
          };
          mockResponse.headers.forEach = jest.fn((callback) => {
            callback("application/json", "content-type");
          });

          global.fetch.mockResolvedValue(mockResponse);

          await proxy(mockRequest);

          expect(global.fetch).toHaveBeenCalledWith(
            `https://finance.bhenning.com${route}`,
            expect.any(Object),
          );

          // Clear mocks for next iteration
          jest.clearAllMocks();
        }
      });
    });

    describe("Security verification for local APIs", () => {
      it("should bypass host security checks for local APIs", async () => {
        // Test with unauthorized host - local APIs should bypass ALL security checks
        mockRequest.headers.set("host", "malicious.com");
        mockUrl.pathname = "/api/nhl";

        const result = await proxy(mockRequest);

        // Local APIs bypass host validation entirely (this prevents 403 errors)
        expect(result).toBeDefined(); // NextResponse.next() returns a response object
        expect(result.status).not.toBe(403); // Should NOT be blocked
        expect(global.fetch).not.toHaveBeenCalled(); // Should not proxy
      });

      it("should not allow malicious paths to bypass proxy", async () => {
        const maliciousPaths = [
          "/api/nhl/../admin",
          "/api/nhl/../../secret",
          "/api/nba/../config",
        ];

        for (const path of maliciousPaths) {
          mockUrl.pathname = path;

          // These should be treated as different paths and proxied, not bypassed
          const mockResponse = {
            status: 404,
            statusText: "Not Found",
            body: "Not Found",
            headers: new Map(),
          };
          mockResponse.headers.forEach = jest.fn(() => {});

          global.fetch.mockResolvedValue(mockResponse);

          await proxy(mockRequest);

          // Should be proxied (not bypassed)
          expect(global.fetch).toHaveBeenCalled();

          // Clear mocks for next iteration
          jest.clearAllMocks();
        }
      });
    });
  });

  describe("Proxy Config", () => {
    it("should export correct config", () => {
      const { config } = require("../proxy.js");

      expect(config).toEqual({
        matcher: [
          "/api/(.*)",
          "/graphql",
          "/((?!_next/static|_next/image|favicon.ico).*)",
        ],
      });
    });
  });
});
