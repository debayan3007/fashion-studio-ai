describe('E2E • Error handling', () => {
  it('surfaces retry feedback when the service rate-limits', () => {
    const email = `retry-${Date.now()}@example.com`;
    const password = 'Password123!';
    const prompt = 'An elegant evening dress with metallic sheen';
    const styleValue = 'editorial';

    cy.visit('/signup');

    cy.get('input[placeholder="Email"]').type(email);
    cy.get('input[placeholder="Password"]').type(password);
    cy.contains('button', /create account/i).click();

    cy.url().should('include', '/studio');
    cy.contains('Create New Generation').should('be.visible');

    let firstAttemptBlocked = false;
    cy.intercept('POST', '**/generations', (req) => {
      if (!firstAttemptBlocked) {
        firstAttemptBlocked = true;
        req.reply({
          statusCode: 429,
          body: { message: 'Model overloaded, please retry' },
        });
        return;
      }
      req.continue();
    }).as('generate');

    cy.get('textarea[placeholder*="Describe"]').type(prompt);
    cy.get('#style-select').select(styleValue);

    cy.contains('button', /^Generate$/i).click();

    cy.contains('Retry attempt', { timeout: 10000 }).should('be.visible');
    cy.contains('button', /^Generate$/i, { timeout: 20000 }).should('be.enabled');

    cy.contains('p.font-medium', prompt, { timeout: 20000 }).should('exist');
  });

  it('shows an inline alert after exhausting retries', () => {
    const email = `retry-exhausted-${Date.now()}@example.com`;
    const password = 'Password123!';
    const prompt = 'Casual streetwear outfit with layered textures';
    const styleValue = 'watercolor';

    cy.visit('/signup');
    cy.get('input[placeholder="Email"]').type(email);
    cy.get('input[placeholder="Password"]').type(password);
    cy.contains('button', /create account/i).click();

    cy.url().should('include', '/studio');

    let attempts = 0;
    cy.intercept('POST', '**/generations', (req) => {
      if (attempts < 3) {
        attempts += 1;
        req.reply({
          statusCode: 429,
          body: { message: 'Model overloaded, please retry' },
        });
      } else {
        req.continue();
      }
    }).as('forcedRateLimit');

    cy.get('textarea[placeholder*="Describe"]').type(prompt);
    cy.get('#style-select').select(styleValue);

    cy.contains('button', /^Generate$/i).click();

    cy.contains('Retry attempt', { timeout: 10000 }).should('be.visible');
    cy.contains('[role="alert"]', /retry limit/i, { timeout: 20000 }).should('be.visible');
  });
});

