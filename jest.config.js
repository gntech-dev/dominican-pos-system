/**
 * Jest Configuration for Dominican Republic POS System
 * 
 * To enable testing:
 * 1. npm install --save-dev jest @types/jest @testing-library/react @testing-library/jest-dom
 * 2. npm install --save-dev jest-environment-jsdom
 * 3. Add test scripts to package.json
 */

const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testEnvironment: 'jsdom',
  testMatch: [
    '**/tests/**/*.test.(js|jsx|ts|tsx)',
    '**/tests/**/*.spec.(js|jsx|ts|tsx)'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/tests/integration/' // Skip integration tests in unit test runs
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/api/dev/**', // Exclude dev API routes
    '!src/**/*.stories.{js,jsx,ts,tsx}' // Exclude Storybook files
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1'
  },
  globals: {
    // Dominican Republic specific test constants
    'process.env': {
      NODE_ENV: 'test',
      NEXTAUTH_SECRET: 'test-secret',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/pos_test'
    }
  }
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
