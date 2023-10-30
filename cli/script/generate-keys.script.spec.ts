import { generateKey, main } from './generate-keys.script';

jest.mock('node:fs', () => ({
  existsSync: (envFile: string) => envFile === '.env',
  readFileSync: () => `
JWT_ACCESS_TOKEN_SECRET=""

JWT_REFRESH_TOKEN_SECRET=""
  `,
  writeFileSync: () => undefined,
}));

describe('generate-keys.script', () => {
  describe(generateKey.name, () => {
    it('returns a random token of the specified length', () => {
      const keyLength = 32;
      const generatedKey = generateKey(keyLength);

      expect(generatedKey).toStrictEqual(expect.any(String));
      expect(generatedKey).toHaveLength(keyLength);
    });
  });

  describe(main.name, () => {
    const KEY_LENGTH = 32;
    const ENV_FILE = '.env';
    const ENV_KEYS = ['JWT_ACCESS_TOKEN_SECRET', 'JWT_REFRESH_TOKEN_SECRET'];

    afterEach(() => {
      jest.clearAllMocks();
    });

    describe('[on success]', () => {
      it('returns a generated key of the specified length if an environment file is specified', () => {
        const returnedValue = main({
          length: KEY_LENGTH,
          envFile: undefined,
          envVars: undefined,
        });

        expect(returnedValue).toStrictEqual({
          key: expect.any(String),
        });
        expect(returnedValue.key).toHaveLength(KEY_LENGTH);
      });

      it('returns a message if the specified environment variables have been changed in the specified environment file', () => {
        expect(
          main({
            length: KEY_LENGTH,
            envFile: ENV_FILE,
            envVars: ENV_KEYS,
          }),
        ).toStrictEqual({
          message: expect.any(String),
        });
      });
    });

    describe('[on error]', () => {
      it('throws an error if the specified environment file does not exist', () => {
        expect(() =>
          main({
            length: KEY_LENGTH,
            envFile: 'non-existent-env-file',
            envVars: undefined,
          }),
        ).toThrow();
      });

      it.each([{ envVars: undefined }, { envVars: [] }])(
        'throws an error if no environment keys are passed to it [envKeys: $envKeys]',
        ({ envVars }) => {
          expect(() =>
            main({
              length: KEY_LENGTH,
              envFile: ENV_FILE,
              envVars,
            }),
          ).toThrow();
        },
      );

      it('throws an error if the specified environment keys do not exist in the environment file', () => {
        expect(() =>
          main({
            length: KEY_LENGTH,
            envFile: ENV_FILE,
            envVars: ['NON_EXISTENT_ENIRONMENT_KEY'],
          }),
        ).toThrow();
      });
    });
  });
});
