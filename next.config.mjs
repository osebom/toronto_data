/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'secure.toronto.ca',
        pathname: '/c3api_data/**',
      },
    ],
  },
};

export default nextConfig;

