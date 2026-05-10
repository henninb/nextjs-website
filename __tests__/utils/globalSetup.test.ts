describe("globalSetup", () => {
  const originalEnv = process.env.NODE_ENV;
  const originalFetch = window.fetch;
  const originalXhr = global.XMLHttpRequest;
  const originalCookieDescriptor = Object.getOwnPropertyDescriptor(
    Document.prototype,
    "cookie",
  );

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    window.fetch = originalFetch;
    global.XMLHttpRequest = originalXhr;
    if (originalCookieDescriptor) {
      Object.defineProperty(
        Document.prototype,
        "cookie",
        originalCookieDescriptor,
      );
    }
    delete (window as any)._pxCustomAbrDomains;
    jest.restoreAllMocks();
    jest.resetModules();
  });

  it("skips setup in development mode", () => {
    process.env.NODE_ENV = "development";
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    jest.isolateModules(() => {
      const { setupGlobalAPIs } = require("../../utils/globalSetup");
      setupGlobalAPIs();
    });

    expect(logSpy).toHaveBeenCalledWith(
      "GlobalSetup: Skipped in development mode to prevent HMR issues",
    );
    expect((window as any)._pxCustomAbrDomains).toBeUndefined();
  });

  it("configures xhr and fetch cookie synchronization in production", async () => {
    process.env.NODE_ENV = "production";

    Object.defineProperty(Document.prototype, "cookie", {
      configurable: true,
      get: () =>
        "_px2=token2; other=ignore; _px3=token3; pxcts=session; ignored=value",
    });

    const fetchMock = jest.fn().mockResolvedValue("ok");
    window.fetch = fetchMock as typeof window.fetch;

    class MockXMLHttpRequest {
      setRequestHeader = jest.fn();

      open(_method: string, _url: string) {
        return undefined;
      }
    }

    global.XMLHttpRequest = MockXMLHttpRequest as any;

    jest.isolateModules(() => {
      const { setupGlobalAPIs } = require("../../utils/globalSetup");
      setupGlobalAPIs();
    });

    expect((window as any)._pxCustomAbrDomains).toEqual([
      "amazonaws.com",
      "execute-api.us-east-1.amazonaws.com",
    ]);

    const xhr = new XMLHttpRequest() as any;
    xhr.open("GET", "https://api.amazonaws.com/resource");
    expect(xhr.setRequestHeader).toHaveBeenCalledWith(
      "x-px-cookies",
      "_px2=token2; _px3=token3; pxcts=session",
    );

    xhr.setRequestHeader.mockClear();
    xhr.open("GET", "https://example.com/resource");
    expect(xhr.setRequestHeader).not.toHaveBeenCalled();

    await window.fetch("https://service.amazonaws.com/graphql");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://service.amazonaws.com/graphql",
      {
        headers: {
          "x-px-cookies": "_px2=token2; _px3=token3; pxcts=session",
        },
      },
    );

    await window.fetch("https://example.com/graphql", {
      headers: { existing: "header" },
    });
    expect(fetchMock).toHaveBeenLastCalledWith("https://example.com/graphql", {
      headers: { existing: "header" },
    });
  });

  it("runs setup only once per module instance", () => {
    process.env.NODE_ENV = "production";
    const fetchMock = jest.fn().mockResolvedValue("ok");
    window.fetch = fetchMock as typeof window.fetch;

    jest.isolateModules(() => {
      const { setupGlobalAPIs } = require("../../utils/globalSetup");
      setupGlobalAPIs();
      const firstWrappedFetch = window.fetch;
      setupGlobalAPIs();
      expect(window.fetch).toBe(firstWrappedFetch);
    });
  });

  it("logs errors thrown while syncing xhr cookies", () => {
    process.env.NODE_ENV = "production";
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    Object.defineProperty(Document.prototype, "cookie", {
      configurable: true,
      get: () => "_px2=token2",
    });

    class MockXMLHttpRequest {
      setRequestHeader() {
        throw new Error("header failure");
      }

      open(_method: string, _url: string) {
        return undefined;
      }
    }

    global.XMLHttpRequest = MockXMLHttpRequest as any;

    jest.isolateModules(() => {
      const { setupGlobalAPIs } = require("../../utils/globalSetup");
      setupGlobalAPIs();
    });

    const xhr = new XMLHttpRequest();
    xhr.open("GET", "https://api.amazonaws.com/resource");

    expect(errorSpy).toHaveBeenCalled();
  });
});
