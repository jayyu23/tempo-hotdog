import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  serverExternalPackages: ["snarkjs", "mongodb", "mppx"],
};

export default nextConfig;
