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
 *       application's authentication mechanism.
 *
 * As a result, the e2e tests should be named with a number prefix such as:
 *    - 1_first.test.ts
 *    - 20_second.test.ts
 */
class CustomSequencer extends Sequencer {
  sort(tests) {
    return [...tests].sort((a, b) => (a.path < b.path ? -1 : 1));
  }
}

module.exports = CustomSequencer;
