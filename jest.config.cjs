/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setupTests.ts'],

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],

  // Transform TypeScript files
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          strict: false, // Relax strict mode for tests
          noUnusedLocals: false,
          noUnusedParameters: false,
        },
      },
    ],
  },

  // Module name mapping for path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/services/(.*)$': '<rootDir>/src/services/$1',
    '^@/store/(.*)$': '<rootDir>/src/store/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/theme/(.*)$': '<rootDir>/src/theme/$1',
  },

  // Test patterns
  testMatch: ['<rootDir>/src/**/*.(test|spec).(ts|tsx)'],

  // Coverage settings
  collectCoverageFrom: ['src/**/*.(ts|tsx)', '!src/**/*.d.ts', '!src/main.tsx', '!src/test/**'],

  // Ignore patterns
  testPathIgnorePatterns: ['<rootDir>/node_modules/'],

  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:9000',
  },

  // Set environment variables for tests
  setupFiles: ['<rootDir>/jest.env.js'],
};
