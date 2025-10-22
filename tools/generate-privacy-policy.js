#!/usr/bin/env node

/**
 * 🔒 야고 비서 개인정보 처리방침 PDF 자동 생성 도구
 */

import fs from 'fs';
import path from 'path';

// PDF 생성 라이브러리 설치 확인
try {
  require('pdf-lib');
} catch {
  console.log('📦 pdf-lib 설치 중...');
  const { execSync } = require('child_process');
  execSync('npm install pdf-lib', { stdio: 'inherit' });
}

const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

console.log('🔒 개인정보 처리방침 PDF 생성 시작...');

const privacyPolicy = {
  title: '야고 비서 개인정보 처리방침',
  version: 'v1.0',
  effectiveDate: '2024-01-01',
  company: {
    name: 'YAGO VIBE Inc.',
    ceo: '대표이사',
    address: '서울특별시 강남구 테헤란로 123',
    email: 'privacy@yagovibe.com',
    phone: '02-1234-5678'
  },
  content: `
야고 비서 개인정보 처리방침

YAGO VIBE Inc.(이하 "회사")는 「개인정보 보호법」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령에 따라 이용자의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 다음과 같이 개인정보 처리방침을 수립·공개합니다.

제1조 (개인정보의 처리목적)
회사는 다음의 목적을 위하여 개인정보를 처리합니다:
1. 음성 명령 인식 및 처리
2. 위치 기반 서비스 제공
3. 길안내 및 추천 서비스 제공
4. 사용자 맞춤형 서비스 제공
5. 서비스 개선 및 개발

제2조 (개인정보의 처리 및 보유기간)
1. 처리하는 개인정보의 항목:
   - 음성 데이터 (음성 인식 결과만 저장)
   - 위치 정보 (GPS 좌표)
   - 기기 정보 (OS, 앱 버전, 기기 모델)
   - 서비스 이용 기록

2. 보유기간:
   - 음성 데이터: 1년
   - 위치 정보: 6개월
   - 기기 정보: 3년
   - 서비스 이용 기록: 1년

제3조 (개인정보의 제3자 제공)
회사는 이용자의 개인정보를 제1조(개인정보의 처리목적)에서 명시한 범위 내에서만 처리하며, 이용자의 동의, 법률의 특별한 규정 등 개인정보 보호법 제17조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.

제3자 제공 현황:
- Kakao Mobility: 길찾기 서비스 제공
- Google Firebase: 데이터 저장 및 분석
- OpenAI: 음성 인식 및 AI 분석

제4조 (개인정보처리의 위탁)
회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다:
- Google Cloud Platform: 데이터 저장 및 처리
- Kakao Corporation: 지도 및 길찾기 서비스

제5조 (정보주체의 권리·의무 및 행사방법)
이용자는 개인정보주체로서 다음과 같은 권리를 행사할 수 있습니다:
1. 개인정보 처리정지 요구권
2. 개인정보 열람요구권
3. 개인정보 정정·삭제요구권
4. 손해배상청구권

제6조 (처리하는 개인정보의 항목)
회사는 다음의 개인정보 항목을 처리하고 있습니다:
- 필수항목: 없음 (익명 이용 가능)
- 선택항목: 음성 데이터, 위치 정보, 기기 정보

제7조 (개인정보의 파기)
회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.

제8조 (개인정보의 안전성 확보조치)
회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:
1. 관리적 조치: 내부관리계획 수립, 전담조직 운영
2. 기술적 조치: 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치
3. 물리적 조치: 전산실, 자료보관실 등의 접근통제

제9조 (개인정보보호책임자)
회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보보호책임자를 지정하고 있습니다.

개인정보보호책임자
- 성명: 개인정보보호책임자
- 연락처: privacy@yagovibe.com

제10조 (개인정보 처리방침 변경)
이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.

제11조 (권익침해 구제방법)
개인정보주체는 개인정보침해신고센터, 개인정보 분쟁조정위원회, 정보보호마크인증위원회 등에 분쟁해결이나 상담 등을 신청할 수 있습니다.

- 개인정보침해신고센터: privacy.go.kr (국번없이 182)
- 개인정보 분쟁조정위원회: www.kopico.go.kr (국번없이 1833-6972)
- 정보보호마크인증위원회: www.eprivacy.or.kr (02-550-9531~2)

제12조 (개인정보 처리방침 시행일)
이 방침은 2024년 1월 1일부터 시행됩니다.

문의처
YAGO VIBE Inc.
- 이메일: privacy@yagovibe.com
- 전화: 02-1234-5678
- 주소: 서울특별시 강남구 테헤란로 123
`
};

