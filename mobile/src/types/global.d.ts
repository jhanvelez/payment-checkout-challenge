// Hermes (RN >= 0.74) implements a subset of the Web Crypto API at runtime,
// but @react-native/typescript-config doesn't include the DOM lib, so the
// global isn't declared anywhere. Declare just the piece we use.
declare const crypto: {
  getRandomValues<T extends ArrayBufferView>(array: T): T;
};
