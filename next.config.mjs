/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['fluent-ffmpeg'],
  },
};

export default nextConfig;
