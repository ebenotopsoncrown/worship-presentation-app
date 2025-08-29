/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  productionBrowserSourceMaps: true,
  // If you meant to customize the build folder, do it like this (NO slash):
  // distDir: '.next',
};

module.exports = nextConfig;
