const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Force Metro to resolve Zustand's CommonJS build on web
// instead of the ESM (.mjs) build that uses `import.meta` (unsupported in Metro web)
const originalResolver = config.resolver;
config.resolver = {
  ...originalResolver,
  resolveRequest: (context, moduleName, platform) => {
    // On web, redirect zustand ESM middleware to its CJS counterpart
    if (platform === 'web' && moduleName === 'zustand/middleware') {
      return {
        filePath: require.resolve('zustand/middleware'),
        type: 'sourceFile',
      };
    }
    if (platform === 'web' && moduleName === 'zustand') {
      return {
        filePath: require.resolve('zustand'),
        type: 'sourceFile',
      };
    }
    // Default resolution
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;
