module.exports = {
  'backend/**/*.ts': () => ['npm --prefix backend run lint', 'npm --prefix backend run test'],
  'mobile/**/*.{ts,tsx}': () => ['npm --prefix mobile run lint', 'npm --prefix mobile run test -- --watchAll=false'],
};
