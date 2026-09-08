import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: { remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }, { protocol: "https", hostname: "gadgetlagbe.online" }] },
  async rewrites() {
    const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
    return [{ source: "/uploads/:path*", destination: `${api}/uploads/:path*` }];
  },
};
export default nextConfig;
