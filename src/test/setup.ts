import '@testing-library/jest-dom'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { setupServer } from 'msw/node'

// MSW handlers will be added here as we create API mocks
export const handlers = [
  // Example: Supabase auth mock
  // http.post('*/auth/v1/token', () => {
  //   return HttpResponse.json({ access_token: 'mock-token' })
  // }),
]

export const server = setupServer(...handlers)

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Reset handlers after each test (important for test isolation)
afterEach(() => server.resetHandlers())

// Clean up after all tests are done
afterAll(() => server.close())
