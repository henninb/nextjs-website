module.exports = {
  reactStrictMode: true,
  // output: 'export',
  // trailingSlash : true
  // Add other custom configurations
    async headers() {
    return [
      {
        source: '/(.*)', // Apply to all routes
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' http://client.px-cloud.net https://henninb.github.io https://cdn.jsdelivr.net 'unsafe-inline' 'unsafe-eval';
              style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://fonts.googleapis.com;
              img-src 'self' data:;
              font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com;
              connect-src 'self' https://*.px-cloud.net https://*.px-cdn.net https://*.pxchk.net http://client.px-cloud.net;
              frame-src 'none';
              object-src 'none';
            `.replace(/\s{2,}/g, ' ').trim(), // Removes excess whitespace
          },
        ],
      },
    ];
  },
};
