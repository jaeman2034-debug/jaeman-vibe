describe("釉붾줈洹?湲곕뒫 ?먮룞???쒕굹由ъ삤", () => {
  const demoPost = {
    title: "Cypress ?먮룞???뚯뒪??湲 ??",
    content: "??湲? Cypress ?먮룞???뚯뒪?몄슜?낅땲?? 釉붾줈洹?湲곕뒫??泥닿퀎?곸쑝濡?寃利앺빀?덈떎.",
    tags: "?뚯뒪??Cypress,?먮룞??
  };

  beforeEach(() => {
    // 媛??뚯뒪???꾩뿉 釉붾줈洹?紐⑸줉 ?섏씠吏濡??대룞
    cy.visit("http://localhost:5183/blogs");
    cy.wait(1000); // Firestore 濡쒕뵫 ?湲?  });

  it("1. 釉붾줈洹?紐⑸줉 ?섏씠吏 濡쒕뵫 ?뺤씤", () => {
    // ?섏씠吏 ?쒕ぉ ?뺤씤
    cy.contains("?벐 釉붾줈洹?).should("be.visible");
    
    // 湲곗〈 FC88 湲 ?뺤씤 (seed ?곗씠??
    cy.contains("FC88 怨듭떇 釉붾줈洹??ㅽ뵂 ?럦").should("be.visible");
    
    // ?ㅻ퉬寃뚯씠??硫붾돱 ?뺤씤
    cy.contains("YAGO VIBE").should("be.visible");
  });

  it("2. 釉붾줈洹?湲 ?묒꽦", () => {
    // ??湲 ?묒꽦 踰꾪듉 ?대┃
    cy.contains("?륅툘 ??湲 ?묒꽦").click();
    
    // URL ?뺤씤
    cy.url().should("include", "/posts/new");
    
    // ???낅젰
    cy.get('input[placeholder*="?쒕ぉ"]').type(demoPost.title);
    cy.get('textarea[placeholder*="?댁슜"]').type(demoPost.content);
    cy.get('input[placeholder*="?쒓렇"]').type(demoPost.tags);
    
    // ?묒꽦?섍린 踰꾪듉 ?대┃
    cy.contains("?묒꽦?섍린").click();
    
    // ?깃났 ??由щ떎?대젆???뺤씤
    cy.url().should("match", /\/posts\/[a-zA-Z0-9]+$/);
    
    // ?묒꽦???댁슜 ?뺤씤
    cy.contains(demoPost.title).should("be.visible");
    cy.contains(demoPost.content).should("be.visible");
  });

  it("3. 釉붾줈洹??곸꽭 ?섏씠吏 ?뺤씤", () => {
    // 湲곗〈 湲 ?대┃ (FC88 湲)
    cy.contains("FC88 怨듭떇 釉붾줈洹??ㅽ뵂 ?럦").click();
    
    // ?곸꽭 ?섏씠吏 URL ?뺤씤
    cy.url().should("match", /\/posts\/[a-zA-Z0-9]+$/);
    
    // ?곸꽭 ?댁슜 ?뺤씤
    cy.contains("FC88 ? 怨듭떇 釉붾줈洹멸? ?ㅽ뵂?섏뿀?듬땲??").should("be.visible");
    cy.contains("愿由ъ옄 FC88").should("be.visible");
    
    // ?쒓렇 ?뺤씤
    cy.contains("#怨듭?").should("be.visible");
    cy.contains("#FC88").should("be.visible");
    cy.contains("#釉붾줈洹몄삤??).should("be.visible");
  });

  it("4. ?볤? ?묒꽦 湲곕뒫", () => {
    // 湲곗〈 湲 ?대┃
    cy.contains("FC88 怨듭떇 釉붾줈洹??ㅽ뵂 ?럦").click();
    
    // ?볤? ?낅젰
    cy.get('textarea[placeholder*="?볤?"]').type("Cypress ?먮룞???볤??낅땲?? ?몟");
    
    // ?볤? ?깅줉 踰꾪듉 ?대┃
    cy.contains("?뱷 ?볤? ?깅줉").click();
    
    // ?볤? ?쒖떆 ?뺤씤
    cy.contains("Cypress ?먮룞???볤??낅땲?? ?몟").should("be.visible");
    
    // ?볤? ??利앷? ?뺤씤
    cy.contains("?뮠 ?볤?").should("be.visible");
  });

  it("5. 醫뗭븘??Like) 湲곕뒫 ?뚯뒪??, () => {
    // 湲곗〈 湲 ?대┃
    cy.contains("FC88 怨듭떇 釉붾줈洹??ㅽ뵂 ?럦").click();
    
    // 醫뗭븘??踰꾪듉 ?대┃
    cy.get('button').contains('醫뗭븘??).click();
    
    // 醫뗭븘????利앷? ?뺤씤 (?ㅼ젣 援ы쁽???곕씪 議곗젙 ?꾩슂)
    cy.get('span').contains('1').should("be.visible");
  });

  it("6. 議고쉶??利앷? ?뺤씤", () => {
    // 湲곗〈 湲 ?대┃
    cy.contains("FC88 怨듭떇 釉붾줈洹??ㅽ뵂 ?럦").click();
    
    // 議고쉶???쒖떆 ?뺤씤
    cy.contains("議고쉶").should("be.visible");
    
    // ?섏씠吏 ?덈줈怨좎묠 ??議고쉶???뺤씤
    cy.reload();
    cy.contains("議고쉶").should("be.visible");
  });

  it("7. 釉붾줈洹?湲 ?섏젙", () => {
    // 湲곗〈 湲 ?대┃
    cy.contains("FC88 怨듭떇 釉붾줈洹??ㅽ뵂 ?럦").click();
    
    // ?섏젙 踰꾪듉 ?대┃
    cy.contains("?섏젙").click();
    
    // ?섏젙 ???뺤씤
    cy.get('textarea').should("be.visible");
    
    // ?댁슜 ?섏젙
    cy.get('textarea').clear().type("?섏젙???댁슜?낅땲??- Cypress ?뚯뒪??);
    
    // ???踰꾪듉 ?대┃
    cy.contains("???).click();
    
    // ?섏젙???댁슜 ?뺤씤
    cy.contains("?섏젙???댁슜?낅땲??- Cypress ?뚯뒪??).should("be.visible");
  });

  it("8. 釉붾줈洹?湲 ??젣", () => {
    // 癒쇱? ?뚯뒪?몄슜 湲 ?묒꽦
    cy.visit("http://localhost:5183/posts/new");
    cy.get('input[placeholder*="?쒕ぉ"]').type("??젣 ?뚯뒪??湲");
    cy.get('textarea[placeholder*="?댁슜"]').type("??湲? ??젣???덉젙?낅땲??");
    cy.contains("?묒꽦?섍린").click();
    
    // ?묒꽦??湲 ?뺤씤
    cy.contains("??젣 ?뚯뒪??湲").should("be.visible");
    
    // ??젣 踰꾪듉 ?대┃
    cy.contains("??젣").click();
    
    // ?뺤씤 ?ㅼ씠?쇰줈洹?泥섎━
    cy.on('window:confirm', () => true);
    
    // 釉붾줈洹?紐⑸줉?쇰줈 ?뚯븘媛湲?    cy.visit("http://localhost:5183/blogs");
    
    // ??젣??湲 ?뺤씤 (議댁옱?섏? ?딆쓬)
    cy.contains("??젣 ?뚯뒪??湲").should("not.exist");
  });

  it("9. ?대?吏 ?낅줈???뚯뒪??, () => {
    // ??湲 ?묒꽦 ?섏씠吏濡??대룞
    cy.visit("http://localhost:5183/posts/new");
    
    // 湲곕낯 ?뺣낫 ?낅젰
    cy.get('input[placeholder*="?쒕ぉ"]').type("?대?吏 ?뚯뒪??湲");
    cy.get('textarea[placeholder*="?댁슜"]').type("?대?吏媛 ?ы븿???뚯뒪??湲?낅땲??");
    
    // ?대?吏 ?뚯씪 ?낅줈??(?ㅼ젣 ?뚯씪 寃쎈줈濡?援먯껜 ?꾩슂)
    cy.get('input[type="file"]').selectFile('cypress/fixtures/test-image.jpg', { force: true });
    
    // ?묒꽦?섍린 踰꾪듉 ?대┃
    cy.contains("?묒꽦?섍린").click();
    
    // ?대?吏 ?쒖떆 ?뺤씤
    cy.get('img').should("be.visible");
  });

  it("10. 寃??諛??꾪꽣留?湲곕뒫", () => {
    // 釉붾줈洹?紐⑸줉 ?섏씠吏?먯꽌 寃??湲곕뒫 ?뚯뒪??    cy.visit("http://localhost:5183/blogs");
    
    // 寃?됱뼱 ?낅젰 (?ㅼ젣 寃??湲곕뒫??援ы쁽??寃쎌슦)
    cy.get('input[placeholder*="寃??]').type("FC88");
    
    // 寃??寃곌낵 ?뺤씤
    cy.contains("FC88 怨듭떇 釉붾줈洹??ㅽ뵂 ?럦").should("be.visible");
    
    // ?쒓렇 ?꾪꽣留??뚯뒪??(?ㅼ젣 ?꾪꽣 湲곕뒫??援ы쁽??寃쎌슦)
    cy.contains("#FC88").click();
    
    // ?꾪꽣留곷맂 寃곌낵 ?뺤씤
    cy.contains("FC88 怨듭떇 釉붾줈洹??ㅽ뵂 ?럦").should("be.visible");
  });

  it("11. 諛섏쓳???붿옄???뚯뒪??, () => {
    // 紐⑤컮??酉고룷???뚯뒪??    cy.viewport(375, 667);
    cy.visit("http://localhost:5183/blogs");
    
    // 紐⑤컮?쇱뿉??釉붾줈洹?移대뱶 ?뺤씤
    cy.contains("FC88 怨듭떇 釉붾줈洹??ㅽ뵂 ?럦").should("be.visible");
    
    // ?쒕툝由?酉고룷???뚯뒪??    cy.viewport(768, 1024);
    cy.reload();
    
    // ?쒕툝由우뿉???덉씠?꾩썐 ?뺤씤
    cy.contains("FC88 怨듭떇 釉붾줈洹??ㅽ뵂 ?럦").should("be.visible");
    
    // ?곗뒪?ы넲 酉고룷?몃줈 蹂듭썝
    cy.viewport(1280, 720);
  });

  it("12. ?먮윭 ?몃뱾留??뚯뒪??, () => {
    // ?섎せ??URL ?묎렐 ?뚯뒪??    cy.visit("http://localhost:5183/posts/invalid-id", { failOnStatusCode: false });
    
    // 404 ?먮뒗 ?먮윭 ?섏씠吏 ?뺤씤
    cy.contains("寃뚯떆湲??李얠쓣 ???놁뒿?덈떎").should("be.visible");
    
    // 鍮????쒖텧 ?뚯뒪??    cy.visit("http://localhost:5183/posts/new");
    cy.contains("?묒꽦?섍린").click();
    
    // ?좏슚??寃??硫붿떆吏 ?뺤씤
    cy.contains("?쒕ぉ???낅젰?댁＜?몄슂").should("be.visible");
  });
});
