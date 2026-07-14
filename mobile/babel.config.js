module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // zod v4 ships `export * as x from '...'` in its ESM build, which Metro's
    // default transform can't handle without this plugin.
    '@babel/plugin-transform-export-namespace-from',
    'react-native-worklets/plugin',
  ],
};
