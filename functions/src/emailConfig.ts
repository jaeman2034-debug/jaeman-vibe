// ??YAGO VIBE ?대찓???ㅼ젙 諛??섍꼍蹂??愿由?import * as functions from "firebase-functions";
import nodemailer from "nodemailer";

// ??Gmail ?ㅼ젙 媛?대뱶
/*
1. Gmail 怨꾩젙 以鍮?   - admin@yagovibe.com (?먮뒗 ?ㅼ젣 愿由ъ옄 ?대찓??
   - 2?④퀎 ?몄쬆 ?쒖꽦???꾩슂

2. ??鍮꾨?踰덊샇 ?앹꽦
   - Google 怨꾩젙 ??蹂댁븞 ??2?④퀎 ?몄쬆 ????鍮꾨?踰덊샇
   - "硫붿씪" ?좏깮 ??16?먮━ ??鍮꾨?踰덊샇 ?앹꽦

3. Firebase Functions ?섍꼍蹂???ㅼ젙
   firebase functions:config:set gmail.user="admin@yagovibe.com"
   firebase functions:config:set gmail.pass="your-16-digit-app-password"

4. ?섍꼍蹂???뺤씤
   firebase functions:config:get
*/

// ???대찓??諛쒖넚湲??앹꽦 ?⑥닔
export const createEmailTransporter = () => {
  const gmailUser = functions.config().gmail?.user || "admin@yagovibe.com";
  const gmailPass = functions.config().gmail?.pass || "your-app-password";
  
  return nodemailer.createTransporter({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
  });
};

// ??湲곕낯 ?대찓???쒗뵆由?export const getEmailTemplate = (type: "weekly_report" | "error_alert" | "system_notification", data: any) => {
  const templates = {
    weekly_report: {
      subject: `?뱤 YAGO VIBE 二쇨컙 留덉폆 由ы룷??(${new Date().toLocaleDateString('ko-KR')})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1E3A8A; text-align: center;">??YAGO VIBE 二쇨컙 留덉폆 由ы룷??/h2>
          
          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #059669; margin-top: 0;">?뱢 ?듭떖 ?듦퀎</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="margin: 8px 0;">?벀 <strong>?꾩껜 ?곹뭹:</strong> ${data.total}媛?/li>
              <li style="margin: 8px 0;">?윟 <strong>?먮ℓ以?</strong> ${data.open}媛?/li>
              <li style="margin: 8px 0;">?윞 <strong>嫄곕옒以?</strong> ${data.reserved}媛?/li>
              <li style="margin: 8px 0;">??<strong>嫄곕옒?꾨즺:</strong> ${data.sold}媛?/li>
              <li style="margin: 8px 0;">?뮥 <strong>?됯퇏 媛寃?</strong> ${data.avgPrice.toLocaleString()}??/li>
              <li style="margin: 8px 0;">?쨼 <strong>?됯퇏 AI ?좊ː??</strong> ${data.avgAi}??/li>
              <li style="margin: 8px 0;">?뱤 <strong>嫄곕옒 ?꾨즺??</strong> ${data.completionRate}%</li>
            </ul>
          </div>
          
          <div style="background: #FEF3C7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #D97706; margin-top: 0;">?렞 二쇱슂 ?몄궗?댄듃</h4>
            <p>??嫄곕옒 ?꾨즺??${data.completionRate}%濡?${data.completionRate >= 70 ? '?곗닔?? : '?묓샇??} ?깃낵</p>
            <p>??AI ?좊ː??${data.avgAi}?먯쑝濡??곹뭹 ?덉쭏 ${data.avgAi >= 70 ? '留ㅼ슦 ?곗닔' : '?곗닔'}</p>
            <p>???쒖꽦 嫄곕옒 ${data.open + data.reserved}嫄?吏꾪뻾 以?/p>
          </div>
          
          <p style="text-align: center; color: #6B7280; font-size: 14px;">
            ?뱨 ?곸꽭 遺꾩꽍? 泥⑤???PDF ?뚯씪???뺤씤?섏꽭??<br>
            ?봽 留ㅼ＜ ?붿슂???ㅼ쟾 9???먮룞 諛쒖넚?⑸땲??
          </p>
        </div>
      `
    },
    
    error_alert: {
      subject: `?슚 YAGO VIBE ?쒖뒪???뚮┝ - ${data.errorType}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #DC2626; text-align: center;">?슚 YAGO VIBE ?쒖뒪???뚮┝</h2>
          
          <div style="background: #FEF2F2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #DC2626;">
            <h3 style="color: #DC2626; margin-top: 0;">?ㅻ쪟 ?뺣낫</h3>
            <p><strong>?ㅻ쪟 ?좏삎:</strong> ${data.errorType}</p>
            <p><strong>諛쒖깮 ?쒓컙:</strong> ${new Date().toLocaleString('ko-KR')}</p>
            <p><strong>?ㅻ쪟 硫붿떆吏:</strong> ${data.errorMessage}</p>
          </div>
          
          <p style="text-align: center; color: #6B7280; font-size: 14px;">
            ?뵩 愿由ъ옄 ?섏씠吏?먯꽌 ?쒖뒪???곹깭瑜??뺤씤?섏꽭??
          </p>
        </div>
      `
    },
    
    system_notification: {
      subject: `?뱼 YAGO VIBE ?쒖뒪???뚮┝ - ${data.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1E3A8A; text-align: center;">?뱼 YAGO VIBE ?쒖뒪???뚮┝</h2>
          
          <div style="background: #EFF6FF; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1E3A8A; margin-top: 0;">${data.title}</h3>
            <p>${data.message}</p>
            <p><strong>?뚮┝ ?쒓컙:</strong> ${new Date().toLocaleString('ko-KR')}</p>
          </div>
          
          <p style="text-align: center; color: #6B7280; font-size: 14px;">
            YAGO VIBE ?쒖뒪?쒖뿉???먮룞?쇰줈 諛쒖넚???뚮┝?낅땲??
          </p>
        </div>
      `
    }
  };
  
  return templates[type];
};

// ???대찓???꾩넚 ?ы띁 ?⑥닔
export const sendEmail = async (to: string, subject: string, html: string, attachments?: any[]) => {
  try {
    const transporter = createEmailTransporter();
    
    const mailOptions = {
      from: `"YAGO VIBE" <${functions.config().gmail?.user || "admin@yagovibe.com"}>`,
      to,
      subject,
      html,
      attachments: attachments || [],
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`???대찓???꾩넚 ?꾨즺: ${to}`);
    return { success: true };
    
  } catch (error) {
    console.error(`???대찓???꾩넚 ?ㅽ뙣: ${to}`, error);
    return { success: false, error: error.message };
  }
};

// ??愿由ъ옄 ?대찓??二쇱냼
export const ADMIN_EMAIL = "admin@yagovibe.com";

// ???섍꼍蹂??寃利??⑥닔
export const validateEmailConfig = () => {
  const gmailUser = functions.config().gmail?.user;
  const gmailPass = functions.config().gmail?.pass;
  
  if (!gmailUser || !gmailPass) {
    console.warn("?좑툘 Gmail ?섍꼍蹂?섍? ?ㅼ젙?섏? ?딆븯?듬땲??");
    console.warn("?ㅼ쓬 紐낅졊?대줈 ?ㅼ젙?섏꽭??");
    console.warn("firebase functions:config:set gmail.user=\"your-email@gmail.com\"");
    console.warn("firebase functions:config:set gmail.pass=\"your-app-password\"");
    return false;
  }
  
  console.log("??Gmail ?섍꼍蹂???ㅼ젙 ?꾨즺");
  return true;
};
