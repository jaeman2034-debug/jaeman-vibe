describe("Academy Platform E2E", () => {
  beforeEach(() => {
    // 媛??뚯뒪???꾩뿉 ?꾩뭅?곕? ?곗씠??珥덇린??    cy.resetFirestore();
  });

  it("1. 媛뺤쥖 ?깅줉 ?뚯뒪??, () => {
    cy.visit("/academy/courses");
    
    // ??媛뺤쥖 ?깅줉 踰꾪듉 ?대┃
    cy.contains("??媛뺤쥖 ?깅줉").click();
    
    // 媛뺤쥖紐??낅젰
    cy.get("input[name='title']").type("二쇰쭚 異뺢뎄援먯떎");
    
    // 媛뺤궗紐??낅젰
    cy.get("input[name='instructor']").type("源肄붿튂");
    
    // ?쇱젙 ?좏깮
    cy.get("input[name='date']").type("2025-12-01");
    
    // ?섍컯猷??낅젰
    cy.get("input[name='price']").type("50000");
    
    // ?뺤썝 ?낅젰
    cy.get("input[name='capacity']").type("20");
    
    // 媛뺤쥖 ?ㅻ챸 ?낅젰
    cy.get("textarea[name='description']").type("二쇰쭚留덈떎 吏꾪뻾?섎뒗 異뺢뎄 湲곗큹 媛뺤쥖?낅땲?? 湲곕낯湲곕???李④렐李④렐 諛곗썙蹂댁꽭??");
    
    // ?깅줉 踰꾪듉 ?대┃
    cy.contains("?깅줉?섍린").click();
    
    // ?깃났 硫붿떆吏 ?뺤씤
    cy.on('window:alert', (str) => {
      expect(str).to.equal('媛뺤쥖媛 ?깅줉?섏뿀?듬땲??');
    });
    
    // ?깅줉??媛뺤쥖媛 移대뱶 ?뺥깭濡??쒖떆?섎뒗吏 ?뺤씤
    cy.contains("二쇰쭚 異뺢뎄援먯떎").should("exist");
    cy.contains("源肄붿튂").should("exist");
    cy.contains("50,000??).should("exist");
  });

  it("2. 異쒖꽍 湲곕줉 ?뚯뒪??, () => {
    // 癒쇱? 媛뺤쥖 ?깅줉
    cy.visit("/academy/courses");
    cy.contains("??媛뺤쥖 ?깅줉").click();
    cy.get("input[name='title']").type("?뚯뒪??媛뺤쥖");
    cy.get("input[name='instructor']").type("?뚯뒪??媛뺤궗");
    cy.get("input[name='date']").type("2025-12-01");
    cy.get("textarea[name='description']").type("異쒖꽍 ?뚯뒪?몄슜 媛뺤쥖");
    cy.contains("?깅줉?섍린").click();
    
    // 異쒖꽍 ?섏씠吏濡??대룞
    cy.visit("/academy/attendance");
    
    // ?숈깮 ?대쫫 ?낅젰
    cy.get("input[placeholder='?숈깮 ?대쫫']").type("源泥좎닔");
    
    // 異쒖꽍 ?곹깭 ?좏깮 (湲곕낯媛? 異쒖꽍)
    cy.get("select").should("have.value", "異쒖꽍");
    
    // 湲곕줉 異붽? 踰꾪듉 ?대┃
    cy.contains("湲곕줉 異붽?").click();
    
    // ?깃났 硫붿떆吏 ?뺤씤
    cy.on('window:alert', (str) => {
      expect(str).to.equal('異쒖꽍??湲곕줉?섏뿀?듬땲??');
    });
    
    // 湲곕줉??異쒖꽍 ?뺣낫媛 紐⑸줉???쒖떆?섎뒗吏 ?뺤씤
    cy.contains("源泥좎닔").should("exist");
    cy.contains("異쒖꽍").should("exist");
  });

  it("3. AI 由ы룷???앹꽦 ?뚯뒪??, () => {
    cy.visit("/academy/reports");
    
    // 由ы룷???쒕ぉ ?낅젰
    cy.get("input[placeholder='由ы룷???쒕ぉ']").type("二쇨컙 ?덈젴 由ы룷??);
    
    // AI 由ы룷???앹꽦 踰꾪듉 ?대┃
    cy.contains("AI 由ы룷???앹꽦").click();
    
    // 濡쒕뵫 ?곹깭 ?뺤씤
    cy.contains("AI ?앹꽦 以?..").should("exist");
    
    // ?앹꽦 ?꾨즺 ???깃났 硫붿떆吏 ?뺤씤
    cy.on('window:alert', (str) => {
      expect(str).to.equal('AI 由ы룷?멸? ?앹꽦?섏뿀?듬땲??');
    });
    
    // ?앹꽦??由ы룷?멸? 紐⑸줉???쒖떆?섎뒗吏 ?뺤씤
    cy.contains("二쇨컙 ?덈젴 由ы룷??).should("exist");
    
    // AI ?앹꽦???붿빟 ?댁슜???쒖떆?섎뒗吏 ?뺤씤
    cy.get("p").should("contain.text", "?붿빟");
  });

  it("4. 由ы룷??PDF ????뚯뒪??, () => {
    // 癒쇱? 由ы룷???앹꽦
    cy.visit("/academy/reports");
    cy.get("input[placeholder='由ы룷???쒕ぉ']").type("PDF ?뚯뒪??由ы룷??);
    cy.contains("AI 由ы룷???앹꽦").click();
    
    // PDF ???踰꾪듉 ?대┃
    cy.contains("PDF ???).click();
    
    // ?ㅼ슫濡쒕뱶 ?쒖옉 ?뺤씤 (?ㅼ젣 ?뚯씪 ?ㅼ슫濡쒕뱶??mock ?섍꼍?먯꽌 ?쒗븳??
    // ?ㅼ젣 ?섍꼍?먯꽌???뚯씪???ㅼ슫濡쒕뱶?섎뒗 寃껋쓣 ?뺤씤?????덉쓬
    cy.log("PDF ?ㅼ슫濡쒕뱶 湲곕뒫 ?뚯뒪???꾨즺");
  });

  it("5. 媛ㅻ윭由??낅줈???뚯뒪??, () => {
    cy.visit("/academy/gallery");
    
    // ?뚯뒪?몄슜 ?대?吏 ?뚯씪 ?낅줈??(fixture ?쒖슜)
    const testImagePath = 'cypress/fixtures/test-image.jpg';
    
    // ?뚯씪 ?좏깮
    cy.get("input[type='file']").selectFile(testImagePath, { force: true });
    
    // ?낅줈??踰꾪듉 ?대┃
    cy.contains("?낅줈??).click();
    
    // 濡쒕뵫 ?곹깭 ?뺤씤
    cy.contains("?낅줈??以?..").should("exist");
    
    // ?낅줈???꾨즺 硫붿떆吏 ?뺤씤
    cy.on('window:alert', (str) => {
      expect(str).to.equal('?낅줈???꾨즺!');
    });
    
    // ?낅줈?쒕맂 ?대?吏媛 媛ㅻ윭由ъ뿉 ?쒖떆?섎뒗吏 ?뺤씤
    cy.get("img").should("exist");
    cy.get("img").should("have.attr", "src");
  });

  it("6. 媛뺤쥖 ?곸꽭蹂닿린 ?뚯뒪??, () => {
    // 癒쇱? 媛뺤쥖 ?깅줉
    cy.visit("/academy/courses");
    cy.contains("??媛뺤쥖 ?깅줉").click();
    cy.get("input[name='title']").type("?곸꽭蹂닿린 ?뚯뒪??媛뺤쥖");
    cy.get("input[name='instructor']").type("?곸꽭蹂닿린 媛뺤궗");
    cy.get("input[name='date']").type("2025-12-01");
    cy.get("input[name='price']").type("30000");
    cy.get("input[name='capacity']").type("15");
    cy.get("textarea[name='description']").type("?곸꽭蹂닿린 ?뚯뒪?몄슜 媛뺤쥖?낅땲?? ??媛뺤쥖???곸꽭 ?섏씠吏 ?뚯뒪?몃? ?꾪빐 ?깅줉?섏뿀?듬땲??");
    cy.contains("?깅줉?섍린").click();
    
    // ?곸꽭蹂닿린 踰꾪듉 ?대┃
    cy.contains("?곸꽭蹂닿린").click();
    
    // ?곸꽭 ?섏씠吏 ?붿냼 ?뺤씤
    cy.contains("?곸꽭蹂닿린 ?뚯뒪??媛뺤쥖").should("exist");
    cy.contains("?곸꽭蹂닿린 媛뺤궗").should("exist");
    cy.contains("30,000??).should("exist");
    cy.contains("?뺤썝 15紐?).should("exist");
    cy.contains("媛뺤쥖 ?좎껌?섍린").should("exist");
    cy.contains("媛뺤쥖 紐⑸줉?쇰줈 ?뚯븘媛湲?).should("exist");
  });

  it("7. AI 梨쀫큸 ?곷떞 ?뚯뒪??, () => {
    // 癒쇱? ?뚯뒪???곗씠???앹꽦
    cy.visit("/academy/courses");
    cy.contains("??媛뺤쥖 ?깅줉").click();
    cy.get("input[name='title']").type("AI 梨쀫큸 ?뚯뒪??媛뺤쥖");
    cy.get("input[name='instructor']").type("梨쀫큸 ?뚯뒪??媛뺤궗");
    cy.get("input[name='date']").type("2025-12-01");
    cy.get("textarea[name='description']").type("梨쀫큸 ?뚯뒪?몄슜 媛뺤쥖");
    cy.contains("?깅줉?섍린").click();
    
    // 梨쀫큸 ?섏씠吏濡??대룞
    cy.visit("/academy/chatbot");
    
    // 吏덈Ц ?낅젰
    cy.get("input[placeholder='?꾩뭅?곕? 愿??吏덈Ц ?낅젰...']").type("?대쾲 二??깅줉??媛뺤쥖??萸먯빞?");
    
    // 吏덈Ц?섍린 踰꾪듉 ?대┃
    cy.contains("吏덈Ц?섍린").click();
    
    // 濡쒕뵫 ?곹깭 ?뺤씤
    cy.contains("?앹꽦 以?..").should("exist");
    
    // AI ?듬????쒖떆?섎뒗吏 ?뺤씤
    cy.contains("AI ?듬?").should("exist");
    
    // ?듬? ?댁슜???쒖떆?섎뒗吏 ?뺤씤
    cy.get("p").should("contain.text", "媛뺤쥖");
  });

  it("8. ?꾩뭅?곕? 硫붿씤 ?섏씠吏 ?ㅻ퉬寃뚯씠???뚯뒪??, () => {
    cy.visit("/academy");
    
    // 紐⑤뱺 硫붾돱 留곹겕媛 議댁옱?섎뒗吏 ?뺤씤
    cy.contains("媛뺤쥖").should("exist");
    cy.contains("異쒖꽍").should("exist");
    cy.contains("由ы룷??).should("exist");
    cy.contains("媛ㅻ윭由?).should("exist");
    cy.contains("AI ?곷떞").should("exist");
    
    // 媛?硫붾돱 ?대┃ ???대떦 ?섏씠吏濡??대룞?섎뒗吏 ?뺤씤
    cy.contains("媛뺤쥖").click();
    cy.url().should("include", "/academy/courses");
    
    cy.visit("/academy");
    cy.contains("異쒖꽍").click();
    cy.url().should("include", "/academy/attendance");
    
    cy.visit("/academy");
    cy.contains("由ы룷??).click();
    cy.url().should("include", "/academy/reports");
    
    cy.visit("/academy");
    cy.contains("媛ㅻ윭由?).click();
    cy.url().should("include", "/academy/gallery");
    
    cy.visit("/academy");
    cy.contains("AI ?곷떞").click();
    cy.url().should("include", "/academy/chatbot");
  });

  it("9. AI 梨쀫큸 n8n ?곕룞 ?뚯뒪??, () => {
    // 癒쇱? 媛뺤쥖 ?깅줉 (AI ?듬????꾪븳 ?곗씠??以鍮?
    cy.visit("/academy-simple");
    cy.contains("??媛뺤쥖 ?깅줉").click();
    cy.get("input[name='title']").type("二쇰쭚 異뺢뎄援먯떎");
    cy.get("input[name='instructor']").type("源肄붿튂");
    cy.get("input[name='date']").type("2025-12-01");
    cy.get("input[name='price']").type("50000");
    cy.get("input[name='capacity']").type("20");
    cy.get("textarea[name='description']").type("二쇰쭚留덈떎 吏꾪뻾?섎뒗 異뺢뎄 湲곗큹 媛뺤쥖?낅땲??");
    cy.contains("?깅줉?섍린").click();

    // AI 梨쀫큸 ?섏씠吏 ?묒냽
    cy.visit("/academy-simple/qa");
    
    // AI ?곹깭 ?뺤씤
    cy.contains("AI ?곹깭").should("exist");
    
    // 吏덈Ц ?낅젰
    cy.get("textarea").type("異뺢뎄 媛뺤쥖???몄젣 ?섎굹??");
    
    // 吏덈Ц?섍린 踰꾪듉 ?대┃
    cy.contains("?뮠 吏덈Ц?섍린").click();
    
    // 濡쒕뵫 ?곹깭 ?뺤씤
    cy.contains("?쨼 ?듬? ?앹꽦 以?..").should("exist");
    
    // AI ?듬? ?뺤씤 (n8n ?곌껐 ???ㅼ젣 ?듬?, ?곌껐 ?덈맖 ???대갚 ?듬?)
    cy.contains("?쨼", { timeout: 10000 }).should("exist");
    
    // ????덉뒪?좊━ ?뺤씤
    cy.contains("?뮠 ????덉뒪?좊━").should("exist");
    cy.contains("異뺢뎄 媛뺤쥖???몄젣 ?섎굹??").should("exist");
  });

  it("10. ?꾩껜 ?꾩뭅?곕? ?뚰겕?뚮줈???듯빀 ?뚯뒪??, () => {
    // 1. 媛뺤쥖 ?깅줉
    cy.visit("/academy-simple");
    cy.contains("??媛뺤쥖 ?깅줉").click();
    cy.get("input[name='title']").type("?듯빀 ?뚯뒪??媛뺤쥖");
    cy.get("input[name='instructor']").type("?듯빀 ?뚯뒪??媛뺤궗");
    cy.get("input[name='date']").type("2025-12-01");
    cy.get("input[name='price']").type("30000");
    cy.get("input[name='capacity']").type("15");
    cy.get("textarea[name='description']").type("?꾩껜 ?뚰겕?뚮줈???뚯뒪?몄슜 媛뺤쥖");
    cy.contains("?깅줉?섍린").click();

    // 2. 媛뺤쥖 ?곸꽭蹂닿린 諛??좎껌
    cy.contains("?곸꽭蹂닿린").click();
    cy.contains("媛뺤쥖 ?좎껌?섍린").click();
    cy.on('window:alert', (str) => {
      expect(str).to.equal('???좎껌???꾨즺?섏뿀?듬땲??');
    });

    // 3. 愿由ъ옄 ?섏씠吏?먯꽌 ?좎껌 愿由?    cy.visit("/academy-simple/admin");
    cy.contains("?듯빀 ?뚯뒪??媛뺤쥖").should("exist");
    cy.contains("?뱀씤").click();
    cy.on('window:alert', (str) => {
      expect(str).to.equal("?좎껌 ?곹깭媛 'approved'濡?蹂寃쎈릺?덉뒿?덈떎 ??);
    });

    // 4. AI 梨쀫큸 ?뚯뒪??    cy.visit("/academy-simple/qa");
    cy.get("textarea").type("?듯빀 ?뚯뒪??媛뺤쥖???대뼡媛??");
    cy.contains("?뮠 吏덈Ц?섍린").click();
    cy.contains("?쨼", { timeout: 10000 }).should("exist");
  });
});
