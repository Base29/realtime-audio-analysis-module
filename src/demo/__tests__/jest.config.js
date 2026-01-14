/**
 * Jest configuration for Rich Audio Demo tests
 * Includes property-based testing setup with fast-check
 */

module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/setup.ts'],
  testMatch: [
    '<rootDir>/**/*.test.{js,ts,tsx}',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/setup.ts',
    '<rootDir>/setup.js',
    '<rootDir>/jest.config.js',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../../$1',
    '^react-native$': '<rootDir>/../../../node_modules/react-native',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-.*)/)',
  ],
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/__tests__/**',
  ],
  coverageDirectory: 'coverage/demo',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 10000, // Increased timeout for property-based tests
};