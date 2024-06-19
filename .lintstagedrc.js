module.exports = {
  '*.{js,ts}': [
    'eslint --cache --ignore-pattern .husky,.vscode,.yarn --fix',
    'prettier --cache --cache-location ./.prettiercache --write',
  ],
  '*.{json,md,yml,yaml}':
    'prettier --cache --cache-location ./.prettiercache --write',
};
