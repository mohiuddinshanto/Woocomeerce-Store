import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  images: { remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }, { protocol: "https", hostname: "gadgetlagbe.online" }, { protocol: "https", hostname: "lh3.googleusercontent.com" }] },
  async rewrites() {
    const api = process.env.BACKEND_INTERNAL_URL ?? "http://127.0.0.1:4100";
    return [
      { source: "/api/:path*", destination: `${api}/api/:path*` },
      { source: "/uploads/:path*", destination: `${api}/uploads/:path*` },
    ];
  },
};
export default nextConfig;
