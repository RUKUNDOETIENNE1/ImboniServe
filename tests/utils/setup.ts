/**
 * Jest Test Setup
 * Global setup for all test suites
 */

/**
 * BigInt JSON serialization patch
 *
 * Mirrors the patch in src/lib/prisma.ts. Tests that mock @/lib/prisma
 * won't load the real module, so the patch must also be applied here
 * to ensure BigInt values can be serialized in test assertions.
 */
;(BigInt.prototype as any).toJSON = function () {
  return this.toString()
}

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
