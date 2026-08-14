import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // External image domains (avatars, UploadThing CDN)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io", // UploadThing CDN
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },

  // Turbopack root — package-lock.json xəbərdarlığını aradan qaldırır
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
