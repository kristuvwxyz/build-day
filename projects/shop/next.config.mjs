/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allows uploading a Shopify product export (CSV) in Admin → Products → Import.
  experimental: { serverActions: { bodySizeLimit: "10mb" } },
  images: {
    // Add the domains where your product photos are hosted.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
