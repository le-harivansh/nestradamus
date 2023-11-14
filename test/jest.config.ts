import type { Config } from 'jest';

const configuration: Config = {
  verbose: true,
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.*\\.test\\.ts$',
  testSequencer: './jest.sequencer.js',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '@/(.*)': '<rootDir>/../src/$1',
  },
};

export default configuration;
