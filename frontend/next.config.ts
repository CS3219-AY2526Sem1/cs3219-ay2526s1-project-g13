import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },

  productionBrowserSourceMaps: false,
  swcMinify: true,

  optimizeFonts: false,

  experimental: {
    optimizePackageImports: ["lodash", "date-fns", "rxjs"],
  },

  webpack: (config, { isServer }) => {
    config.cache = {
      type: "filesystem",
      cacheDirectory: path.join(process.cwd(), ".next", "cache", isServer ? "server" : "client"),
      buildDependencies: {
        config: [__filename],
      },
    };

    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
    };

    return config;
  },
};

export default nextConfig;
