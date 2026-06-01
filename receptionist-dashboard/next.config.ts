import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  experimental: {
    cssChunking: "strict"
  }
};

export default nextConfig;
