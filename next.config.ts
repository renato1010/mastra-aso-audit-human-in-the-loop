import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['@mastra/duckdb', 'duckdb']
};

export default nextConfig;
