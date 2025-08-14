import type { NextApiRequest, NextApiResponse } from "next";

// CORS configuration for different environments and routes
interface CORSConfig {
  origin: string | string[] | boolean;
  methods: string[];
  allowedHeaders: string[];
  credentials: boolean;
  maxAge?: number;
  optionsSuccessStatus?: number;
}

const PRODUCTION_ORIGINS = [
  "https://yourdomain.com",
  "https://www.yourdomain.com",
  "https://finance.bhenning.com",
];

const DEVELOPMENT_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://dev.finance.bhenning.com:3000",
  "http://dev.finance.bhenning.com:3001",
];

// Different CORS policies for different route types
const CORS_CONFIGS: { [key: string]: CORSConfig } = {
  // Public API routes (like weather, sports data)
  public: {
    origin: process.env.NODE_ENV === "production" ? PRODUCTION_ORIGINS : true,
    methods: ["GET", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept", "Origin", "X-Requested-With"],
    credentials: false,
    maxAge: 86400, // 24 hours
  },

  // Authentication routes
  auth: {
    origin:
      process.env.NODE_ENV === "production"
        ? PRODUCTION_ORIGINS
        : DEVELOPMENT_ORIGINS,
    methods: ["POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
    maxAge: 300, // 5 minutes
  },

  // Financial data routes (most restrictive)
  financial: {
    origin:
      process.env.NODE_ENV === "production"
        ? PRODUCTION_ORIGINS
        : DEVELOPMENT_ORIGINS,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "X-CSRF-Token",
    ],
    credentials: true,
    maxAge: 0, // No caching for security
  },

  // Default restrictive policy
  default: {
    origin:
      process.env.NODE_ENV === "production"
        ? PRODUCTION_ORIGINS
        : DEVELOPMENT_ORIGINS,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 3600, // 1 hour
  },
};

/**
 * CORS middleware factory function
 */
export function createCORSMiddleware(
  configType: keyof typeof CORS_CONFIGS = "default",
) {
  const config = CORS_CONFIGS[configType];

  return function corsMiddleware(
    req: NextApiRequest,
    res: NextApiResponse,
    next?: () => void,
  ): boolean {
    const origin = req.headers.origin;

    // Handle origin validation
    if (config.origin === true) {
      res.setHeader("Access-Control-Allow-Origin", "*");
    } else if (Array.isArray(config.origin)) {
      if (origin && config.origin.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin");
      } else if (process.env.NODE_ENV === "development") {
        // Allow localhost in development
        if (origin?.includes("localhost") || origin?.includes("127.0.0.1")) {
          res.setHeader("Access-Control-Allow-Origin", origin);
        }
      }
    } else if (typeof config.origin === "string") {
      res.setHeader("Access-Control-Allow-Origin", config.origin);
    }

    // Set other CORS headers
    res.setHeader("Access-Control-Allow-Methods", config.methods.join(", "));
    res.setHeader(
      "Access-Control-Allow-Headers",
      config.allowedHeaders.join(", "),
    );

    if (config.credentials) {
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }

    if (config.maxAge !== undefined) {
      res.setHeader("Access-Control-Max-Age", config.maxAge.toString());
    }

    // Handle preflight OPTIONS request
    if (req.method === "OPTIONS") {
      res.status(config.optionsSuccessStatus || 204).end();
      return false; // Don't continue to the main handler
    }

    // Security: Validate that the request method is allowed
    if (!config.methods.includes(req.method || "")) {
      res.status(405).json({ error: "Method not allowed" });
      return false;
    }

    // Security: Log suspicious cross-origin requests in production
    if (process.env.NODE_ENV === "production" && origin) {
      const isAllowedOrigin = Array.isArray(config.origin)
        ? config.origin.includes(origin)
        : config.origin === origin || config.origin === true;

      if (!isAllowedOrigin) {
        console.warn(
          `Suspicious cross-origin request from: ${origin} to ${req.url}`,
        );
        // Optionally block or rate limit suspicious origins
      }
    }

    if (next) next();
    return true;
  };
}

/**
 * Pre-configured CORS middlewares for common use cases
 */
export const publicCORS = createCORSMiddleware("public");
export const authCORS = createCORSMiddleware("auth");
export const financialCORS = createCORSMiddleware("financial");
export const defaultCORS = createCORSMiddleware("default");

/**
 * Utility function to determine CORS policy based on route
 */
export function getCORSPolicyForRoute(
  route: string,
): keyof typeof CORS_CONFIGS {
  if (
    route.includes("/auth/") ||
    route.includes("/login") ||
    route.includes("/register")
  ) {
    return "auth";
  }

  if (
    route.includes("/account/") ||
    route.includes("/transaction/") ||
    route.includes("/payment/")
  ) {
    return "financial";
  }

  if (
    route.includes("/weather") ||
    route.includes("/sports") ||
    route.includes("/mlb") ||
    route.includes("/nfl")
  ) {
    return "public";
  }

  return "default";
}

/**
 * Enhanced CORS middleware with automatic policy selection
 */
export function smartCORSMiddleware(req: NextApiRequest, res: NextApiResponse) {
  const route = req.url || "";
  const policyType = getCORSPolicyForRoute(route);
  const middleware = createCORSMiddleware(policyType);

  return middleware(req, res);
}

/**
 * CSRF protection utility (works with CORS)
 * @deprecated Use enhancedCSRFProtection from csrfProtection.ts instead
 */
export function validateCSRFToken(req: NextApiRequest): boolean {
  console.warn(
    "validateCSRFToken is deprecated. Use enhancedCSRFProtection from csrfProtection.ts",
  );

  if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method || "")) {
    const csrfToken = req.headers["x-csrf-token"] as string;
    const sessionToken = req.headers["authorization"] as string;

    // Basic CSRF validation - use enhancedCSRFProtection for full protection
    if (!csrfToken || !sessionToken) {
      return false;
    }

    // This is a basic check - use the full CSRF protection module for production
    return true;
  }

  return true; // GET requests don't need CSRF protection
}
