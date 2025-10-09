module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // No plugins needed for Expo Go compatibility
    ],
  };
};
