/**
 * Test Setup Configuration
 * Dominican Republic POS System
 */

// Mock environment variables for tests
const testEnv = {
  NODE_ENV: 'test',
  NEXTAUTH_SECRET: 'test-secret',
  DATABASE_URL: 'postgresql://test:test@localhost:5432/pos_test'
}

// Global test utilities
export const testConfig = {
  // Dominican Republic specific test data
  validRNC: '131793916', // Valid RNC format
  validNCF: 'B01########', // NCF format
  currency: 'DOP',
  taxRate: 0.18, // ITBIS 18%
  dateFormat: 'DD/MM/YYYY'
}

// Common test helpers
export const createMockUser = (role: 'admin' | 'manager' | 'cashier' = 'cashier') => ({
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  role,
  businessId: '1'
})

export const createMockBusiness = () => ({
  id: '1',
  name: 'Test Business',
  rnc: testConfig.validRNC,
  address: 'Test Address',
  phone: '809-123-4567',
  email: 'business@test.com'
})

// Database cleanup utilities
export const cleanupDatabase = async () => {
  // Add database cleanup logic when implementing actual tests
  console.log('Database cleanup - implement when needed')
}

// Test lifecycle helpers (uncomment when Jest/Vitest is installed)
/*
beforeEach(() => {
  // Reset any global state before each test
})

afterEach(() => {
  // Cleanup after each test
  jest.clearAllMocks()
})
*/
