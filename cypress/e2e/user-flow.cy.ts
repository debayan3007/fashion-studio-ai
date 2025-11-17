describe('E2E • User journey', () => {
  it('signs up and generates an image successfully', () => {
    const email = `user-${Date.now()}@example.com`;
    const password = 'Password123!';
    const prompt = 'A futuristic streetwear outfit with neon highlights';
    const styleValue = 'realistic';

    // Step 1: Sign up
    cy.visit('/signup');
    cy.get('input[placeholder="Email"]').type(email);
    cy.get('input[placeholder="Password"]').type(password);
    cy.contains('button', /create account/i).click();

    // Step 2: Verify redirect to studio
    cy.url().should('include', '/studio');
    cy.contains('Create New Generation').should('be.visible');

    // Step 3: Fill in generation form
    cy.get('textarea[placeholder*="Describe"]').type(prompt);
    cy.get('#style-select').select(styleValue);

    // Step 4: Generate image
    cy.contains('button', /^Generate$/i).click();

    // Step 5: Wait for generation to complete
    // Button should show "Generating..." state
    cy.contains('button', /^Generating/i).should('be.visible');
    
    // Step 6: Verify generation appears in Recent Generations list
    // Wait for the generation to appear (this confirms it completed successfully)
    cy.contains('Recent Generations').should('be.visible');
    cy.contains('p.font-medium', prompt, { timeout: 20000 }).should('exist');
    cy.contains('Style:').parent().should('contain.text', styleValue);
    
    // Verify the generation has a succeeded status
    cy.contains('succeeded').should('be.visible');
  });

  it('signs up, logs out, and logs back in successfully', () => {
    const email = `user-${Date.now()}@example.com`;
    const password = 'Password123!';
    const prompt = 'A vintage denim jacket with patches';
    const styleValue = 'watercolor';

    // Step 1: Sign up
    cy.visit('/signup');
    cy.get('input[placeholder="Email"]').type(email);
    cy.get('input[placeholder="Password"]').type(password);
    cy.contains('button', /create account/i).click();

    // Step 2: Verify redirect to studio
    cy.url().should('include', '/studio');
    cy.contains('Create New Generation').should('be.visible');

    // Step 3: Create a generation so we have something to verify after login
    cy.get('textarea[placeholder*="Describe"]').type(prompt);
    cy.get('#style-select').select(styleValue);
    cy.contains('button', /^Generate$/i).click();
    
    // Wait for generation to complete
    cy.contains('p.font-medium', prompt, { timeout: 20000 }).should('exist');

    // Step 4: Log out
    cy.contains('button', /logout/i).click();

    // Step 5: Verify redirect to login page
    cy.url().should('include', '/login');
    cy.contains('Login').should('be.visible');

    // Step 6: Log in with the same credentials
    cy.get('input[placeholder="Email"]').type(email);
    cy.get('input[placeholder="Password"]').type(password);
    cy.contains('button', /^login$/i).click();

    // Step 7: Verify redirect back to studio
    cy.url().should('include', '/studio');
    cy.contains('Create New Generation').should('be.visible');

    // Step 8: Verify previous generation is still visible
    cy.contains('Recent Generations').should('be.visible');
    cy.contains('p.font-medium', prompt).should('exist');
    cy.contains('Style:').parent().should('contain.text', styleValue);
  });
});
