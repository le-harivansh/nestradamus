import type { Config } from 'jest';

const configuration: Config = {
  verbose: true,
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  roots: ['<rootDir>/apps/', '<rootDir>/libs/'],
  moduleNameMapper: {
    // Authentication Library
    '^@library/authentication(|/.*)$': '<rootDir>/libs/authentication/src/$1',

    // Authorization Library
    '^@library/authorization(|/.*)$': '<rootDir>/libs/authorization/src/$1',

    // Configuration Library
    '^@library/configuration(|/.*)$': '<rootDir>/libs/configuration/src/$1',

    // Database Library
    '^@library/database(|/.*)$': '<rootDir>/libs/database/src/$1',

    // Mail Library
    '^@library/mail(|/.*)$': '<rootDir>/libs/mail/src/$1',

    // Password-Confirmation Library
    '^@library/password-confirmation(|/.*)$':
      '<rootDir>/libs/password-confirmation/src/$1',

    // Password-Reset Library
    '^@library/password-reset(|/.*)$': '<rootDir>/libs/password-reset/src/$1',

    // S3 Library
    '^@library/s3(|/.*)$': '<rootDir>/libs/s3/src/$1',
  },
};

export default configuration;
