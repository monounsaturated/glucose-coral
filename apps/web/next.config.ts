import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  transpilePackages: [
    "@glucose/types",
    "@glucose/libre-parser",
    "@glucose/document-parser",
    "@glucose/event-parser",
    "@glucose/analytics",
    "@glucose/llm",
    "@glucose/db",
  ],
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
