import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: ["192.168.56.1"],

  // Production optimizations
  compress: true, // Enable gzip compression

  // Optimize images
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
  },
};

export default nextConfig;
