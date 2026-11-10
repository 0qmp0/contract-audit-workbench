import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // SQLite WASM 相关包含动态加载的 wasm/fs 访问，需保持 Node 原生形态
  serverExternalPackages: [
    '@ansvar/chinese-law-mcp',
    '@ansvar/mcp-sqlite',
    'node-sqlite3-wasm',
    'pdf-parse',
    'mammoth',
  ],
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      sharp$: false,
      'onnxruntime-node$': false,
    };
    return config;
  },
};

export default nextConfig;
