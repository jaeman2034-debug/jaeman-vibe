// cypress/e2e/academy-alerts.cy.ts

describe('Academy Alerts Flow', () => {
  beforeEach(() => {
    // ?뚯뒪????Firestore 珥덇린??    cy.task('resetFirestore')
    
    // n8n ?뱁썒 ?명꽣?됲듃 ?ㅼ젙
    cy.intercept('POST', '**/webhook/enroll', { statusCode: 200, body: { success: true } }).as('enrollWebhook')
    cy.intercept('POST', '**/webhook/payment', { statusCode: 200, body: { success: true } }).as('paymentWebhook')
  })

  it('?섍컯 ?좎껌 ??移댁뭅?ㅽ넚+?대찓???뚮┝ ?몃━嫄?, () => {
    // 1. 媛뺤쥖 ?곸꽭 ?섏씠吏 吏꾩엯
    cy.visit('/academy/courses/demo-course')

    // 2. ?섍컯 ?좎껌 ?낅젰
    cy.get('input[name="student"]').type('?띻만??)
    cy.get('input[name="phone"]').type('01012345678')
    cy.get('input[name="email"]').type('hong@test.com')

    // 3. ?좎껌 踰꾪듉 ?대┃
    cy.get('button').contains('?섍컯 ?좎껌').click()

    // 4. ?깃났 硫붿떆吏 ?뺤씤
    cy.contains('?섍컯 ?좎껌???묒닔?섏뿀?듬땲??).should('be.visible')

    // 5. Firestore???뺤긽 ??λ릺?덈뒗吏 ?뺤씤
    cy.task('getFirestoreDoc', {
      collection: 'academyCourses/demo-course/enrollments',
      field: 'student',
      value: '?띻만??
    }).then((doc) => {
      expect(doc).to.not.be.null
      expect(doc.student).to.equal('?띻만??)
      expect(doc.phone).to.equal('01012345678')
      expect(doc.email).to.equal('hong@test.com')
      expect(doc.paid).to.be.false
    })

    // 6. n8n Webhook ?몄텧 ?뺤씤
    cy.wait('@enrollWebhook').then((interception) => {
      expect(interception.response.statusCode).to.eq(200)
      
      // ?뱁썒?쇰줈 ?꾩넚???곗씠??寃利?      const requestBody = interception.request.body
      expect(requestBody.student).to.equal('?띻만??)
      expect(requestBody.courseTitle).to.contain('demo-course')
      expect(requestBody.phone).to.equal('01012345678')
      expect(requestBody.email).to.equal('hong@test.com')
    })

    // 7. ?뚮┝ 諛쒖넚 濡쒓렇 ?뺤씤 (Firebase Functions 濡쒓렇)
    cy.task('checkFunctionLogs', {
      functionName: 'notifyAcademyEnrollment',
      expectedMessage: '?띻만???좎껌 ?뺣낫 ??n8n ?꾩넚 ?꾨즺'
    }).then((logFound) => {
      expect(logFound).to.be.true
    })
  })

  it('寃곗젣 ?꾨즺 ??移댁뭅?ㅽ넚+?대찓???뚮┝ ?몃━嫄?, () => {
    // 1. 癒쇱? ?섍컯 ?좎껌 ?앹꽦
    cy.task('createTestEnrollment', {
      courseId: 'demo-course',
      student: '?띻만??,
      phone: '01012345678',
      email: 'hong@test.com'
    })

    // 2. 愿由ъ옄 寃곗젣 ?뱀씤 ?섏씠吏 ?대룞
    cy.visit('/academy/courses/admin/demo-course')

    // 3. ?뱀젙 ?섍컯??寃곗젣 泥섎━
    cy.contains('?띻만??).parent().find('button').contains('寃곗젣 ?뺤씤').click()

    // 4. 寃곗젣 ?꾨즺 硫붿떆吏 ?뺤씤
    cy.contains('寃곗젣媛 ?꾨즺?섏뿀?듬땲??).should('be.visible')

    // 5. Firestore ?낅뜲?댄듃 諛섏쁺 ?뺤씤
    cy.task('getFirestoreDoc', {
      collection: 'academyCourses/demo-course/enrollments',
      field: 'student',
      value: '?띻만??
    }).then((doc) => {
      expect(doc.paid).to.be.true
      expect(doc.paymentAmount).to.be.a('number')
      expect(doc.paidAt).to.be.a('string')
    })

    // 6. n8n Webhook ?몄텧 ?뺤씤
    cy.wait('@paymentWebhook').then((interception) => {
      expect(interception.response.statusCode).to.eq(200)
      
      // ?뱁썒?쇰줈 ?꾩넚???곗씠??寃利?      const requestBody = interception.request.body
      expect(requestBody.student).to.equal('?띻만??)
      expect(requestBody.courseTitle).to.contain('demo-course')
      expect(requestBody.paymentAmount).to.be.a('number')
      expect(requestBody.type).to.equal('payment')
    })

    // 7. ?뚮┝ 諛쒖넚 濡쒓렇 ?뺤씤 (Firebase Functions 濡쒓렇)
    cy.task('checkFunctionLogs', {
      functionName: 'notifyAcademyPayment',
      expectedMessage: '?띻만??寃곗젣 ?꾨즺 ?뺣낫 ??n8n ?꾩넚 ?꾨즺'
    }).then((logFound) => {
      expect(logFound).to.be.true
    })
  })

  it('?꾩껜 ?뚮줈???듯빀 ?뚯뒪??(?좎껌 ??寃곗젣)', () => {
    // 1. ?섍컯 ?좎껌
    cy.visit('/academy/courses/demo-course')
    cy.get('input[name="student"]').type('源泥좎닔')
    cy.get('input[name="phone"]').type('01087654321')
    cy.get('input[name="email"]').type('kim@test.com')
    cy.get('button').contains('?섍컯 ?좎껌').click()

    // 2. ?좎껌 ?꾨즺 ?뺤씤
    cy.contains('?섍컯 ?좎껌???묒닔?섏뿀?듬땲??).should('be.visible')
    cy.wait('@enrollWebhook')

    // 3. 愿由ъ옄 ?섏씠吏?먯꽌 寃곗젣 泥섎━
    cy.visit('/academy/courses/admin/demo-course')
    cy.contains('源泥좎닔').parent().find('button').contains('寃곗젣 ?뺤씤').click()

    // 4. 寃곗젣 ?꾨즺 ?뺤씤
    cy.contains('寃곗젣媛 ?꾨즺?섏뿀?듬땲??).should('be.visible')
    cy.wait('@paymentWebhook')

    // 5. 理쒖쥌 ?곹깭 ?뺤씤
    cy.task('getFirestoreDoc', {
      collection: 'academyCourses/demo-course/enrollments',
      field: 'student',
      value: '源泥좎닔'
    }).then((doc) => {
      expect(doc.paid).to.be.true
      expect(doc.student).to.equal('源泥좎닔')
    })

    // 6. ??踰덉쓽 ?뱁썒 ?몄텧 紐⑤몢 ?뺤씤
    cy.get('@enrollWebhook.all').should('have.length', 1)
    cy.get('@paymentWebhook.all').should('have.length', 1)
  })

  it('?먮윭 耳?댁뒪: ?섎せ???곗씠?곕줈 ?좎껌', () => {
    cy.visit('/academy/courses/demo-course')

    // ?섎せ???곗씠???낅젰
    cy.get('input[name="student"]').type('')
    cy.get('input[name="phone"]').type('invalid-phone')
    cy.get('input[name="email"]').type('invalid-email')

    cy.get('button').contains('?섍컯 ?좎껌').click()

    // ?먮윭 硫붿떆吏 ?뺤씤
    cy.contains('?щ컮瑜??뺣낫瑜??낅젰?댁＜?몄슂').should('be.visible')

    // ?뱁썒???몄텧?섏? ?딆븯?붿? ?뺤씤
    cy.get('@enrollWebhook.all').should('have.length', 0)
  })

  it('?먮윭 耳?댁뒪: 議댁옱?섏? ?딅뒗 媛뺤쥖 ?좎껌', () => {
    cy.visit('/academy/courses/non-existent-course')

    // 404 ?먮뒗 ?먮윭 ?섏씠吏 ?뺤씤
    cy.contains('媛뺤쥖瑜?李얠쓣 ???놁뒿?덈떎').should('be.visible')
  })
})
