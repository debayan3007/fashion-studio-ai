/// <reference types="cypress" />

export {};

Cypress.on('uncaught:exception', (err) => {
  // Allow network errors surfaced via console without failing the suite.
  if (err.message?.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
});

