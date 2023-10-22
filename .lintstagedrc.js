module.exports = {
  '*.{js,ts}': [
    'eslint --fix',
    'prettier --write --cache-location ./.prettiercache',
  ],
  '*.{json,md}': 'prettier --write --cache-location ./.prettiercache',
};
