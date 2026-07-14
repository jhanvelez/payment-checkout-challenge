module.exports = {
  root: true,
  extends: '@react-native',
  ignorePatterns: ['coverage/'],
  rules: {
    // `void promise()` is the idiomatic way to mark an intentionally
    // un-awaited promise (e.g. dispatching a thunk from an effect).
    'no-void': ['error', { allowAsStatement: true }],
  },
  overrides: [
    {
      files: ['jest.setup.js', '**/__tests__/**/*.{js,ts,tsx}', '**/*.test.{js,ts,tsx}'],
      env: { jest: true },
    },
  ],
};
