import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // External packages for server components
  serverExternalPackages: ['@prisma/client'],
  
  // Allow cross-origin requests for development (IPv6 support)
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    '::1',
    '[::1]',
    '0.0.0.0',
    '::'
  ],
  
  // Ensure proper hostname binding
  async rewrites() {
    return []
  },
};

export default nextConfig;
