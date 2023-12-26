// eslint-disable-next-line @typescript-eslint/no-var-requires
const Sequencer = require('@jest/test-sequencer').default;

/**
 * We use a custom sequencer to have a deterministic running sequence for the
 * E2E tests.
 *
 * This is needed because some tests need to be run before others.
 *
 * e.g.: registration tests should be run before authentication tests;
 *       authentication tests should be run before tests that use the
 *       application's authentication mechanism;
 *       etc...
 *
 * As a result, the e2e tests should be named with a number prefix such as:
 *    - 1_first.test.ts
 *    - 20_second.test.ts
 */
class CustomSequencer extends Sequencer {
  sort(tests) {
    return [...tests].sort(({ path: a }, { path: b }) => {
      a = CustomSequencer.#parsePath(a);
      b = CustomSequencer.#parsePath(b);

      return a < b ? -1 : a > b ? 1 : 0;
    });
  }

  static #parsePath(path) {
    path = path.replace(`${__dirname}/`, '');

    /**
     * If the test files are in the `helper` directory, we want to run them
     * first. Hence the `00_` prefix on the path.
     *
     * Note: We don't care about the order of the tests in that directory.
     * That's why the tests in the `helper` directory are not prefixed by a
     * number.
     */
    if (path.startsWith('helper/')) {
      path = `00_${path}`;
    }

    return path;
  }
}

module.exports = CustomSequencer;
