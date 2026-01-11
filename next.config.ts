import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  
  // Production optimizations
  compress: true, // Enable gzip compression
  
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  
  // Không cần config allowedDevOrigins - Next.js sẽ tự động allow trong dev mode
  // Chỉ cần config khi deploy production với domain cụ thể
};

export default nextConfig;
