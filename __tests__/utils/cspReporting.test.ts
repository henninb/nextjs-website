describe("cspReporting", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    delete (window as any).cspHelper;
    jest.restoreAllMocks();
    jest.resetModules();
  });

  it("logs violations, sorts common entries, and generates policy updates", async () => {
    process.env.NODE_ENV = "development";
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    const mod = await import("../../utils/security/cspReporting");
    const { CSPManager } = mod;

    CSPManager.logViolation({
      documentURI: "https://app.example.com",
      referrer: "",
      blockedURI: "https://cdn.example.com/app.js",
      violatedDirective: "script-src",
      originalPolicy: "default-src 'self'",
      effectiveDirective: "script-src",
      statusCode: 200,
      scriptSample: "",
    });

    CSPManager.logViolation({
      documentURI: "https://app.example.com",
      referrer: "",
      blockedURI: "https://cdn.example.com/app.js",
      violatedDirective: "script-src",
      originalPolicy: "default-src 'self'",
      effectiveDirective: "script-src",
      statusCode: 200,
      scriptSample: "",
    });

    CSPManager.logViolation({
      documentURI: "https://app.example.com",
      referrer: "",
      blockedURI: "https://fonts.example.com/font.woff2",
      violatedDirective: "font-src",
      originalPolicy: "default-src 'self'",
      effectiveDirective: "font-src",
      statusCode: 200,
      scriptSample: "",
    });

    expect(warnSpy).toHaveBeenCalled();

    const common = CSPManager.getCommonViolations();
    expect(common[0]).toEqual({
      pattern: "script-src:https://cdn.example.com/app.js",
      count: 2,
      suggestion: 'Add "https://https" to script-src directive',
    });

    expect(CSPManager.generatePolicyUpdate()).toContain(
      "CSP Policy Update Suggestions:",
    );
  });

  it("returns a friendly message when no violations exist", async () => {
    jest.resetModules();
    process.env.NODE_ENV = "test";
    const { CSPManager } = await import("../../utils/security/cspReporting");

    expect(CSPManager.generatePolicyUpdate()).toBe(
      "No CSP violations detected - current policy looks good!",
    );
  });

  it("assesses blocked resources across risk levels", async () => {
    const { CSPManager } = await import("../../utils/security/cspReporting");

    expect(CSPManager.shouldTrustDomain("fonts.googleapis.com")).toBe(true);
    expect(CSPManager.shouldTrustDomain("assets.amazonaws.com")).toBe(true);
    expect(CSPManager.shouldTrustDomain("cdn.px-cloud.net")).toBe(true);
    expect(CSPManager.shouldTrustDomain("evil.com")).toBe(false);
    expect(CSPManager.shouldTrustDomain("unknown.example")).toBe(false);

    expect(CSPManager.assessBlockedResource("javascript:alert(1)")).toEqual({
      risk: "high",
      reason: "Contains potentially dangerous code execution patterns",
      recommendation: "Do not add to CSP - review code for safer alternatives",
    });

    expect(CSPManager.assessBlockedResource("http://cdn.example.com/file.js")).toEqual({
      risk: "medium",
      reason: "Non-HTTPS resource could be intercepted",
      recommendation: "Use HTTPS version if available",
    });

    expect(CSPManager.assessBlockedResource("https://unknown.example/file.js")).toEqual({
      risk: "medium",
      reason: "Domain not in trusted list",
      recommendation: "Verify domain legitimacy before adding to CSP",
    });

    expect(
      CSPManager.assessBlockedResource("https://fonts.googleapis.com/css2"),
    ).toEqual({
      risk: "low",
      reason: "Trusted domain with secure connection",
      recommendation: "Safe to add to CSP if resource is needed",
    });
  });

  it("adds development listener and cspHelper bootstrap", () => {
    process.env.NODE_ENV = "development";
    const addEventListenerSpy = jest.spyOn(document, "addEventListener");
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});

    jest.isolateModules(() => {
      const mod = require("../../utils/security/cspReporting");
      expect((window as any).cspHelper).toBeDefined();

      const handler = addEventListenerSpy.mock.calls.find(
        ([event]) => event === "securitypolicyviolation",
      )?.[1] as EventListener;

      expect(typeof handler).toBe("function");

      handler({
        documentURI: "https://app.example.com",
        referrer: "",
        blockedURI: "https://api.weather.com/data",
        violatedDirective: "connect-src",
        originalPolicy: "default-src 'self'",
        effectiveDirective: "connect-src",
        statusCode: 200,
        sample: "",
        sourceFile: "app.js",
        lineNumber: 10,
        columnNumber: 2,
      } as any);

      expect(mod.CSPManager.getCommonViolations()[0]).toMatchObject({
        pattern: "connect-src:https://api.weather.com/data",
      });

      (window as any).cspHelper.getPolicyUpdate();
      expect(logSpy).toHaveBeenCalled();
    });
  });
});
