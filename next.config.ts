import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel mengurus bundling sendiri; standalone hanya untuk deploy VM/systemd.
  output: process.env.VERCEL ? undefined : "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: false,
  // Hide the floating Next.js dev tools indicator (bottom-left "N" button).
  devIndicators: false,
};

export default nextConfig;
