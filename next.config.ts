import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: false,
  // Hide the floating Next.js dev tools indicator (bottom-left "N" button).
  devIndicators: false,
};

export default nextConfig;
