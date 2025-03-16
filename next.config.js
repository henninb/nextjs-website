module.exports = {
  experimental: {
    turbopack: false,
  },
  reactStrictMode: true,
  //chrome: false, // Avoid bundling chrome API
  // output: 'export',
  // trailingSlash : true
  // Add other custom configurations
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
      // {
      //   source: "/(.*)", // Apply to all routes
      //   headers: [
      //     {
      //       // key: "Content-Security-Policy",
      //       value: `
      //         default-src 'self' https://accounts.spotify.com https://*.spotify.com;
      //         script-src 'self' http://client.px-cloud.net https://henninb.github.io https://cdn.jsdelivr.net 'unsafe-inline' 'unsafe-eval' https://accounts.spotify.com https://*.spotify.com;
      //         style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://fonts.googleapis.com https://accounts.spotify.com https://*.spotify.com;
      //         img-src 'self' data: https://accounts.spotify.com https://*.spotify.com;
      //         font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com;
      //         connect-src 'self' https://api.bhenning.com https://*.execute-api.us-east-1.amazonaws.com https://*.px-cloud.net https://*.px-cdn.net https://*.pxchk.net http://client.px-cloud.net https://accounts.spotify.com https://*.spotify.com;
      //         frame-src 'none';
      //         object-src 'none';
      //       `.replace(/\s{2,}/g, " ").trim(), // Removes excess whitespace
      //     },
      //   ],
      // },
    ];
  },
};
