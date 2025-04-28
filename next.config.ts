import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  }, typescript: {
    ignoreBuildErrors: true, // 👈 THIS disables type checking during build
  },
};

export default nextConfig;
