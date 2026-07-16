import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@proplease/ui", "@proplease/types", "@proplease/api", "@proplease/utils"],
};

export default nextConfig;
