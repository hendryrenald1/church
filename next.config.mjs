import withPWA from "next-pwa";

const withPWAMiddleware = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true
});

/** @type {import('next').NextConfig} */
const nextConfig = withPWAMiddleware({
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb"
    }
  }
});

export default nextConfig;
