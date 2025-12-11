/**
 * Centralized logging utility with environment-based filtering
 * Provides structured logging with different log levels
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Context information for log entries
 */
export interface LogContext {
  hook?: string;
  operation?: string;
  data?: unknown;
  [key: string]: unknown;
}

/**
 * Structured logger with environment-based filtering
 */
class Logger {
  private level: LogLevel;

  constructor() {
    // Set log level based on environment
    // Production: Only warnings and errors
    // Development: All logs including debug
    this.level =
      process.env.NODE_ENV === "production" ? LogLevel.WARN : LogLevel.DEBUG;
  }

  /**
   * Check if log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  /**
   * Format log message with timestamp and context
   */
  private formatMessage(
    level: string,
    message: string,
    context?: LogContext,
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : "";
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  /**
   * Debug logging - only in development
   * Use for detailed diagnostic information
   */
  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage("DEBUG", message, context));
    }
  }

  /**
   * Info logging - general informational messages
   * Use for significant application events
   */
  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage("INFO", message, context));
    }
  }

  /**
   * Warning logging - potentially harmful situations
   * Use for recoverable issues that should be investigated
   */
  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage("WARN", message, context));
    }
  }

  /**
   * Error logging - error events that might still allow application to continue
   * Use for exceptions and failures
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorContext: LogContext = {
        ...context,
        error:
          error instanceof Error
            ? {
                message: error.message,
                stack: error.stack,
                name: error.name,
              }
            : error,
      };
      console.error(this.formatMessage("ERROR", message, errorContext));
    }
  }

  /**
   * Hook-specific debug logging
   * Automatically includes hook name in context
   */
  hookDebug(hookName: string, operation: string, data?: unknown): void {
    this.debug(`[${hookName}] ${operation}`, {
      hook: hookName,
      operation,
      data,
    });
  }

  /**
   * Hook-specific error logging
   * Automatically includes hook name in context
   */
  hookError(hookName: string, operation: string, error: Error | unknown): void {
    this.error(`[${hookName}] ${operation} failed`, error, {
      hook: hookName,
      operation,
    });
  }

  /**
   * Set log level programmatically (useful for testing)
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Get current log level
   */
  getLevel(): LogLevel {
    return this.level;
  }
}

/**
 * Global logger instance
 * Import and use throughout the application
 *
 * @example
 * ```typescript
 * import { logger } from "../utils/logger";
 *
 * logger.debug("Fetching account data");
 * logger.error("Failed to fetch", error);
 * ```
 */
export const logger = new Logger();

/**
 * Create a hook-specific logger with automatic context
 * Simplifies logging within hooks by pre-configuring hook name
 *
 * @param hookName - Name of the hook (e.g., "useAccountFetch")
 * @returns Object with logging methods pre-configured for the hook
 *
 * @example
 * ```typescript
 * const log = createHookLogger("useAccountFetch");
 *
 * log.debug("Starting query");
 * log.error("Query failed", error);
 * ```
 */
export function createHookLogger(hookName: string) {
  return {
    /**
     * Debug logging for this hook
     */
    debug: (operation: string, data?: unknown) =>
      logger.hookDebug(hookName, operation, data),

    /**
     * Info logging for this hook
     */
    info: (message: string, context?: LogContext) =>
      logger.info(message, { hook: hookName, ...context }),

    /**
     * Warning logging for this hook
     */
    warn: (message: string, context?: LogContext) =>
      logger.warn(message, { hook: hookName, ...context }),

    /**
     * Error logging for this hook
     */
    error: (operation: string, error: Error | unknown) =>
      logger.hookError(hookName, operation, error),
  };
}

/**
 * Performance timing utility
 * Measures and logs execution time of operations
 *
 * @example
 * ```typescript
 * const timer = createTimer("fetchAccounts");
 * const data = await fetchAccountData();
 * timer.end("Accounts fetched successfully");
 * ```
 */
export function createTimer(operation: string) {
  const startTime = performance.now();

  return {
    /**
     * End timer and log duration
     */
    end: (message?: string) => {
      const duration = performance.now() - startTime;
      const logMessage = message
        ? `${message} (${duration.toFixed(2)}ms)`
        : `${operation} completed in ${duration.toFixed(2)}ms`;

      logger.debug(logMessage, {
        operation,
        duration: duration.toFixed(2),
      });
    },

    /**
     * Get elapsed time without ending timer
     */
    elapsed: (): number => {
      return performance.now() - startTime;
    },
  };
}

/**
 * Log function call with automatic timing
 * Wraps a function to log its execution and timing
 *
 * @param fn - Function to wrap
 * @param operationName - Name for logging
 * @returns Wrapped function with logging
 *
 * @example
 * ```typescript
 * const fetchWithLogging = logFunction(
 *   fetchAccountData,
 *   "fetchAccountData"
 * );
 * ```
 */
export function logFunction<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  operationName: string,
): T {
  return (async (...args: unknown[]) => {
    const timer = createTimer(operationName);
    logger.debug(`Starting ${operationName}`);

    try {
      const result = await fn(...args);
      timer.end(`${operationName} succeeded`);
      return result;
    } catch (error) {
      timer.end(`${operationName} failed`);
      logger.error(`${operationName} threw error`, error);
      throw error;
    }
  }) as T;
}
