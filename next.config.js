/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Uncomment and set basePath if deploying to username.github.io/blog
  // basePath: '/blog',
};

module.exports = nextConfig;
