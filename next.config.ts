import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  compiler: {
    styledComponents: true,
  },
  devIndicators: false,
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
