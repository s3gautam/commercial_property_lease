import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@proplease/ui", "@proplease/types", "@proplease/api", "@proplease/utils"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "loremflickr.com" }],
  },
};

export default nextConfig;
