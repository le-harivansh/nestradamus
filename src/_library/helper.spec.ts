import { generateNumericPasswordOfLength } from './helper';

describe(generateNumericPasswordOfLength.name, () => {
  it('returns a numeric string of the specified length', () => {
    const passwordLength = 8;

    expect(generateNumericPasswordOfLength(passwordLength)).toMatch(
      new RegExp(`^[0-9]{${passwordLength}}$`),
    );
  });
});
