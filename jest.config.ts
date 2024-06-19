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
    '^@application/authentication(|/.*)$':
      '<rootDir>/libs/authentication/src/$1',
    '^@application/configuration(|/.*)$': '<rootDir>/libs/configuration/src/$1',
    '^@application/database(|/.*)$': '<rootDir>/libs/database/src/$1',
  },
};

export default configuration;
