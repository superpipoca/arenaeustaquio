import type { NextConfig } from "next";

// next.config.js  (ou next.config.mjs)
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "*.app.github.dev",
        "vigilant-acorn-q7x5jx54x99vh99jx-3000.app.github.dev",
      ],
    },
  },
};


export default nextConfig;
