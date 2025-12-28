import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Type checking enabled - will fail build on errors
    ignoreBuildErrors: false,
  },
  eslint: {
    // ESLint checking enabled - will fail build on errors
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
