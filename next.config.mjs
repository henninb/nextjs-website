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
  reactStrictMode: false, // Disable React Strict Mode for development stability

  // Disable all experimental features that might interfere with HMR
  experimental: {
    // Completely disable experimental optimizations for stability
  },

  // Configure allowed development origins to prevent cross-origin warnings
  allowedDevOrigins: [
    "dev.finance.bhenning.com",
    "localhost:3000",
    "127.0.0.1:3000",
  ],

  // Add transpilePackages to handle MUI X components
  transpilePackages: ["@mui/x-data-grid"],

  // Minimal webpack configuration - let Next.js handle everything
  webpack: (config, { dev, isServer, webpack }) => {
    if (dev && !isServer) {
      // Force enable HMR and ensure proper configuration
      config.cache = false; // Disable webpack cache completely

      // Ensure proper HMR plugin configuration using webpack from parameters
      config.plugins = config.plugins.filter(
        (plugin) => !(plugin instanceof webpack.HotModuleReplacementPlugin),
      );
      config.plugins.push(new webpack.HotModuleReplacementPlugin());

      // Ensure dev server respects rewrites
      if (config.devServer) {
        config.devServer.historyApiFallback = false;
      }
    }

    return config;
  },

  async redirects() {
    return [
      {
        source: "/users/sign_in",
        destination: "/login",
        permanent: false,
      },
    ];
  },

  // Add server configuration to ensure proper handling
  serverRuntimeConfig: {
    // Will only be available on the server side
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    apiUrl: "https://finance.bhenning.com",
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
                ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://dev.finance.bhenning.com:3000 http: https:"
                : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://finance.bhenning.com https://vercel.bhenning.com https://statsapi.mlb.com https://api.weather.com https://fixturedownload.com https://f5x3msep1f.execute-api.us-east-1.amazonaws.com https://client.px-cloud.net https://henninb.github.io",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
              "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
              "img-src 'self' data: https:",
              process.env.NODE_ENV === "development"
                ? "connect-src 'self' http://dev.finance.bhenning.com:3000 http: https: ws:"
                : "connect-src 'self' https://finance.bhenning.com https://vercel.bhenning.com https://statsapi.mlb.com https://api.weather.com https://fixturedownload.com https://f5x3msep1f.execute-api.us-east-1.amazonaws.com https://client.px-cloud.net https://tzm.px-cloud.net https://collector-pxjj0cytn9.px-cloud.net https://collector-pxjj0cytn9.px-cdn.net https://collector-pxjj0cytn9.pxchk.net https://b.px-cdn.net",
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
                ? "https://vercel.bhenning.com"
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
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
