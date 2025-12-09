export const runtime = "edge";

interface HealthResponse {
  status: "healthy" | "unhealthy";
  timestamp: string;
  uptime: number;
  version?: string;
  environment: string;
  checks: {
    server: "ok" | "error";
    memory: "ok";
    runtime: "edge" | "nodejs";
  };
}

export async function GET(request: Request) {
  try {
    // Edge Runtime compatible health check
    // Edge Runtime doesn't support process.memoryUsage() or process.uptime()
    // so we use simplified checks appropriate for serverless edge functions

    const health: HealthResponse = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: Date.now() / 1000, // Milliseconds since epoch / 1000 for seconds
      version: process.env.npm_package_version,
      environment: process.env.NODE_ENV || "production",
      checks: {
        server: "ok",
        memory: "ok", // Edge Runtime manages memory automatically
        runtime: "edge",
      },
    };

    return new Response(JSON.stringify(health), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("Health check error:", error);
    const errorResponse: HealthResponse = {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      uptime: 0,
      environment: process.env.NODE_ENV || "production",
      checks: {
        server: "error",
        memory: "ok",
        runtime: "edge",
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}
