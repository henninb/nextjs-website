import { NextResponse } from "next/server";
import proxy from "../proxy.js";

// Mock NextResponse.next() to track calls
jest.mock("next/server", () => ({
  NextResponse: class {
    constructor(body, init) {
      this.body = body;
      this.status = init?.status;
      this.headers = new Headers(init?.headers);
    }
    static next = jest.fn(() => ({}));
    static rewrite = jest.fn();
    static redirect = jest.fn();
    static json = jest.fn();
  },
}));

// Mock global fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    headers: new Headers(),
  }),
);

const createMockRequest = (url, host) => {
  const nextUrl = new URL(url);
  nextUrl.clone = () => nextUrl;
  return {
    nextUrl,
    headers: new Headers({ host }),
    blob: jest.fn(() => Promise.resolve(new Blob())),
  };
};

describe("Proxy Local API Handling", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const localApis = [
    "/api/nhl",
    "/api/nba",
    "/api/mlb",
    "/api/nfl",
    "/api/celsius",
    "/api/fahrenheit",
    "/api/lead",
    "/api/player-ads",
    "/api/player-analytics",
    "/api/player-heartbeat",
    "/api/player-metadata",
    "/api/weather",
    "/api/uuid",
    "/api/uuid/generate",
    "/api/human",
    "/api/health",
  ];

  const proxiedApis = ["/api/users", "/api/graphql", "/graphql"];

  describe("Production Environment (Vercel)", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
    });

    localApis.forEach((path) => {
      it(`should bypass proxy for ${path} in production`, async () => {
        const req = createMockRequest(
          `https://vercel.bhenning.com${path}`,
          "vercel.bhenning.com",
        );
        await proxy(req);
        expect(NextResponse.next).toHaveBeenCalled();
        expect(global.fetch).not.toHaveBeenCalled();
      });
    });

    proxiedApis.forEach((path) => {
      it(`should proxy ${path} in production`, async () => {
        const req = createMockRequest(
          `https://vercel.bhenning.com${path}`,
          "vercel.bhenning.com",
        );
        await proxy(req);
        expect(NextResponse.next).not.toHaveBeenCalled();
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  describe("Development Environment (Localhost)", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development";
    });

    localApis.forEach((path) => {
      it(`should bypass proxy for ${path} in development`, async () => {
        const req = createMockRequest(
          `http://localhost:3000${path}`,
          "localhost:3000",
        );
        await proxy(req);
        expect(NextResponse.next).toHaveBeenCalled();
        expect(global.fetch).not.toHaveBeenCalled();
      });
    });

    proxiedApis.forEach((path) => {
      it(`should proxy ${path} in development`, async () => {
        const req = createMockRequest(
          `http://localhost:3000${path}`,
          "localhost:3000",
        );
        await proxy(req);
        expect(NextResponse.next).not.toHaveBeenCalled();
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });
});
