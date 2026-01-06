import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/redirect-true',
        destination: 'cbwallet://miniapp?url=https://frames-v2-demo-lilac.vercel.app#dont-refresh',
        permanent: false,
      },
      {
        source: '/redirect-false',
        destination: 'cbwallet://miniapp?url=https://frames-v2-demo-lilac.vercel.app',
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors *"
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN"
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "*"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
