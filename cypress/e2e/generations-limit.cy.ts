describe('E2E • Generations limit', () => {
  it('shows only the last 5 generations when more than 5 are created', () => {
    const email = `user-${Date.now()}@example.com`;
    const password = 'Password123!';
    const prompts = [
      'A vintage leather jacket with studs',
      'A flowing silk evening gown',
      'A casual denim outfit',
      'A formal business suit',
      'A bohemian maxi dress',
      'A sporty athleisure set',
      'A elegant cocktail dress',
    ];
    const styleValue = 'realistic';

    // Step 1: Sign up
    cy.visit('/signup');
    cy.get('input[placeholder="Email"]').type(email);
    cy.get('input[placeholder="Password"]').type(password);
    cy.contains('button', /create account/i).click();

    // Step 2: Verify redirect to studio
    cy.url().should('include', '/studio');
    cy.contains('Create New Generation').should('be.visible');

    // Step 3: Generate 7 images sequentially
    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];
      
      // Fill in the form (form is cleared after each successful generation)
      cy.get('textarea[placeholder*="Describe"]').should('be.visible').clear().type(prompt);
      cy.get('#style-select').select(styleValue);
      cy.contains('button', /^Generate$/i).click();

      // Wait for generation to complete (appears in Recent Generations list)
      cy.contains('Recent Generations').should('be.visible');
      cy.contains('p.font-medium', prompt, { timeout: 20000 }).should('exist');
      
      // Small delay between generations to ensure they're processed
      cy.wait(500);
    }

    // Step 4: Verify only the last 5 generations are visible
    // The backend returns only the last 5 generations (take: 5, ordered by createdAt desc)
    const lastFivePrompts = prompts.slice(-5);
    for (const prompt of lastFivePrompts) {
      // Find the prompt within the Recent Generations section
      cy.contains('Recent Generations').should('be.visible');
      cy.contains('p.font-medium', prompt).should('exist');
    }

    // Step 5: Verify the first 2 prompts are NOT visible (they should be excluded)
    const firstTwoPrompts = prompts.slice(0, 2);
    for (const prompt of firstTwoPrompts) {
      cy.contains('p.font-medium', prompt).should('not.exist');
    }

    // Step 6: Verify exactly 5 generation cards are visible in the Recent Generations section
    // Count all p.font-medium elements that contain generation prompts (within the generations list)
    cy.get('p.font-medium').should('have.length.at.least', 5);
    
    // More specific: count within the Recent Generations container
    cy.contains('h2', 'Recent Generations').parent().within(() => {
      cy.get('p.font-medium').should('have.length', 5);
    });
  });
});

