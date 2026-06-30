/**
 * Global test setup: Jest DOM + MSW server
 * Note: Project currently uses jest.setup.ts via jest.config.js. This file
 * provides MSW setup if you choose to switch to setupFilesAfterEnv: ['<rootDir>/setupTests.ts'].
 */
import '@testing-library/jest-dom';

/*
import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Example MSW handlers: mock /api/news endpoint
const server = setupServer(
  rest.get('http://localhost:3000/api/news', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ status: 'ok', totalResults: 0, articles: [] })
    );
  })
);

// Establish API mocking before all tests.
beforeAll(() => server.listen());
// Reset any request handlers that are declared as a part of our tests
// (i.e. for testing one-time error scenarios)
afterEach(() => server.resetHandlers());
// Clean up after the tests are finished.
afterAll(() => server.close());

export { server, rest };
*/
