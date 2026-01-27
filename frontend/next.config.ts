import type { NextConfig } from "next";

import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    // serverActions: true, // No longer needed in Next.js 15
  },
  async rewrites() {
    return [
      {
        source: "/api/py/:path*",
        destination: process.env.NODE_ENV === 'development' 
          ? "http://localhost:8000/api/py/:path*" 
          : "/api/index.py",
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: "implement-from-scratch",
  project: "frontend",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  // New Sentry configuration structure to avoid deprecation warnings
  tunnelRoute: "/monitoring",
});
