import { beforeAll, afterAll, afterEach } from 'vitest';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/markethub_test';

// Global test setup
beforeAll(() => {
  console.log('🧪 Starting test suite...');
});

// Clean up after all tests
afterAll(() => {
  console.log('✅ Test suite completed');
});

// Reset mocks after each test
afterEach(() => {
  // Clean up any test data if needed
});
