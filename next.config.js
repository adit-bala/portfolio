module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets-knowledge-base.aditbala.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Empty turbopack config to silence the warning (Next.js 16+ uses Turbopack by default)
  turbopack: {},
};
