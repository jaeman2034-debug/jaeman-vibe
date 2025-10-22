/**
 * Google Sites 자동 퍼블리시 Apps Script
 * 
 * 사용법:
 * 1. script.google.com에서 새 프로젝트 생성
 * 2. 이 코드를 Code.gs에 복사
 * 3. 웹앱으로 배포 (실행: 나, 접근: 모든 사용자)
 * 4. 웹앱 URL을 n8n에서 호출
 */

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    
    // HTML 생성
    const html = generateBlogHTML(body);
    
    // Drive에 HTML 파일 생성
    const fileName = `${body.slug || ('post-' + Date.now())}.html`;
    const file = DriveApp.createFile(fileName, html, MimeType.HTML);
    
    // 공개 설정
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // TODO: Sites에 해당 파일을 포함하는 섹션을 수동으로 만들어두고, 
    // 이 파일의 공개 링크를 임베드로 사용
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        ok: true, 
        fileId: file.getId(), 
        webUrl: file.getUrl(),
        fileName: fileName
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ 
        ok: false, 
        error: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function generateBlogHTML(data) {
  const eventDate = new Date(data.eventStart).toLocaleString('ko-KR');
  const priceText = data.price ? `참가비: ${data.price.toLocaleString()}원` : '참가비: 무료';
  
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px; 
      margin: 0 auto; 
      padding: 20px; 
      line-height: 1.6;
      color: #333;
    }
    .hero { 
      text-align: center; 
      margin-bottom: 40px; 
    }
    .og-image { 
      max-width: 100%; 
      border-radius: 12px; 
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }
    h1 { 
      color: #2563eb; 
      margin-bottom: 10px;
    }
    .meta { 
      background: #f8fafc; 
      padding: 20px; 
      border-radius: 8px; 
      margin: 20px 0;
    }
    .cta-button { 
      display: inline-block; 
      background: #2563eb; 
      color: white; 
      padding: 12px 24px; 
      text-decoration: none; 
      border-radius: 8px; 
      font-weight: bold;
      margin-top: 20px;
    }
    .cta-button:hover { 
      background: #1d4ed8; 
    }
    .badges { 
      margin: 20px 0; 
    }
    .badge { 
      display: inline-block; 
      background: #e5e7eb; 
      padding: 4px 8px; 
      border-radius: 4px; 
      font-size: 12px; 
      margin-right: 8px;
    }
  </style>
</head>
<body>
  <div class="hero">
    <img src="${data.ogUrl}" alt="${data.title}" class="og-image">
    <h1>${data.title}</h1>
    <p>${data.subtitle || '즐겁고 안전한 참여를 위해 기본 수칙을 확인해주세요.'}</p>
  </div>
  
  <div class="meta">
    <h3>📅 일정 및 장소</h3>
    <p><strong>일시:</strong> ${eventDate}</p>
    <p><strong>장소:</strong> ${data.venue || '미정'}</p>
    <p><strong>${priceText}</strong></p>
  </div>
  
  <div class="badges">
    ${(data.tags || []).map(tag => `<span class="badge">${tag}</span>`).join('')}
    ${(data.leafs || []).map(leaf => `<span class="badge">${leaf}</span>`).join('')}
  </div>
  
  <div>
    <h3>📋 준비사항</h3>
    <ul>
      <li>운동화 (깔끔한 실내용 권장)</li>
      <li>충분한 물과 수건</li>
      <li>편한 운동복</li>
      <li>긍정적인 마음가짐! 😊</li>
    </ul>
  </div>
  
  <div style="text-align: center;">
    <a href="${data.ctaUrl}" class="cta-button">지금 신청하기</a>
  </div>
  
  <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
    <p>${data.clubName || 'YAGO SPORTS'} | ${data.sport || 'sports'}</p>
  </footer>
</body>
</html>`;
}

// 테스트용 함수
function testGenerateBlog() {
  const testData = {
    title: "U10 기초 아카데미 3기 모집",
    subtitle: "초보 환영 · 장비 대여",
    eventStart: Date.now() + 7 * 24 * 60 * 60 * 1000,
    venue: "송산2동 체육공원",
    price: 15000,
    tags: ["초보", "유소년"],
    leafs: ["U10"],
    clubName: "YAGO FC",
    sport: "soccer",
    ctaUrl: "https://yago.sports/meetups/m1",
    ogUrl: "https://example.com/og-image.png"
  };
  
  const html = generateBlogHTML(testData);
  console.log(html);
}
