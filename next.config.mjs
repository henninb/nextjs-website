// import path from "path";
// import fs from "fs";

// const certPath = path.join(process.cwd(), "ssl", "rootCA.pem");

// if (fs.existsSync(certPath)) {
//   process.env.NODE_EXTRA_CA_CERTS = certPath;
//   console.log(`Certificate found and loaded from: ${certPath}`);
// }

// Conditionally import bundle analyzer only when needed
let withBundleAnalyzer = (config) => config;
if (process.env.ANALYZE === "true") {
  try {
    const bundleAnalyzer = await import("@next/bundle-analyzer");
    withBundleAnalyzer = bundleAnalyzer.default({
      enabled: true,
    });
  } catch (error) {
    console.warn("Bundle analyzer not available:", error.message);
  }
}

const nextConfig = {
  reactStrictMode: true,

  // Add transpilePackages to handle MUI X components
  transpilePackages: ["@mui/x-data-grid"],

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://finance.bhenning.com/api/:path*",
        basePath: false,
      },
    ];
  },

  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: [
          // Prevent clickjacking attacks
          {
            key: "X-Frame-Options",
            value: "DENY", // Changed from SAMEORIGIN for better security
          },

          // Content Security Policy - much more restrictive than before
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              process.env.NODE_ENV === "development"
                ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' http: https:"
                : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://finance.bhenning.com https://statsapi.mlb.com https://api.weather.com https://fixturedownload.com https://f5x3msep1f.execute-api.us-east-1.amazonaws.com https://client.px-cloud.net https://henninb.github.io",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
              "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
              "img-src 'self' data: https:",
              process.env.NODE_ENV === "development"
                ? "connect-src 'self' http: https: ws:"
                : "connect-src 'self' https://finance.bhenning.com https://statsapi.mlb.com https://api.weather.com https://fixturedownload.com https://f5x3msep1f.execute-api.us-east-1.amazonaws.com https://client.px-cloud.net",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              ...(process.env.NODE_ENV === "production"
                ? ["upgrade-insecure-requests"]
                : []),
            ].join("; "),
          },

          // Prevent MIME type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },

          // Force HTTPS in production
          {
            key: "Strict-Transport-Security",
            value:
              process.env.NODE_ENV === "production"
                ? "max-age=31536000; includeSubDomains; preload"
                : "max-age=0", // Disable for development
          },

          // Control referrer information
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },

          // Disable DNS prefetching for security
          {
            key: "X-DNS-Prefetch-Control",
            value: "off",
          },

          // Permissions Policy (formerly Feature Policy)
          {
            key: "Permissions-Policy",
            value: [
              "camera=()",
              "microphone=()",
              "geolocation=(self)",
              "payment=(self)",
              "usb=()",
              "magnetometer=()",
              "accelerometer=()",
              "gyroscope=()",
            ].join(", "),
          },

          // Cache control for security
          {
            key: "Cache-Control",
            value: "public, max-age=3600, must-revalidate",
          },

          // Additional security headers
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },

          // CORS headers (basic - will be enhanced per route)
          {
            key: "Access-Control-Allow-Origin",
            value:
              process.env.NODE_ENV === "production"
                ? "https://yourdomain.com"
                : "http://dev.finance.bhenning.com:3000", // Development domain for JWT cookies
          },

          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },

          {
            key: "Access-Control-Allow-Headers",
            value:
              "Content-Type, Authorization, X-Requested-With, Accept, Origin",
          },

          {
            key: "Access-Control-Allow-Credentials",
            value: "true",
          },

          // Custom security headers
          {
            key: "X-Powered-By",
            value: "Security-Enhanced", // Hide Next.js signature
          },
        ],
      },

      // Specific headers for local API routes only (not proxied ones)
      {
        source: "/api/(uuid|local)/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "Expires",
            value: "0",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
        ],
      },

      // Enhanced security for local authentication endpoints only
      {
        source: "/api/(uuid)/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, private",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'none'; script-src 'none'; object-src 'none';",
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
