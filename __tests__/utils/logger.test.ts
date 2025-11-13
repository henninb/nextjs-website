import {
  LogLevel,
  logger,
  createHookLogger,
  createTimer,
  logFunction,
} from "../../utils/logger";

describe("logger", () => {
  let consoleSpy: {
    log: jest.SpyInstance;
    warn: jest.SpyInstance;
    error: jest.SpyInstance;
  };

  beforeEach(() => {
    consoleSpy = {
      log: jest.spyOn(console, "log").mockImplementation(),
      warn: jest.spyOn(console, "warn").mockImplementation(),
      error: jest.spyOn(console, "error").mockImplementation(),
    };
  });

  afterEach(() => {
    consoleSpy.log.mockRestore();
    consoleSpy.warn.mockRestore();
    consoleSpy.error.mockRestore();
  });

  describe("LogLevel", () => {
    it("should have correct enum values", () => {
      expect(LogLevel.DEBUG).toBe(0);
      expect(LogLevel.INFO).toBe(1);
      expect(LogLevel.WARN).toBe(2);
      expect(LogLevel.ERROR).toBe(3);
    });
  });

  describe("logger.debug", () => {
    it("should log debug messages in development", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      // Re-import to get new logger instance with dev environment
      jest.resetModules();
      const { logger: devLogger } = require("../../utils/logger");

      devLogger.debug("Test debug message");

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("[DEBUG] Test debug message"),
      );

      process.env.NODE_ENV = originalEnv;
    });

    it("should include context in log message", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      jest.resetModules();
      const { logger: devLogger } = require("../../utils/logger");

      devLogger.debug("Test message", { userId: 123, action: "fetch" });

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('{"userId":123,"action":"fetch"}'),
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("logger.info", () => {
    it("should log info messages", () => {
      logger.info("Test info message");

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("[INFO] Test info message"),
      );
    });
  });

  describe("logger.warn", () => {
    it("should log warning messages", () => {
      logger.warn("Test warning message");

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining("[WARN] Test warning message"),
      );
    });

    it("should log warnings in production", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      jest.resetModules();
      const { logger: prodLogger } = require("../../utils/logger");

      prodLogger.warn("Production warning");

      expect(consoleSpy.warn).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("logger.error", () => {
    it("should log error messages", () => {
      logger.error("Test error message");

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining("[ERROR] Test error message"),
      );
    });

    it("should include Error object details", () => {
      const error = new Error("Test error");
      error.stack = "Error stack trace";

      logger.error("Error occurred", error);

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining("Test error"),
      );
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining("Error stack trace"),
      );
    });

    it("should log errors in production", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      jest.resetModules();
      const { logger: prodLogger } = require("../../utils/logger");

      prodLogger.error("Production error");

      expect(consoleSpy.error).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it("should handle non-Error objects", () => {
      logger.error("Error occurred", {
        code: "ERR001",
        message: "Custom error",
      });

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining("ERR001"),
      );
    });
  });

  describe("logger.hookDebug", () => {
    it("should format hook debug messages", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      jest.resetModules();
      const { logger: devLogger } = require("../../utils/logger");

      devLogger.hookDebug("useTestHook", "fetching data", { id: 123 });

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("[useTestHook] fetching data"),
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('"hook":"useTestHook"'),
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("logger.hookError", () => {
    it("should format hook error messages", () => {
      const error = new Error("Hook failed");

      logger.hookError("useTestHook", "fetch operation", error);

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining("[useTestHook] fetch operation failed"),
      );
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('"hook":"useTestHook"'),
      );
    });
  });

  describe("createHookLogger", () => {
    it("should create hook-specific logger", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      jest.resetModules();
      const {
        createHookLogger: devCreateHookLogger,
      } = require("../../utils/logger");

      const hookLogger = devCreateHookLogger("useAccount");

      hookLogger.debug("fetching accounts", { count: 5 });

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("[useAccount] fetching accounts"),
      );

      process.env.NODE_ENV = originalEnv;
    });

    it("should support info logging", () => {
      const hookLogger = createHookLogger("useAccount");

      hookLogger.info("Cache updated", { entries: 10 });

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("Cache updated"),
      );
    });

    it("should support warn logging", () => {
      const hookLogger = createHookLogger("useAccount");

      hookLogger.warn("Slow query detected", { duration: 5000 });

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining("Slow query detected"),
      );
    });

    it("should support error logging", () => {
      const hookLogger = createHookLogger("useAccount");
      const error = new Error("Fetch failed");

      hookLogger.error("Query failed", error);

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining("[useAccount] Query failed failed"),
      );
    });
  });

  describe("createTimer", () => {
    it("should measure elapsed time", () => {
      const timer = createTimer();

      // Simulate some work
      const start = Date.now();
      while (Date.now() - start < 10) {
        // Wait ~10ms
      }

      const elapsed = timer.end();

      expect(elapsed).toBeGreaterThanOrEqual(10);
      expect(elapsed).toBeLessThan(1000); // Reasonable upper bound
    });

    it("should return formatted time string", () => {
      const timer = createTimer();
      const formatted = timer.endFormatted();

      expect(formatted).toMatch(/^\d+\.\d{2}ms$/);
    });
  });

  describe("logFunction", () => {
    it("should log function execution", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      jest.resetModules();
      const { logFunction: devLogFunction } = require("../../utils/logger");

      const testFn = jest.fn().mockResolvedValue("result");
      const wrappedFn = devLogFunction("testOperation", testFn);

      const result = await wrappedFn("arg1", "arg2");

      expect(result).toBe("result");
      expect(testFn).toHaveBeenCalledWith("arg1", "arg2");
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("testOperation"),
      );

      process.env.NODE_ENV = originalEnv;
    });

    it("should log execution time", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      jest.resetModules();
      const { logFunction: devLogFunction } = require("../../utils/logger");

      const testFn = jest.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return "result";
      });

      const wrappedFn = devLogFunction("testOperation", testFn);
      await wrappedFn();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringMatching(/testOperation completed in \d+\.\d{2}ms/),
      );

      process.env.NODE_ENV = originalEnv;
    });

    it("should log errors and re-throw", async () => {
      const error = new Error("Test error");
      const testFn = jest.fn().mockRejectedValue(error);
      const wrappedFn = logFunction("testOperation", testFn);

      await expect(wrappedFn()).rejects.toThrow("Test error");

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining("testOperation failed"),
      );
    });

    it("should work with synchronous functions", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      jest.resetModules();
      const { logFunction: devLogFunction } = require("../../utils/logger");

      const testFn = jest.fn().mockReturnValue("sync result");
      const wrappedFn = devLogFunction("syncOperation", testFn);

      const result = wrappedFn("arg");

      expect(result).toBe("sync result");
      expect(testFn).toHaveBeenCalledWith("arg");
      expect(consoleSpy.log).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("log level filtering", () => {
    it("should not log debug in production", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      jest.resetModules();
      const { logger: prodLogger } = require("../../utils/logger");

      prodLogger.debug("Debug message");

      expect(consoleSpy.log).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it("should not log info in production", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      jest.resetModules();
      const { logger: prodLogger } = require("../../utils/logger");

      prodLogger.info("Info message");

      expect(consoleSpy.log).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it("should log all levels in development", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      jest.resetModules();
      const { logger: devLogger } = require("../../utils/logger");

      devLogger.debug("Debug");
      devLogger.info("Info");
      devLogger.warn("Warn");
      devLogger.error("Error");

      expect(consoleSpy.log).toHaveBeenCalledTimes(2); // debug + info
      expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
      expect(consoleSpy.error).toHaveBeenCalledTimes(1);

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("log message formatting", () => {
    it("should include timestamp", () => {
      logger.info("Test message");

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringMatching(
          /\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/,
        ),
      );
    });

    it("should format message correctly", () => {
      logger.info("Test message");

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringMatching(/\[INFO\] Test message/),
      );
    });

    it("should append context as JSON", () => {
      logger.info("Test message", { key: "value", num: 123 });

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('{"key":"value","num":123}'),
      );
    });
  });
});
