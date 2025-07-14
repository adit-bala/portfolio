module.exports = {
  webpack: (config, { isServer }) => {
    // Avoid bundling server-only modules that sql.js pulls in.
    config.resolve = config.resolve || {};
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      fs: false,
      path: false,
      crypto: false,
    };

    if (!isServer) {
      config.experiments = {
        ...(config.experiments || {}),
        asyncWebAssembly: true,
      };
    }

    return config;
  },
};
