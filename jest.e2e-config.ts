import type { Config } from 'jest';

const configuration: Config = {
  verbose: true,
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.*\\.test\\.ts$',
  testSequencer: './jest.e2e-sequencer.js',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    // Authentication Library
    '^@application/authentication(|/.*)$':
      '<rootDir>/libs/authentication/src/$1',

    // Configuration Library
    '^@application/configuration(|/.*)$': '<rootDir>/libs/configuration/src/$1',

    // Database Library
    '^@application/database(|/.*)$': '<rootDir>/libs/database/src/$1',

    // Mail Library
    '^@application/mail(|/.*)$': '<rootDir>/libs/mail/src/$1',
  },
};

export default configuration;
