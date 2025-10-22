describe("釉붾줈洹?湲곕뒫 ?먮룞???쒕굹由ъ삤", () => {
  const demoPost = {
    title: "?먮룞???뚯뒪??湲",
    author: "?뚯뒪???ъ슜??,
    content: "??湲? Cypress ?먮룞???뚯뒪?몄슜?낅땲??",
  };

  beforeEach(() => {
    // 媛??뚯뒪???꾩뿉 釉붾줈洹?紐⑸줉 ?섏씠吏濡??대룞
    cy.visit("http://localhost:5183/blogs");
    cy.wait(1000); // Firestore 濡쒕뵫 ?湲?  });

  it("1. 釉붾줈洹?湲 ?묒꽦", () => {
    cy.contains("?륅툘 ??湲 ?묒꽦").click();

    // ?ㅼ젣 ?꾨줈?앺듃?????꾨뱶??留욊쾶 ?섏젙
    cy.get('input[placeholder*="?쒕ぉ"]').type(demoPost.title);
    cy.get('textarea[placeholder*="?댁슜"]').type(demoPost.content);
    cy.get('input[placeholder*="?쒓렇"]').type("?뚯뒪???먮룞??);

    cy.contains("?묒꽦?섍린").click();

    // ?묒꽦 ???곸꽭 ?섏씠吏濡??대룞 ?뺤씤
    cy.url().should("match", /\/posts\/[a-zA-Z0-9]+$/);
    cy.contains(demoPost.title).should("exist");
  });

  it("2. 釉붾줈洹??곸꽭 ?섏씠吏 ?뺤씤", () => {
    // 湲곗〈 FC88 湲 ?대┃
    cy.contains("FC88 怨듭떇 釉붾줈洹??ㅽ뵂 ?럦").click();
    
    // ?곸꽭 ?섏씠吏 ?댁슜 ?뺤씤
    cy.contains("FC88 ? 怨듭떇 釉붾줈洹멸? ?ㅽ뵂?섏뿀?듬땲??").should("exist");
    cy.contains("愿由ъ옄 FC88").should("exist");
  });

  it("3. ?볤? ?묒꽦", () => {
    // 湲곗〈 湲 ?대┃
    cy.contains("FC88 怨듭떇 釉붾줈洹??ㅽ뵂 ?럦").click();
    
    cy.get('textarea[placeholder*="?볤?"]').type("?먮룞???볤??낅땲??");
    cy.contains("?뱷 ?볤? ?깅줉").click();

    cy.contains("?먮룞???볤??낅땲??").should("exist");
  });

  it("4. 醫뗭븘???뚯뒪??, () => {
    // 湲곗〈 湲 ?대┃
    cy.contains("FC88 怨듭떇 釉붾줈洹??ㅽ뵂 ?럦").click();
    
    // 醫뗭븘??踰꾪듉 ?대┃ (?ㅼ젣 援ы쁽???곕씪 議곗젙)
    cy.contains("醫뗭븘??).click();
    
    // 醫뗭븘????利앷? ?뺤씤 (?ㅼ젣 援ы쁽???곕씪 議곗젙)
    cy.get("span").contains("1").should("exist");
  });

  it("5. 議고쉶??利앷? ?뺤씤", () => {
    cy.visit("http://localhost:5183/blogs");
    cy.contains("FC88 怨듭떇 釉붾줈洹??ㅽ뵂 ?럦").click();
    
    // 議고쉶???쒖떆 ?뺤씤
    cy.contains("議고쉶").should("exist");
  });

  it("6. 湲 ?섏젙", () => {
    // 湲곗〈 湲 ?대┃
    cy.contains("FC88 怨듭떇 釉붾줈洹??ㅽ뵂 ?럦").click();
    
    cy.contains("?섏젙").click();
    cy.get("textarea").clear().type("?섏젙???댁슜?낅땲??");
    cy.contains("???).click();

    cy.contains("?섏젙???댁슜?낅땲??").should("exist");
  });

  it("7. 湲 ??젣", () => {
    // 癒쇱? ?뚯뒪?몄슜 湲 ?묒꽦
    cy.visit("http://localhost:5183/posts/new");
    cy.get('input[placeholder*="?쒕ぉ"]').type("??젣 ?뚯뒪??湲");
    cy.get('textarea[placeholder*="?댁슜"]').type("??湲? ??젣???덉젙?낅땲??");
    cy.contains("?묒꽦?섍린").click();
    
    // ?묒꽦??湲 ?뺤씤
    cy.contains("??젣 ?뚯뒪??湲").should("exist");
    
    // ??젣 踰꾪듉 ?대┃
    cy.contains("??젣").click();
    
    // ?뺤씤 ?ㅼ씠?쇰줈洹?泥섎━
    cy.on('window:confirm', () => true);
    
    // 釉붾줈洹?紐⑸줉?쇰줈 ?뚯븘媛湲?    cy.visit("http://localhost:5183/blogs");
    
    // ??젣??湲 ?뺤씤 (議댁옱?섏? ?딆쓬)
    cy.contains("??젣 ?뚯뒪??湲").should("not.exist");
  });
});
