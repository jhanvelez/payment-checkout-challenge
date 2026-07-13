module.exports = {
  'backend/**/*.ts': () => ['npm --prefix backend run lint', 'npm --prefix backend run test'],
};
