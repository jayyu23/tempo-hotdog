import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  serverExternalPackages: ["snarkjs", "mongodb"],
};

export default nextConfig;
