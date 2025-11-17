import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://127.0.0.1:5173',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 12000,
    retries: {
      runMode: 1,
      openMode: 0,
    },
    env: {
      apiUrl: 'http://127.0.0.1:4000',
    },
  },
  viewportWidth: 1280,
  viewportHeight: 720,
});

