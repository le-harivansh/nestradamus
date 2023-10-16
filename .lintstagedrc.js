module.exports = {
  '*.{js,ts}': [
    'eslint --fix',
    'prettier --write --cache-location=./.prettier.cache',
  ],
  '*.{json,md}': 'prettier --write --cache-location=./.prettier.cache',
};
