import path from "path";
import fs from "fs";

const certPath = path.join(process.cwd(), "ssl", "rootCA.pem");

if (fs.existsSync(certPath)) {
  process.env.NODE_EXTRA_CA_CERTS = certPath;
  console.log(`Certificate found and loaded from: ${certPath}`);
}

export default {
  // experimental: {
  //   turbopack: false,
  // },
  reactStrictMode: true,

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://finance.lan/api/:path*",
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
