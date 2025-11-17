describe('E2E • Error handling', () => {
  it('handles rate limit error and retries successfully', () => {
    const email = `user-${Date.now()}@example.com`;
    const password = 'Password123!';
    const prompt = 'A minimalist black dress with silver accents';
    const styleValue = 'editorial';

    // Step 1: Sign up
    cy.visit('/signup');
    cy.get('input[placeholder="Email"]').type(email);
    cy.get('input[placeholder="Password"]').type(password);
    cy.contains('button', /create account/i).click();

    // Step 2: Verify redirect to studio
    cy.url().should('include', '/studio');
    cy.contains('Create New Generation').should('be.visible');

    // Step 3: Set up intercept to simulate rate limit error on first attempt
    // Note: Intercept must be set up before the request is made
    let attemptCount = 0;
    cy.intercept('POST', '**/generations', (req) => {
      attemptCount++;
      if (attemptCount === 1) {
        // First attempt: return 429 error
        req.reply({
          statusCode: 429,
          body: { message: 'Model overloaded, please retry' },
          delay: 100, // Small delay to ensure UI updates
        });
      } else {
        // Subsequent attempts: let it through to the real server
        req.continue();
      }
    }).as('generateRequest');

    // Step 4: Fill in generation form
    cy.get('textarea[placeholder*="Describe"]').type(prompt);
    cy.get('#style-select').select(styleValue);

    // Step 5: Generate image
    cy.contains('button', /^Generate$/i).click();

    // Step 6: Verify retry message appears
    // Note: isRetrying is only true when attempt > 1, so first retry shows "Retry attempt 2 of 3"
    // The message format is: "Retry attempt {attempt} of 3 — the service is rate limiting, please hold on…"
    cy.contains(/Retry attempt 2 of 3/, { timeout: 5000 }).should('be.visible');
    cy.contains(/the service is rate limiting, please hold on/, { timeout: 5000 }).should('be.visible');

    // Step 7: Wait for successful generation after retry
    cy.contains('p.font-medium', prompt, { timeout: 20000 }).should('exist');
    cy.contains('Style:').parent().should('contain.text', styleValue);
    cy.contains('succeeded').should('be.visible');

    // Step 8: Verify the retry was successful (generation appears means retry worked)
    // The intercept ensures first attempt failed with 429, then subsequent attempt succeeded
  });
});
