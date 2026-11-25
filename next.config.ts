import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // do not advertise the framework
  serverExternalPackages: ["@electric-sql/pglite", "pg", "sharp"],
  experimental: {
    serverActions: { bodySizeLimit: "6mb" }, // product photo upload; checked again in code
  },
};

export default config;
