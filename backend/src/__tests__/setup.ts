import { beforeAll, afterAll, afterEach } from 'vitest';

// Mock Prisma client for tests
beforeAll(() => {
  // Setup test environment
  process.env.NODE_ENV = 'test';
});

afterEach(() => {
  // Clear mocks after each test
});

afterAll(() => {
  // Cleanup after all tests
});
