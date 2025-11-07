describe('E2E • User journey', () => {
  it('signs up, creates a generation, and restores it', () => {
    const email = `user-${Date.now()}@example.com`;
    const password = 'Password123!';
    const prompt = 'A futuristic streetwear outfit with neon highlights';
    const styleValue = 'realistic';

    cy.visit('/signup');

    cy.get('input[placeholder="Email"]').type(email);
    cy.get('input[placeholder="Password"]').type(password);
    cy.contains('button', /create account/i).click();

    cy.url().should('include', '/studio');
    cy.contains('Create New Generation').should('be.visible');

    cy.get('textarea[placeholder*="Describe"]').type(prompt);
    cy.get('#style-select').select(styleValue);

    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from('stub-image-bytes'),
        fileName: 'sample.png',
        mimeType: 'image/png',
      },
      { force: true },
    );

    cy.contains('button', /^Generate$/i).click();

    cy.contains('button', /^Generating/).should('exist');
    cy.contains('button', /^Generate$/i, { timeout: 20000 }).should('be.enabled');

    cy.contains('p.font-medium', prompt, { timeout: 20000 }).should('exist');
    cy.contains('Style:').parent().should('contain.text', styleValue);

    cy.contains('button', 'Restore').first().click();
    cy.get('textarea[placeholder*="Describe"]').should('have.value', prompt);
    cy.get('#style-select').should('have.value', styleValue);
  });
});

