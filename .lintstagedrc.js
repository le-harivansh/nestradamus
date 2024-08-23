module.exports = {
  '*.{js,ts}': [
    'eslint --fix',
    'prettier --cache --cache-location ./.prettiercache --write',
  ],
  '*.{json,md,yml,yaml}':
    'prettier --cache --cache-location ./.prettiercache --write',
};
