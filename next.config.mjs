export default {
  experimental: {
    turbopack: false,
  },
  reactStrictMode: true,

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://finance.lan/api/:path*", // Proxy to external API
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
