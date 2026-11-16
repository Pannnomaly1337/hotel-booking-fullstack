import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Required for the Docker "standalone" image.
  output: "standalone",
  // In a monorepo, trace files from the repo root.
  outputFileTracingRoot: path.join(__dirname, "../../"),
  // Transpile the shared workspace package.
  transpilePackages: ["@repo/types"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
