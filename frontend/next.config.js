/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://backend:3005/api/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
