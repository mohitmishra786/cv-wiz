import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  // Rewrite /api/py/* to the FastAPI function
  // This allows the frontend to call the Python backend on the same domain
  async rewrites() {
    return [
      {
        source: "/api/py/:path*",
        destination: "/api/index.py",
      },
    ];
  },
};

export default nextConfig;
