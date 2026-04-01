import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@glucose/types",
    "@glucose/libre-parser",
    "@glucose/document-parser",
    "@glucose/event-parser",
    "@glucose/analytics",
    "@glucose/llm",
  ],
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
