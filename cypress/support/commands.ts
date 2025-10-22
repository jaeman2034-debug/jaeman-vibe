// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Firebase Firestore ?먮??덉씠???ы띁 ?⑥닔??Cypress.Commands.add('createFirestoreDoc', (collection: string, data: any) => {
  cy.window().then((win) => {
    // Firebase SDK瑜??듯븳 臾몄꽌 ?앹꽦 (?ㅼ젣 援ы쁽 ???ъ슜)
    console.log(`Creating document in ${collection}:`, data);
  });
});

Cypress.Commands.add('deleteFirestoreDoc', (collection: string, docId: string) => {
  cy.window().then((win) => {
    // Firebase SDK瑜??듯븳 臾몄꽌 ??젣 (?ㅼ젣 援ы쁽 ???ъ슜)
    console.log(`Deleting document ${docId} from ${collection}`);
  });
});

// 釉붾줈洹?湲 ?묒꽦 ?ы띁 ?⑥닔
Cypress.Commands.add('createBlogPost', (title: string, content: string, tags?: string) => {
  cy.visit('/posts/new');
  
  cy.get('input[placeholder*="?쒕ぉ"]').type(title);
  cy.get('textarea[placeholder*="?댁슜"]').type(content);
  
  if (tags) {
    cy.get('input[placeholder*="?쒓렇"]').type(tags);
  }
  
  cy.contains('?묒꽦?섍린').click();
  
  // ?묒꽦 ?꾨즺 ???곸꽭 ?섏씠吏濡??대룞 ?뺤씤
  cy.url().should('match', /\/posts\/[a-zA-Z0-9]+$/);
  cy.contains(title).should('be.visible');
});

// 濡쒓렇???곹깭 ?쒕??덉씠??Cypress.Commands.add('loginAs', (userData: any) => {
  cy.window().then((win) => {
    // 濡쒖뺄 ?ㅽ넗由ъ????ъ슜???곗씠?????    win.localStorage.setItem('user', JSON.stringify(userData));
    
    // Firebase Auth ?곹깭 ?쒕??덉씠??(?ㅼ젣 援ы쁽 ???ъ슜)
    console.log('Logged in as:', userData);
  });
});

// ?좏떥由ы떚 ?⑥닔??Cypress.Commands.add('waitForFirestore', () => {
  // Firestore 濡쒕뵫 ?湲?  cy.wait(1000);
});

Cypress.Commands.add('clearFirestoreData', () => {
  // ?뚯뒪???곗씠???뺣━ (?ㅼ젣 援ы쁽 ???ъ슜)
  console.log('Clearing Firestore test data');
});

// Firebase Emulator 珥덇린??紐낅졊??Cypress.Commands.add('resetFirebaseEmulator', () => {
  // Firebase Emulator 珥덇린???ㅽ겕由쏀듃 ?ㅽ뻾
  cy.exec('node scripts/reset-firebase-emulator.js', { 
    failOnNonZeroExit: false,
    timeout: 60000 
  });
  
  // 珥덇린???꾨즺 ???湲?  cy.wait(2000);
});

// Firestore 珥덇린??紐낅졊??(TypeScript CommonJS)
Cypress.Commands.add('resetFirestore', () => {
  // TypeScript Firestore 珥덇린???ㅽ겕由쏀듃 ?ㅽ뻾 (CommonJS 媛뺤젣 諛⑹떇)
  cy.exec('node scripts/resetFirestore.cjs', { 
    failOnNonZeroExit: false,
    timeout: 30000 
  });
  
  // 珥덇린???꾨즺 ???湲?  cy.wait(1000);
});

// ?꾩뭅?곕? ?뚯뒪???곗씠??以鍮?紐낅졊??Cypress.Commands.add('setupAcademyTestData', () => {
  // ?꾩뭅?곕? ?뚯뒪?몄슜 湲곕낯 ?곗씠???앹꽦
  console.log('Setting up Academy test data');
});

// ?뚯뒪???곗씠??以鍮?紐낅졊??Cypress.Commands.add('setupTestData', () => {
  // FC88 湲곕낯 湲 ?뺤씤 ?먮뒗 ?앹꽦
  cy.visit('/blogs');
  cy.contains('FC88 怨듭떇 釉붾줈洹??ㅽ뵂 ?럦').should('be.visible');
});

// 湲곗〈 紐낅졊???뺤옣
Cypress.Commands.overwrite('visit', (originalFn, url, options) => {
  // Firebase ?먮??덉씠???섍꼍?먯꽌??異붽? ?ㅼ젙
  return originalFn(url, {
    ...options,
    onBeforeLoad: (win) => {
      // Firebase ?먮??덉씠???ㅼ젙
      win.localStorage.setItem('firebase:host', 'localhost:4000');
      options?.onBeforeLoad?.(win);
    }
  });
});

// ????뺤쓽 ?뺤옣
declare global {
  namespace Cypress {
    interface Chainable {
      waitForFirestore(): Chainable<void>;
      clearFirestoreData(): Chainable<void>;
      resetFirebaseEmulator(): Chainable<void>;
      resetFirestore(): Chainable<void>;
      setupTestData(): Chainable<void>;
      setupAcademyTestData(): Chainable<void>;
    }
  }
}
