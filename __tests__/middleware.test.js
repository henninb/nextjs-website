/**
 * @jest-environment jsdom
 */

import { NextResponse } from "next/server";
import { middleware } from "../middleware.js";

// Enhanced NextResponse mock to support constructor usage and headers
jest.mock("next/server", () => {
  const makeHeaders = (init = undefined) => {
    // Use the custom global Headers from jest.setup if available
    const H = global.Headers || class HeadersPolyfill {
      constructor() { this._map = new Map(); }
      set(k, v) { this._map.set(String(k).toLowerCase(), v); }
      get(k) { return this._map.get(String(k).toLowerCase()); }
      forEach(cb) { this._map.forEach((v, k) => cb(v, k)); }
      entries() { return this._map.entries(); }
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

describe("Middleware", () => {
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

      await middleware(mockRequest);

      expect(global.fetch).toHaveBeenCalledWith(
        "https://finance.bhenning.com/graphql?query=test",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            host: "finance.bhenning.com",
          }),
        })
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

      await middleware(mockRequest);

      expect(global.fetch).toHaveBeenCalledWith(
        "https://finance.bhenning.com/api/me",
        expect.any(Object)
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

      await middleware(mockRequest);

      expect(global.fetch).toHaveBeenCalledWith(
        "https://finance.bhenning.com/api/users?limit=10",
        expect.any(Object)
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

      await middleware(mockRequest);

      expect(global.fetch).toHaveBeenCalledWith(
        "https://finance.bhenning.com/graphql?query=test",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            host: "finance.bhenning.com",
          }),
        })
      );
    });
  });

  describe("Cookie Rewriting", () => {
    it("rewrites auth Set-Cookie for localhost in development", async () => {
      process.env.NODE_ENV = "development";
      mockUrl.pathname = "/api/test";

      const upstreamHeaders = new Map();
      upstreamHeaders.forEach = jest.fn((cb) => {
        cb("token=abc123; Path=/; Domain=.bhenning.com; Secure; SameSite=None", "set-cookie");
      });
      const mockResponse = {
        status: 200,
        statusText: "OK",
        body: "ok",
        headers: upstreamHeaders,
      };
      global.fetch.mockResolvedValue(mockResponse);

      const res = await middleware(mockRequest);
      // Our NextResponse mock returns the options.headers as provided by middleware
      const setCookie = res.headers.get ? res.headers.get("set-cookie") : undefined;
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

      const cookieValue = "theme=dark; Path=/; Domain=.bhenning.com; Secure; SameSite=None";
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

      const res = await middleware(mockRequest);
      const setCookie = res.headers.get ? res.headers.get("set-cookie") : undefined;
      expect(setCookie).toBe(cookieValue);
    });

    it("does not rewrite auth cookies in production", async () => {
      process.env.NODE_ENV = "production";
      mockUrl.pathname = "/api/test";

      const cookieValue = "token=abc123; Path=/; Domain=.bhenning.com; Secure; SameSite=None";
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

      const res = await middleware(mockRequest);
      const setCookie = res.headers.get ? res.headers.get("set-cookie") : undefined;
      expect(setCookie).toBe(cookieValue);
    });
  });

  describe("Development Behavior", () => {
    it("should keep /api/graphql path unchanged in development", async () => {
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

      await middleware(mockRequest);

      expect(global.fetch).toHaveBeenCalledWith(
        "https://finance.bhenning.com/api/graphql?query=test",
        expect.any(Object)
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

      await middleware(mockRequest);

      expect(global.fetch).toHaveBeenCalledWith(
        "https://custom-backend.com/api/test",
        expect.any(Object)
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

      await middleware(mockRequest);

      expect(global.fetch).toHaveBeenCalledWith(
        "https://finance.bhenning.com/api/test",
        expect.any(Object)
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

      const result = await middleware(mockRequest);

      expect(result).toBeDefined();
      // The middleware should return a 504 response for timeout
    });

    it("should handle general fetch errors", async () => {
      mockUrl.pathname = "/api/test";
      
      global.fetch.mockRejectedValue(new Error("Network error"));

      const result = await middleware(mockRequest);

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

      await middleware(mockRequest);

      expect(global.AbortController).toHaveBeenCalled();
      expect(global.setTimeout).toHaveBeenCalledWith(expect.any(Function), 30000);
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

      const res = await middleware(mockRequest);
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
      mockRequest.headers = new Map([
        ["host", "evil.example.com"],
      ]);
      mockUrl.pathname = "/api/test";

      const res = await middleware(mockRequest);
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

      const result = await middleware(mockRequest);

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

      await middleware(mockRequest);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            host: "finance.bhenning.com",
            "x-forwarded-host": "localhost:3000",
            "x-forwarded-proto": "https",
          }),
        })
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

      await middleware(mockRequest);

      expect(global.fetch).toHaveBeenCalledWith(
        "https://finance.bhenning.com/graphql",
        expect.objectContaining({
          method: "GET",
          body: undefined,
        })
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

      await middleware(mockRequest);

      expect(global.fetch).toHaveBeenCalledWith(
        "https://finance.bhenning.com/graphql",
        expect.objectContaining({
          method: "POST",
          body: mockBlob,
        })
      );
    });
  });

  describe("Non-API Routes", () => {
    it("should handle non-API routes with no-store cache control", async () => {
      mockUrl.pathname = "/dashboard";
      
      const mockNext = jest.fn(() => ({ headers: { set: jest.fn() } }));
      NextResponse.next = mockNext;

      const result = await middleware(mockRequest);

      expect(mockNext).toHaveBeenCalled();
      expect(result.headers.set).toHaveBeenCalledWith("Cache-Control", "no-store");
    });

    it("should allow static assets to pass through", async () => {
      mockUrl.pathname = "/static/image.png";
      
      const mockNext = jest.fn();
      NextResponse.next = mockNext;

      await middleware(mockRequest);

      expect(mockNext).toHaveBeenCalled();
    });

    it("should allow _next routes to pass through", async () => {
      mockUrl.pathname = "/_next/static/chunks/main.js";
      
      const mockNext = jest.fn();
      NextResponse.next = mockNext;

      await middleware(mockRequest);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe("Middleware Config", () => {
    it("should export correct config", () => {
      const { config } = require("../middleware.js");
      
      expect(config).toEqual({
        matcher: [
          "/api/(.*)",
          "/graphql",
          "/((?!_next/static|_next/image|favicon.ico).*)",
        ],
        runtime: "experimental-edge",
      });
    });
  });
});
