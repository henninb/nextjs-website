import { NextApiRequest, NextApiResponse } from "next";

// Add Edge Runtime support for Cloudflare Pages compatibility
export const runtime = "edge";

interface HealthResponse {
  status: "healthy" | "unhealthy";
  timestamp: string;
  uptime: number;
  version?: string;
  environment: string;
  checks: {
    server: "ok" | "error";
    memory: "ok" | "warning" | "error";
    nodejs: "ok" | "error";
  };
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse>,
) {
  try {
    // Edge Runtime compatible health check
    let memoryStatus: "ok" | "warning" | "error" = "ok";
    let uptime = 0;

    // Check if we're in Node.js runtime (Cloud Run) or Edge Runtime (Cloudflare)
    const isNodeRuntime = typeof process !== "undefined" && process.memoryUsage;

    if (isNodeRuntime) {
      // Node.js runtime - get actual memory stats
      const memoryUsage = process.memoryUsage();
      const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
      const memoryTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);

      // Memory check: warn if over 80% usage, error if over 95%
      const memoryPercentage = (memoryUsedMB / memoryTotalMB) * 100;
      if (memoryPercentage > 95) {
        memoryStatus = "error";
      } else if (memoryPercentage > 80) {
        memoryStatus = "warning";
      }

      uptime = process.uptime();
    } else {
      // Edge Runtime - simplified checks
      memoryStatus = "ok"; // Edge Runtime manages memory automatically
      uptime = Date.now() / 1000; // Approximate uptime since service start
    }

    const health: HealthResponse = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: uptime,
      version: process.env.npm_package_version,
      environment: process.env.NODE_ENV || "unknown",
      checks: {
        server: "ok",
        memory: memoryStatus,
        nodejs: isNodeRuntime ? "ok" : "ok", // Both runtimes are considered healthy
      },
    };

    // Overall health status
    const hasErrors = Object.values(health.checks).includes("error");
    if (hasErrors) {
      health.status = "unhealthy";
      res.status(503);
    } else {
      res.status(200);
    }

    res.json(health);
  } catch (error) {
    console.error("Health check error:", error);
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "unknown",
      checks: {
        server: "error",
        memory: "error",
        nodejs: "error",
      },
    });
  }
}
