/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Add the domains where your product photos are hosted.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
