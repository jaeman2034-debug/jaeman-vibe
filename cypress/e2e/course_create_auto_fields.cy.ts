// Cypress 媛뺤쥖 ?깅줉 ?먮룞???뚯뒪??// 媛뺤쥖 ?깅줉 ??Firestore ?뺤씤 ???꾨씫 ?꾨뱶 ?먮룞 蹂댁젙 寃利?
describe("Course Creation with Auto Default Fields", () => {
  beforeEach(() => {
    // Firestore Emulator 珥덇린??    cy.task("clearFirestore");
  });

  it("should create a course and auto-fill missing fields via Functions", () => {
    // 媛뺤쥖 ?깅줉 ?섏씠吏濡??대룞
    cy.visit("/courses/new");

    // ?꾩닔 ?낅젰留?(?쇰? ?꾨뱶 ?꾨씫)
    cy.get("input[name=title]").type("?곕え 媛뺤쥖");
    cy.get("textarea[name=description]").type("?곕え??媛뺤쥖?낅땲??");
    cy.get("input[name=coach]").type("源肄붿튂");
    cy.get("input[name=startDate]").type("2025-10-10");
    cy.get("input[name=endDate]").type("2025-12-31");
    cy.get("input[name=capacity]").type("20");

    // location, fee, items, target, curriculum, contact???낅젰?섏? ?딆쓬
    // (Functions?먯꽌 ?먮룞?쇰줈 湲곕낯媛?梨꾩썙吏?붿? ?뺤씤)

    // ?깅줉 踰꾪듉 ?대┃
    cy.get("button[type=submit]").click();

    // ?깃났 硫붿떆吏 ?뺤씤
    cy.contains("媛뺤쥖媛 ?깃났?곸쑝濡??깅줉?섏뿀?듬땲??).should("be.visible");

    // ?좎떆 ?湲?(Functions ?ㅽ뻾 ?쒓컙)
    cy.wait(3000);

    // Firestore?먯꽌 ?덈줈 ?앹꽦??媛뺤쥖 ?뺤씤
    cy.task("getCourseByTitle", "?곕え 媛뺤쥖").then((course: any) => {
      expect(course).to.exist;
      expect(course.title).to.equal("?곕え 媛뺤쥖");
      expect(course.description).to.equal("?곕え??媛뺤쥖?낅땲??");
      expect(course.coach).to.equal("源肄붿튂");
      expect(course.startDate).to.equal("2025-10-10");
      expect(course.endDate).to.equal("2025-12-31");
      expect(course.capacity).to.equal(20);

      // Functions?먯꽌 ?먮룞?쇰줈 梨꾩썙吏?湲곕낯媛??뺤씤
      expect(course.location).to.equal("?뚰쓽 泥댁쑁怨듭썝 A援ъ옣");
      expect(course.fee).to.equal("臾대즺");
      expect(course.items).to.equal("?대룞?? 媛쒖씤 臾쇰퀝");
      expect(course.target).to.equal("珥덈벑?숈깮 ??숇뀈 (7~10??");
      expect(course.contact).to.equal("010-1234-5678");

      // 而ㅻ━?섎읆 諛곗뿴 ?뺤씤
      expect(course.curriculum).to.be.an("array");
      expect(course.curriculum).to.have.length(3);
      expect(course.curriculum[0]).to.equal("?쒕━釉?湲곕낯 ?덈젴");
      expect(course.curriculum[1]).to.equal("?⑥뒪 & ??뚰겕");
      expect(course.curriculum[2]).to.equal("誘몃땲寃뚯엫 ?ㅼ뒿");
    });
  });

  it("should create a course with partial fields and auto-fill remaining", () => {
    // 媛뺤쥖 ?깅줉 ?섏씠吏濡??대룞
    cy.visit("/courses/new");

    // ?쇰? ?꾨뱶留??낅젰 (location, fee???낅젰, ?섎㉧吏???꾨씫)
    cy.get("input[name=title]").type("遺遺??낅젰 媛뺤쥖");
    cy.get("textarea[name=description]").type("?쇰? ?꾨뱶留??낅젰??媛뺤쥖?낅땲??");
    cy.get("input[name=coach]").type("諛뺤퐫移?);
    cy.get("input[name=startDate]").type("2025-11-01");
    cy.get("input[name=endDate]").type("2025-12-31");
    cy.get("input[name=capacity]").type("15");
    
    // location怨?fee???낅젰
    cy.get("input[name=location]").type("?쒖슱 ?щ┝?쎄났??);
    cy.get("input[name=fee]").type("50,000??);

    // items, target, curriculum, contact???낅젰?섏? ?딆쓬

    // ?깅줉 踰꾪듉 ?대┃
    cy.get("button[type=submit]").click();

    // ?깃났 硫붿떆吏 ?뺤씤
    cy.contains("媛뺤쥖媛 ?깃났?곸쑝濡??깅줉?섏뿀?듬땲??).should("be.visible");

    // ?좎떆 ?湲?(Functions ?ㅽ뻾 ?쒓컙)
    cy.wait(3000);

    // Firestore?먯꽌 ?덈줈 ?앹꽦??媛뺤쥖 ?뺤씤
    cy.task("getCourseByTitle", "遺遺??낅젰 媛뺤쥖").then((course: any) => {
      expect(course).to.exist;
      expect(course.title).to.equal("遺遺??낅젰 媛뺤쥖");
      expect(course.description).to.equal("?쇰? ?꾨뱶留??낅젰??媛뺤쥖?낅땲??");
      expect(course.coach).to.equal("諛뺤퐫移?);
      expect(course.startDate).to.equal("2025-11-01");
      expect(course.endDate).to.equal("2025-12-31");
      expect(course.capacity).to.equal(15);

      // ?낅젰???꾨뱶??洹몃?濡??좎?
      expect(course.location).to.equal("?쒖슱 ?щ┝?쎄났??);
      expect(course.fee).to.equal("50,000??);

      // ?꾨씫???꾨뱶??Functions?먯꽌 ?먮룞?쇰줈 梨꾩썙吏?      expect(course.items).to.equal("?대룞?? 媛쒖씤 臾쇰퀝");
      expect(course.target).to.equal("珥덈벑?숈깮 ??숇뀈 (7~10??");
      expect(course.contact).to.equal("010-1234-5678");

      // 而ㅻ━?섎읆 諛곗뿴 ?뺤씤
      expect(course.curriculum).to.be.an("array");
      expect(course.curriculum).to.have.length(3);
      expect(course.curriculum[0]).to.equal("?쒕━釉?湲곕낯 ?덈젴");
      expect(course.curriculum[1]).to.equal("?⑥뒪 & ??뚰겕");
      expect(course.curriculum[2]).to.equal("誘몃땲寃뚯엫 ?ㅼ뒿");
    });
  });

  it("should create a course with all fields and not override existing values", () => {
    // 媛뺤쥖 ?깅줉 ?섏씠吏濡??대룞
    cy.visit("/courses/new");

    // 紐⑤뱺 ?꾨뱶 ?낅젰
    cy.get("input[name=title]").type("?꾩쟾 ?낅젰 媛뺤쥖");
    cy.get("textarea[name=description]").type("紐⑤뱺 ?꾨뱶瑜??낅젰??媛뺤쥖?낅땲??");
    cy.get("input[name=coach]").type("?댁퐫移?);
    cy.get("input[name=startDate]").type("2025-12-01");
    cy.get("input[name=endDate]").type("2025-12-31");
    cy.get("input[name=capacity]").type("25");
    
    // 異붽? ?꾨뱶?ㅻ룄 紐⑤몢 ?낅젰
    cy.get("input[name=location]").type("遺???댁슫?援?);
    cy.get("input[name=fee]").type("100,000??);
    cy.get("input[name=items]").type("異뺢뎄?? 異뺢뎄怨? 媛쒖씤 臾쇰퀝");
    cy.get("input[name=target]").type("以묓븰??(13~15??");
    cy.get("input[name=contact]").type("010-9876-5432");

    // 而ㅻ━?섎읆 ?낅젰 (textarea??以꾨컮轅덉쑝濡?援щ텇)
    cy.get("textarea[name=curriculum]").type("湲곕낯 泥대젰 ?덈젴\n怨좉툒 ?쒕━釉?湲곗닠\n?꾩닠 ?댄빐\n?ㅼ쟾 寃쎄린");

    // ?깅줉 踰꾪듉 ?대┃
    cy.get("button[type=submit]").click();

    // ?깃났 硫붿떆吏 ?뺤씤
    cy.contains("媛뺤쥖媛 ?깃났?곸쑝濡??깅줉?섏뿀?듬땲??).should("be.visible");

    // ?좎떆 ?湲?(Functions ?ㅽ뻾 ?쒓컙)
    cy.wait(3000);

    // Firestore?먯꽌 ?덈줈 ?앹꽦??媛뺤쥖 ?뺤씤
    cy.task("getCourseByTitle", "?꾩쟾 ?낅젰 媛뺤쥖").then((course: any) => {
      expect(course).to.exist;
      expect(course.title).to.equal("?꾩쟾 ?낅젰 媛뺤쥖");
      expect(course.description).to.equal("紐⑤뱺 ?꾨뱶瑜??낅젰??媛뺤쥖?낅땲??");
      expect(course.coach).to.equal("?댁퐫移?);
      expect(course.startDate).to.equal("2025-12-01");
      expect(course.endDate).to.equal("2025-12-31");
      expect(course.capacity).to.equal(25);

      // ?낅젰??紐⑤뱺 ?꾨뱶媛 洹몃?濡??좎???(Functions?먯꽌 ??뼱?곗? ?딆쓬)
      expect(course.location).to.equal("遺???댁슫?援?);
      expect(course.fee).to.equal("100,000??);
      expect(course.items).to.equal("異뺢뎄?? 異뺢뎄怨? 媛쒖씤 臾쇰퀝");
      expect(course.target).to.equal("以묓븰??(13~15??");
      expect(course.contact).to.equal("010-9876-5432");

      // 而ㅻ━?섎읆 諛곗뿴 ?뺤씤
      expect(course.curriculum).to.be.an("array");
      expect(course.curriculum).to.have.length(4);
      expect(course.curriculum[0]).to.equal("湲곕낯 泥대젰 ?덈젴");
      expect(course.curriculum[1]).to.equal("怨좉툒 ?쒕━釉?湲곗닠");
      expect(course.curriculum[2]).to.equal("?꾩닠 ?댄빐");
      expect(course.curriculum[3]).to.equal("?ㅼ쟾 寃쎄린");
    });
  });

  it("should verify Functions execution logs", () => {
    // 媛뺤쥖 ?깅줉 ?섏씠吏濡??대룞
    cy.visit("/courses/new");

    // ?꾩닔 ?낅젰留?    cy.get("input[name=title]").type("濡쒓렇 ?뺤씤 媛뺤쥖");
    cy.get("textarea[name=description]").type("Functions 濡쒓렇瑜??뺤씤?섎뒗 媛뺤쥖?낅땲??");
    cy.get("input[name=coach]").type("理쒖퐫移?);
    cy.get("input[name=startDate]").type("2025-10-01");
    cy.get("input[name=endDate]").type("2025-10-31");
    cy.get("input[name=capacity]").type("10");

    // ?깅줉 踰꾪듉 ?대┃
    cy.get("button[type=submit]").click();

    // ?깃났 硫붿떆吏 ?뺤씤
    cy.contains("媛뺤쥖媛 ?깃났?곸쑝濡??깅줉?섏뿀?듬땲??).should("be.visible");

    // ?좎떆 ?湲?(Functions ?ㅽ뻾 ?쒓컙)
    cy.wait(5000);

    // Functions 濡쒓렇 ?뺤씤
    cy.task("checkFunctionsLogs", "onCourseCreated").then((logs: any) => {
      expect(logs).to.exist;
      expect(logs.length).to.be.greaterThan(0);
      
      // 濡쒓렇?먯꽌 湲곕낯媛??명똿 硫붿떆吏 ?뺤씤
      const logMessage = logs.find((log: any) => 
        log.message && log.message.includes("媛뺤쥖 湲곕낯媛??먮룞 ?명똿 ?꾨즺")
      );
      expect(logMessage).to.exist;
    });
  });
});
