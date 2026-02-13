import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@infrastructure/ui",
    "@infrastructure/utils",
    "@infrastructure/api-client",
    "@infrastructure/navigation",
  ],
};

export default nextConfig;
