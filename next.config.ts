import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  // API routes are excluded automatically in static export mode;
  // they will only be available when the app is deployed to Vercel.
};

export default nextConfig;
