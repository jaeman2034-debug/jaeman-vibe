import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import fetch from "node-fetch";
import jsPDF from "jspdf";

// ??Firebase Admin 珥덇린??(以묐났 諛⑹?)
if (!admin.apps.length) {
  admin.initializeApp();
}

const storage = admin.storage();

/**
 * 留ㅼ＜ ?붿슂???ㅼ쟾 09:00 (KST)???먮룞?쇰줈 IR 由ы룷???앹꽦
 * - AI ?붿빟 ?앹꽦
 * - PDF ?앹꽦 諛?Firebase Storage ?낅줈?? * - n8n Webhook?쇰줈 ?대찓??諛쒖넚
 * - Slack ?뚮┝
 */
export const scheduledIRReport = functions
  .region("asia-northeast3")
  .pubsub.schedule("0 9 * * 1") // ??留ㅼ＜ ?붿슂???ㅼ쟾 09:00
  .timeZone("Asia/Seoul")
  .onRun(async (context) => {
    console.log("?? [AUTO REPORT] Weekly IR Report generation started...");

    try {
      // 1截뤴깵 Mock Data (?ㅼ젣濡쒕뒗 Firestore?먯꽌 ?곗씠??媛?몄삤湲?
      const metrics = {
        sales: [120, 140, 160, 180, 220, 210, 240],
        signups: [12, 16, 14, 22, 19, 25, 28],
        activities: [310, 400, 380, 420, 450, 470, 520],
        topCategories: ["異뺢뎄", "?띻뎄", "怨⑦봽", "?쇨뎄", "?뚮땲??],
      };

      console.log("?뱤 [AUTO REPORT] Metrics collected:", metrics);

      // 2截뤴깵 AI ?붿빟 ?앹꽦
      const prompt = `
?뱀떊? ?ъ옄?먯슜 IR 遺꾩꽍媛?낅땲??
?꾨옒 YAGO VIBE ?뚮옯?쇱쓽 二쇨컙 ?곗씠?곕? 湲곕컲?쇰줈 ?꾨Ц?곸씤 IR ?붿빟???묒꽦?섏꽭??

?곗씠??
- 留ㅼ텧 異붿씠 (7??: ${metrics.sales.join(", ")}
- ?좉퇋 ?뚯썝 (7??: ${metrics.signups.join(", ")}
- ?쒕룞 ??(7??: ${metrics.activities.join(", ")}
- ?멸린 移댄뀒怨좊━: ${metrics.topCategories.join(", ")}

?ы븿 ?댁슜:
1. 二쇨컙 ?깃낵 ?붿빟
2. ?몃젋??遺꾩꽍
3. ?ν썑 ?꾨쭩
4. ?ъ옄 ?ъ씤??
媛꾧껐?섍퀬 ?꾨Ц?곸쑝濡??묒꽦?댁＜?몄슂.
`;

      const openaiApiKey = functions.config().openai?.key || process.env.VITE_OPENAI_API_KEY;
      
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
      const summary = aiData.choices?.[0]?.message?.content || "AI ?붿빟 ?앹꽦 ?ㅽ뙣";

      console.log("?쭬 [AUTO REPORT] AI Summary generated");

      // 3截뤴깵 PDF ?앹꽦
      const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();

      // PDF ?쒕ぉ
      pdf.setFontSize(18);
      pdf.text("YAGO VIBE Weekly IR Report", 40, 50);

      // ?좎쭨
      pdf.setFontSize(11);
      const reportDate = new Date().toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      pdf.text(reportDate, 40, 70);

      // AI ?붿빟
      pdf.setFontSize(12);
      pdf.text("?뱤 AI Summary:", 40, 100);
      pdf.setFontSize(10);
      const splitText = pdf.splitTextToSize(summary, pageWidth - 80);
      pdf.text(splitText, 40, 120);

      // 二쇱슂 吏??      const metricsY = 120 + (splitText.length * 12) + 30;
      pdf.setFontSize(12);
      pdf.text("?뱢 Key Metrics:", 40, metricsY);
      pdf.setFontSize(10);
      pdf.text(`珥?留ㅼ텧: ${metrics.sales.reduce((a, b) => a + b, 0).toLocaleString()}??, 40, metricsY + 20);
      pdf.text(`?좉퇋 ?뚯썝: ${metrics.signups.reduce((a, b) => a + b, 0)}紐?, 40, metricsY + 35);
      pdf.text(`珥??쒕룞: ${metrics.activities.reduce((a, b) => a + b, 0).toLocaleString()}嫄?, 40, metricsY + 50);

      const pdfBuffer = Buffer.from(pdf.output("arraybuffer"));

      console.log("?뱞 [AUTO REPORT] PDF generated");

      // 4截뤴깵 Firebase Storage ?낅줈??      const bucket = storage.bucket();
      const filename = `weekly_reports/IR_${Date.now()}.pdf`;
      const file = bucket.file(filename);

      await file.save(pdfBuffer, {
        metadata: {
          contentType: "application/pdf",
        },
      });

      // Public URL ?앹꽦
      await file.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

      console.log("?곻툘 [AUTO REPORT] Uploaded to:", publicUrl);

      // 5截뤴깵 n8n Webhook?쇰줈 ?대찓??諛쒖넚
      const n8nWebhook = functions.config().n8n?.ir_webhook || process.env.VITE_N8N_IR_WEBHOOK;
      const investorEmails = functions.config().email?.investors || process.env.VITE_INVESTOR_EMAILS;

      if (n8nWebhook) {
        await fetch(n8nWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject: `[YAGO VIBE] Weekly IR Report - ${reportDate}`,
            summary,
            reportUrl: publicUrl,
            to: investorEmails?.split(",") || [],
          }),
        });
        console.log("?벁 [AUTO REPORT] Email sent via n8n");
      }

      // 6截뤴깵 Slack ?뚮┝
      const slackWebhook = functions.config().slack?.webhook || process.env.VITE_SLACK_WEBHOOK_URL;

      if (slackWebhook) {
        await fetch(slackWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: `?뱤 *YAGO VIBE Weekly IR Report Generated!*\n\n*Date:* ${reportDate}\n\n*Summary:*\n${summary.substring(0, 200)}...\n\n?뵕 <${publicUrl}|View Full Report>`,
          }),
        });
        console.log("?뮠 [AUTO REPORT] Slack notification sent");
      }

      console.log("??[AUTO REPORT] Weekly IR Report completed successfully!");
      return { success: true, reportUrl: publicUrl };
    } catch (error) {
      console.error("??[AUTO REPORT] Error:", error);
      throw error;
    }
  });

