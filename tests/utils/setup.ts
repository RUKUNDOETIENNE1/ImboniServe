/**
 * Jest Test Setup
 * Global setup for all test suites
 */

// Increase timeout for integration tests
jest.setTimeout(30000);

// Suppress console.log during tests (keep errors)
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  console.log = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});
