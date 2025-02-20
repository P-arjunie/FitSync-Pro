import { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["res.cloudinary.com"],
  },

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
