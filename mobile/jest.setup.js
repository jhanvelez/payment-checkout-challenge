import 'react-native-gesture-handler/jestSetup';

require('react-native-reanimated').setUpTests();

jest.mock('react-native-mmkv', () => {
  const store = new Map();
  return {
    createMMKV: jest.fn().mockImplementation((config) => ({
      id: config?.id ?? 'mmkv.default',
      set: (key, value) => store.set(key, value),
      getString: (key) => store.get(key),
      remove: (key) => store.delete(key),
      contains: (key) => store.has(key),
      clearAll: () => store.clear(),
    })),
  };
});

jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'AccessibleWhenUnlockedThisDeviceOnly' },
  getGenericPassword: jest.fn().mockResolvedValue(false),
  setGenericPassword: jest.fn().mockResolvedValue(true),
  resetGenericPassword: jest.fn().mockResolvedValue(true),
}));

jest.mock('react-native-linear-gradient', () => {
  const { View } = require('react-native');
  return View;
});
