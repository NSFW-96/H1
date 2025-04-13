import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ['images.unsplash.com'],
  },
  eslint: {
    // Skip ESLint during builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Skip type checking during builds
    ignoreBuildErrors: true,
  },
  // Transpile problematic packages
  transpilePackages: [
    "ai",
    "lucide-react",
    "react-markdown",
    "remark-gfm",
    "rehype-raw"
  ],
};

export default nextConfig;