async function generatePrivacyPolicy() {
  try {
    // PDF 문서 생성
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // 페이지 설정
    const page = pdfDoc.addPage([595, 842]); // A4 크기
    const { width, height } = page.getSize();
    
    // 제목
    page.drawText(privacyPolicy.title, {
      x: 50,
      y: height - 50,
      size: 16,
      font: boldFont,
      color: rgb(0, 0, 0)
    });
    
    // 버전 및 날짜
    page.drawText(`버전: ${privacyPolicy.version}`, {
      x: 50,
      y: height - 80,
      size: 10,
      font: font,
      color: rgb(0.5, 0.5, 0.5)
    });
    
    page.drawText(`시행일: ${privacyPolicy.effectiveDate}`, {
      x: 200,
      y: height - 80,
      size: 10,
      font: font,
      color: rgb(0.5, 0.5, 0.5)
    });
    
    // 내용
    let yPosition = height - 120;
    const lineHeight = 12;
    const margin = 50;
    const maxWidth = width - (margin * 2);
    
    const lines = privacyPolicy.content.split('\n');
    
    for (const line of lines) {
      if (yPosition < 50) {
        // 새 페이지 추가
        const newPage = pdfDoc.addPage([595, 842]);
        yPosition = height - 50;
      }
      
      if (line.trim()) {
        // 제목인지 확인
        if (line.includes('제') && line.includes('조')) {
          page.drawText(line.trim(), {
            x: margin,
            y: yPosition,
            size: 11,
            font: boldFont,
            color: rgb(0, 0, 0)
          });
        } else {
          page.drawText(line.trim(), {
            x: margin,
            y: yPosition,
            size: 9,
            font: font,
            color: rgb(0, 0, 0)
          });
        }
      }
      
      yPosition -= lineHeight;
    }
    
    // 회사 정보
    const companyPage = pdfDoc.addPage([595, 842]);
    companyPage.drawText('회사 정보', {
      x: 50,
      y: height - 50,
      size: 14,
      font: boldFont,
      color: rgb(0, 0, 0)
    });
    
    let companyY = height - 80;
    const companyInfo = [
      `회사명: ${privacyPolicy.company.name}`,
      `대표이사: ${privacyPolicy.company.ceo}`,
      `주소: ${privacyPolicy.company.address}`,
      `이메일: ${privacyPolicy.company.email}`,
      `전화번호: ${privacyPolicy.company.phone}`
    ];
    
    for (const info of companyInfo) {
      companyPage.drawText(info, {
        x: 50,
        y: companyY,
        size: 10,
        font: font,
        color: rgb(0, 0, 0)
      });
      companyY -= 20;
    }
    
    // PDF 저장
    const pdfBytes = await pdfDoc.save();
    const outputPath = './store/privacy_policy.pdf';
    
    // 출력 디렉토리 생성
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, pdfBytes);
    
    console.log('✅ 개인정보 처리방침 PDF 생성 완료!');
    console.log(`📄 파일 위치: ${outputPath}`);
    
    // 2️⃣ HTML 버전도 생성 (웹 호스팅용)
    const htmlContent = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${privacyPolicy.title}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; border-bottom: 2px solid #007bff; }
        h2 { color: #555; margin-top: 30px; }
        .meta { color: #666; font-size: 0.9em; }
        .company-info { background: #f8f9fa; padding: 20px; border-radius: 5px; margin-top: 30px; }
    </style>
</head>
<body>
    <h1>${privacyPolicy.title}</h1>
    <div class="meta">
        <p>버전: ${privacyPolicy.version} | 시행일: ${privacyPolicy.effectiveDate}</p>
    </div>
    
    <div style="white-space: pre-line;">${privacyPolicy.content}</div>
    
    <div class="company-info">
        <h2>회사 정보</h2>
        <p><strong>회사명:</strong> ${privacyPolicy.company.name}</p>
        <p><strong>대표이사:</strong> ${privacyPolicy.company.ceo}</p>
        <p><strong>주소:</strong> ${privacyPolicy.company.address}</p>
        <p><strong>이메일:</strong> ${privacyPolicy.company.email}</p>
        <p><strong>전화번호:</strong> ${privacyPolicy.company.phone}</p>
    </div>
</body>
</html>`;
    
    const htmlPath = './store/privacy_policy.html';
    fs.writeFileSync(htmlPath, htmlContent);
    
    console.log('✅ 개인정보 처리방침 HTML 생성 완료!');
    console.log(`📄 파일 위치: ${htmlPath}`);
    
    console.log('');
    console.log('🎯 스토어 업로드 준비 완료!');
    console.log('   - PDF 파일을 App Store Connect / Play Console에 업로드');
    console.log('   - HTML 파일을 Firebase Hosting에 배포하여 URL 제공');
    
  } catch (error) {
    console.error('❌ 개인정보 처리방침 생성 실패:', error.message);
    process.exit(1);
  }
}

generatePrivacyPolicy();
