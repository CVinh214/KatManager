import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Không cần config allowedDevOrigins - Next.js sẽ tự động allow trong dev mode
  // Chỉ cần config khi deploy production với domain cụ thể
};

export default nextConfig;
