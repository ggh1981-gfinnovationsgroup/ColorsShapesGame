module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Plugin para variables de entorno
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: '.env',
        safe: false,
        allowUndefined: true,
      }],
      // React Native Reanimated plugin (debe ser el último)
      'react-native-reanimated/plugin',
    ],
  };
};
