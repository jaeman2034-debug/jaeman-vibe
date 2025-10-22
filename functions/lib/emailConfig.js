// ✅ YAGO VIBE 이메일 설정 및 환경변수 관리
import * as functions from "firebase-functions";
import nodemailer from "nodemailer";
// ✅ Gmail 설정 가이드
/*
1. Gmail 계정 준비
   - admin@yagovibe.com (또는 실제 관리자 이메일)
   - 2단계 인증 활성화 필요

2. 앱 비밀번호 생성
   - Google 계정 → 보안 → 2단계 인증 → 앱 비밀번호
   - "메일" 선택 → 16자리 앱 비밀번호 생성

3. Firebase Functions 환경변수 설정
   firebase functions:config:set gmail.user="admin@yagovibe.com"
   firebase functions:config:set gmail.pass="your-16-digit-app-password"

4. 환경변수 확인
   firebase functions:config:get
*/
// ✅ 이메일 발송기 생성 함수
export const createEmailTransporter = () => {
    var _a, _b;
    const gmailUser = ((_a = functions.config().gmail) === null || _a === void 0 ? void 0 : _a.user) || "admin@yagovibe.com";
    const gmailPass = ((_b = functions.config().gmail) === null || _b === void 0 ? void 0 : _b.pass) || "your-app-password";
    return nodemailer.createTransporter({
        service: "gmail",
        auth: {
            user: gmailUser,
            pass: gmailPass,
        },
    });
};
// ✅ 기본 이메일 템플릿
export const getEmailTemplate = (type, data) => {
    const templates = {
        weekly_report: {
            subject: `📊 YAGO VIBE 주간 마켓 리포트 (${new Date().toLocaleDateString('ko-KR')})`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1E3A8A; text-align: center;">⚽ YAGO VIBE 주간 마켓 리포트</h2>
          
          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #059669; margin-top: 0;">📈 핵심 통계</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="margin: 8px 0;">📦 <strong>전체 상품:</strong> ${data.total}개</li>
              <li style="margin: 8px 0;">🟢 <strong>판매중:</strong> ${data.open}개</li>
              <li style="margin: 8px 0;">🟡 <strong>거래중:</strong> ${data.reserved}개</li>
              <li style="margin: 8px 0;">⚫ <strong>거래완료:</strong> ${data.sold}개</li>
              <li style="margin: 8px 0;">💰 <strong>평균 가격:</strong> ${data.avgPrice.toLocaleString()}원</li>
              <li style="margin: 8px 0;">🤖 <strong>평균 AI 신뢰도:</strong> ${data.avgAi}점</li>
              <li style="margin: 8px 0;">📊 <strong>거래 완료율:</strong> ${data.completionRate}%</li>
            </ul>
          </div>
          
          <div style="background: #FEF3C7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #D97706; margin-top: 0;">🎯 주요 인사이트</h4>
            <p>• 거래 완료율 ${data.completionRate}%로 ${data.completionRate >= 70 ? '우수한' : '양호한'} 성과</p>
            <p>• AI 신뢰도 ${data.avgAi}점으로 상품 품질 ${data.avgAi >= 70 ? '매우 우수' : '우수'}</p>
            <p>• 활성 거래 ${data.open + data.reserved}건 진행 중</p>
          </div>
          
          <p style="text-align: center; color: #6B7280; font-size: 14px;">
            📎 상세 분석은 첨부된 PDF 파일을 확인하세요.<br>
            🔄 매주 월요일 오전 9시 자동 발송됩니다.
          </p>
        </div>
      `
        },
        error_alert: {
            subject: `🚨 YAGO VIBE 시스템 알림 - ${data.errorType}`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #DC2626; text-align: center;">🚨 YAGO VIBE 시스템 알림</h2>
          
          <div style="background: #FEF2F2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #DC2626;">
            <h3 style="color: #DC2626; margin-top: 0;">오류 정보</h3>
            <p><strong>오류 유형:</strong> ${data.errorType}</p>
            <p><strong>발생 시간:</strong> ${new Date().toLocaleString('ko-KR')}</p>
            <p><strong>오류 메시지:</strong> ${data.errorMessage}</p>
          </div>
          
          <p style="text-align: center; color: #6B7280; font-size: 14px;">
            🔧 관리자 페이지에서 시스템 상태를 확인하세요.
          </p>
        </div>
      `
        },
        system_notification: {
            subject: `📢 YAGO VIBE 시스템 알림 - ${data.title}`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1E3A8A; text-align: center;">📢 YAGO VIBE 시스템 알림</h2>
          
          <div style="background: #EFF6FF; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1E3A8A; margin-top: 0;">${data.title}</h3>
            <p>${data.message}</p>
            <p><strong>알림 시간:</strong> ${new Date().toLocaleString('ko-KR')}</p>
          </div>
          
          <p style="text-align: center; color: #6B7280; font-size: 14px;">
            YAGO VIBE 시스템에서 자동으로 발송된 알림입니다.
          </p>
        </div>
      `
        }
    };
    return templates[type];
};
// ✅ 이메일 전송 헬퍼 함수
export const sendEmail = async (to, subject, html, attachments) => {
    var _a;
    try {
        const transporter = createEmailTransporter();
        const mailOptions = {
            from: `"YAGO VIBE" <${((_a = functions.config().gmail) === null || _a === void 0 ? void 0 : _a.user) || "admin@yagovibe.com"}>`,
            to,
            subject,
            html,
            attachments: attachments || [],
        };
        await transporter.sendMail(mailOptions);
        console.log(`✅ 이메일 전송 완료: ${to}`);
        return { success: true };
    }
    catch (error) {
        console.error(`❌ 이메일 전송 실패: ${to}`, error);
        return { success: false, error: error.message };
    }
};
// ✅ 관리자 이메일 주소
export const ADMIN_EMAIL = "admin@yagovibe.com";
// ✅ 환경변수 검증 함수
export const validateEmailConfig = () => {
    var _a, _b;
    const gmailUser = (_a = functions.config().gmail) === null || _a === void 0 ? void 0 : _a.user;
    const gmailPass = (_b = functions.config().gmail) === null || _b === void 0 ? void 0 : _b.pass;
    if (!gmailUser || !gmailPass) {
        console.warn("⚠️ Gmail 환경변수가 설정되지 않았습니다.");
        console.warn("다음 명령어로 설정하세요:");
        console.warn("firebase functions:config:set gmail.user=\"your-email@gmail.com\"");
        console.warn("firebase functions:config:set gmail.pass=\"your-app-password\"");
        return false;
    }
    console.log("✅ Gmail 환경변수 설정 완료");
    return true;
};
//# sourceMappingURL=emailConfig.js.map