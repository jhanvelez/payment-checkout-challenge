// `react-native-get-random-values` (imported first thing in index.js) polyfills
// `crypto.getRandomValues` on the global object. @react-native/typescript-config
// doesn't include the DOM lib, so the global isn't declared anywhere - declare
// just the piece we use.
declare const crypto: {
  getRandomValues<T extends ArrayBufferView>(array: T): T;
};
