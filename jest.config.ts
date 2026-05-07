import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      diagnostics: false,
    }],
  },
  setupFilesAfterEnv: ['<rootDir>/tests/utils/setup.ts'],
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/tests/**/*.test.tsx',
  ],
  collectCoverageFrom: [
    'src/lib/services/**/*.ts',
    'src/lib/pricing/**/*.ts',
    'src/pages/api/**/*.ts',
    '!src/**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  maxWorkers: '50%',
  testTimeout: 30000,
};

export default config;
