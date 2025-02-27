import { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/pasindi',
        destination: '/pasindi/new',
      },
    ];
  },
};

export default nextConfig;
