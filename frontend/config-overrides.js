module.exports = function override(config, env) {
  // Add fallbacks for node modules used by ethers.js
  config.resolve.fallback = {
    ...config.resolve.fallback,
    crypto: require.resolve("crypto-browserify"),
    stream: require.resolve("stream-browserify"),
    assert: require.resolve("assert"),
    http: require.resolve("stream-http"),
    https: require.resolve("https-browserify"),
    os: require.resolve("os-browserify"),
    url: require.resolve("url"),
  };

  return config;
};

// Fix for webpack-dev-server deprecation warnings
module.exports.devServer = function (configFunction) {
  return function (proxy, allowedHost) {
    const config = configFunction(proxy, allowedHost);

    // Replace deprecated options with setupMiddlewares
    const fsMiddleware = config.onBeforeSetupMiddleware;
    const appMiddleware = config.onAfterSetupMiddleware;

    config.setupMiddlewares = (middlewares, devServer) => {
      if (fsMiddleware) {
        fsMiddleware(devServer);
      }
      middlewares.push(...(devServer.static || []));
      if (appMiddleware) {
        appMiddleware(devServer);
      }
      return middlewares;
    };

    // Remove deprecated options
    delete config.onBeforeSetupMiddleware;
    delete config.onAfterSetupMiddleware;

    return config;
  };
};
