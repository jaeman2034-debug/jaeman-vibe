import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import fetch from "node-fetch";
import jsPDF from "jspdf";
// ✅ Firebase Admin 초기화 (중복 방지)
if (!admin.apps.length) {
    admin.initializeApp();
}
const storage = admin.storage();
/**
 * 매주 월요일 오전 09:00 (KST)에 자동으로 IR 리포트 생성
 * - AI 요약 생성
 * - PDF 생성 및 Firebase Storage 업로드
 * - n8n Webhook으로 이메일 발송
 * - Slack 알림
 */
export const scheduledIRReport = functions
    .region("asia-northeast3")
    .pubsub.schedule("0 9 * * 1") // ✅ 매주 월요일 오전 09:00
    .timeZone("Asia/Seoul")
    .onRun(async (context) => {
    var _a, _b, _c, _d, _e, _f, _g;
    console.log("🚀 [AUTO REPORT] Weekly IR Report generation started...");
    try {
        // 1️⃣ Mock Data (실제로는 Firestore에서 데이터 가져오기)
        const metrics = {
            sales: [120, 140, 160, 180, 220, 210, 240],
            signups: [12, 16, 14, 22, 19, 25, 28],
            activities: [310, 400, 380, 420, 450, 470, 520],
            topCategories: ["축구", "농구", "골프", "야구", "테니스"],
        };
        console.log("📊 [AUTO REPORT] Metrics collected:", metrics);
        // 2️⃣ AI 요약 생성
        const prompt = `
당신은 투자자용 IR 분석가입니다.
아래 YAGO VIBE 플랫폼의 주간 데이터를 기반으로 전문적인 IR 요약을 작성하세요.

데이터:
- 매출 추이 (7일): ${metrics.sales.join(", ")}
- 신규 회원 (7일): ${metrics.signups.join(", ")}
- 활동 수 (7일): ${metrics.activities.join(", ")}
- 인기 카테고리: ${metrics.topCategories.join(", ")}

포함 내용:
1. 주간 성과 요약
2. 트렌드 분석
3. 향후 전망
4. 투자 포인트

간결하고 전문적으로 작성해주세요.
`;
        const openaiApiKey = ((_a = functions.config().openai) === null || _a === void 0 ? void 0 : _a.key) || process.env.VITE_OPENAI_API_KEY;
        if (!openaiApiKey) {
            throw new Error("OpenAI API Key not configured");
        }
        const aiResp = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${openaiApiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                max_tokens: 1000,
            }),
        });
        const aiData = await aiResp.json();
        const summary = ((_d = (_c = (_b = aiData.choices) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.message) === null || _d === void 0 ? void 0 : _d.content) || "AI 요약 생성 실패";
        console.log("🧠 [AUTO REPORT] AI Summary generated");
        // 3️⃣ PDF 생성
        const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
        const pageWidth = pdf.internal.pageSize.getWidth();
        // PDF 제목
        pdf.setFontSize(18);
        pdf.text("YAGO VIBE Weekly IR Report", 40, 50);
        // 날짜
        pdf.setFontSize(11);
        const reportDate = new Date().toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
        pdf.text(reportDate, 40, 70);
        // AI 요약
        pdf.setFontSize(12);
        pdf.text("📊 AI Summary:", 40, 100);
        pdf.setFontSize(10);
        const splitText = pdf.splitTextToSize(summary, pageWidth - 80);
        pdf.text(splitText, 40, 120);
        // 주요 지표
        const metricsY = 120 + (splitText.length * 12) + 30;
        pdf.setFontSize(12);
        pdf.text("📈 Key Metrics:", 40, metricsY);
        pdf.setFontSize(10);
        pdf.text(`총 매출: ${metrics.sales.reduce((a, b) => a + b, 0).toLocaleString()}원`, 40, metricsY + 20);
        pdf.text(`신규 회원: ${metrics.signups.reduce((a, b) => a + b, 0)}명`, 40, metricsY + 35);
        pdf.text(`총 활동: ${metrics.activities.reduce((a, b) => a + b, 0).toLocaleString()}건`, 40, metricsY + 50);
        const pdfBuffer = Buffer.from(pdf.output("arraybuffer"));
        console.log("📄 [AUTO REPORT] PDF generated");
        // 4️⃣ Firebase Storage 업로드
        const bucket = storage.bucket();
        const filename = `weekly_reports/IR_${Date.now()}.pdf`;
        const file = bucket.file(filename);
        await file.save(pdfBuffer, {
            metadata: {
                contentType: "application/pdf",
            },
        });
        // Public URL 생성
        await file.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
        console.log("☁️ [AUTO REPORT] Uploaded to:", publicUrl);
        // 5️⃣ n8n Webhook으로 이메일 발송
        const n8nWebhook = ((_e = functions.config().n8n) === null || _e === void 0 ? void 0 : _e.ir_webhook) || process.env.VITE_N8N_IR_WEBHOOK;
        const investorEmails = ((_f = functions.config().email) === null || _f === void 0 ? void 0 : _f.investors) || process.env.VITE_INVESTOR_EMAILS;
        if (n8nWebhook) {
            await fetch(n8nWebhook, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subject: `[YAGO VIBE] Weekly IR Report - ${reportDate}`,
                    summary,
                    reportUrl: publicUrl,
                    to: (investorEmails === null || investorEmails === void 0 ? void 0 : investorEmails.split(",")) || [],
                }),
            });
            console.log("📧 [AUTO REPORT] Email sent via n8n");
        }
        // 6️⃣ Slack 알림
        const slackWebhook = ((_g = functions.config().slack) === null || _g === void 0 ? void 0 : _g.webhook) || process.env.VITE_SLACK_WEBHOOK_URL;
        if (slackWebhook) {
            await fetch(slackWebhook, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: `📊 *YAGO VIBE Weekly IR Report Generated!*\n\n*Date:* ${reportDate}\n\n*Summary:*\n${summary.substring(0, 200)}...\n\n🔗 <${publicUrl}|View Full Report>`,
                }),
            });
            console.log("💬 [AUTO REPORT] Slack notification sent");
        }
        console.log("✅ [AUTO REPORT] Weekly IR Report completed successfully!");
        return { success: true, reportUrl: publicUrl };
    }
    catch (error) {
        console.error("❌ [AUTO REPORT] Error:", error);
        throw error;
    }
});
//# sourceMappingURL=autoReport.js.map