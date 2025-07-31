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
        // Apply this header to all routes
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;",
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
