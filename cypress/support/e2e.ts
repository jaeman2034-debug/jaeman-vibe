// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Cypress ?ㅼ젙
Cypress.on('uncaught:exception', (err, runnable) => {
  // Firebase 愿???먮윭??媛쒕컻 ?섍꼍 ?먮윭??臾댁떆
  if (err.message.includes('Firebase') || 
      err.message.includes('Non-Error promise rejection') ||
      err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  return true;
});

// ?꾩뿭 beforeEach
beforeEach(() => {
  // 媛??뚯뒪???꾩뿉 濡쒖뺄 ?ㅽ넗由ъ? 珥덇린??  cy.clearLocalStorage();
  
  // 荑좏궎 珥덇린??  cy.clearCookies();
  
  // Firebase ?먮??덉씠???곌껐 ?뺤씤
  cy.window().then((win) => {
    // Firebase ?먮??덉씠?곌? ?ㅽ뻾 以묒씤吏 ?뺤씤
    if (win.location.hostname === 'localhost') {
      console.log('?뵦 Firebase ?먮??덉씠???섍꼍?먯꽌 ?뚯뒪???ㅽ뻾 以?);
    }
  });
});

// 而ㅼ뒪? 紐낅졊???뺤쓽
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Firebase Firestore ?먮??덉씠?곗뿉 ?뚯뒪???곗씠???앹꽦
       * @param collection - Firestore 而щ젆???대쫫
       * @param data - ??ν븷 ?곗씠??       */
      createFirestoreDoc(collection: string, data: any): Chainable<void>;
      
      /**
       * Firebase Firestore ?먮??덉씠?곗뿉???뚯뒪???곗씠????젣
       * @param collection - Firestore 而щ젆???대쫫
       * @param docId - ??젣??臾몄꽌 ID
       */
      deleteFirestoreDoc(collection: string, docId: string): Chainable<void>;
      
      /**
       * 釉붾줈洹?湲 ?묒꽦 ?ы띁 ?⑥닔
       * @param title - 湲 ?쒕ぉ
       * @param content - 湲 ?댁슜
       * @param tags - ?쒓렇 (?좏깮?ы빆)
       */
      createBlogPost(title: string, content: string, tags?: string): Chainable<void>;
      
      /**
       * 濡쒓렇???곹깭 ?쒕??덉씠??       * @param userData - ?ъ슜???곗씠??       */
      loginAs(userData: any): Chainable<void>;
    }
  }
}
