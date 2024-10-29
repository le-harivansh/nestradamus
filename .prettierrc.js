/** @type {import("prettier").Config} */
module.exports = {
  singleQuote: true,
  quoteProps: 'consistent',
  trailingComma: 'all',
  importOrder: ['<THIRD_PARTY_MODULES>', '^@library/(.*)$', '^[../]', '^[./]'],
  importOrderCaseInsensitive: true,
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  importOrderParserPlugins: ['typescript', 'decorators-legacy'],
  plugins: [require.resolve('@trivago/prettier-plugin-sort-imports')],
};
