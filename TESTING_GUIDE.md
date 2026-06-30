# Testing Guide

This project includes unit/component tests (Jest + React Testing Library + MSW) and end-to-end tests (Playwright).

## Prerequisites

- Node.js 18+
- Install dependencies:

```bash
npm ci
# or
npm install
```

- Install Playwright browsers:

```bash
npx playwright install
```

## Unit & Component Tests

Run unit tests:

```bash
npm run test
# or
npm run test:unit
```

Run coverage:

```bash
npm run test:coverage
```

Open coverage report:

```bash
# After running coverage
start coverage/lcov-report/index.html
```

## End-to-End Tests

Start the dev server (terminal 1):

```bash
npm run dev
```

Run Playwright tests (terminal 2):

```bash
npm run test:e2e
```

Base URL: http://localhost:3000

## Adding Tests

- For new components, add files under `__tests__/components/YourComponent.test.tsx`.
- Mock network requests with MSW in tests and Playwright route mocking in E2E.
- Keep assertions deterministic (avoid arbitrary timeouts).

## Notes

- Jest config is in `jest.config.js` and uses `jest.setup.ts`.
- Playwright config is in `playwright.config.ts`.
- Example fixtures are available under `tests/fixtures/`.
