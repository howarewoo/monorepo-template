import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: [
    "@infrastructure/ui",
    "@infrastructure/ui-web",
    "@infrastructure/utils",
    "@infrastructure/api-client",
    "@infrastructure/navigation",
  ],
};

export default nextConfig;
