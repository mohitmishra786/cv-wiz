import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  // Rewrite /api/py/* to the FastAPI function
  // Vercel detects Python functions in /api directory
  async rewrites() {
    return [
      {
        source: "/api/py/:path*",
        destination: "/api/",  // Vercel routes to /api/index.py automatically
      },
    ];
  },
};

export default nextConfig;
