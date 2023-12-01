/** @type {import("prettier").Config} */
module.exports = {
  singleQuote: true,
  trailingComma: 'all',
  importOrder: [
    '<THIRD_PARTY_MODULES>',
    '^@/.*$',
    '^@cli/.*$',
    '^[../]',
    '^[./]',
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  importOrderParserPlugins: ['typescript', 'decorators-legacy'],
  plugins: [require.resolve('@trivago/prettier-plugin-sort-imports')],
};
