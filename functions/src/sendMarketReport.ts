// ??YAGO VIBE ?먮룞 留덉폆 由ы룷???앹꽦 + ?대찓???꾩넚
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { createEmailTransporter, getEmailTemplate, ADMIN_EMAIL, validateEmailConfig } from "./emailConfig";

// Firebase Admin 珥덇린??(?대? 珥덇린?붾릺???덈떎硫?臾댁떆)
if (!admin.apps.length) {
  admin.initializeApp();
}

// ??留ㅼ＜ ?붿슂???ㅼ쟾 9???먮룞 由ы룷???앹꽦 + ?대찓???꾩넚
export const sendWeeklyMarketReport = functions.pubsub
  .schedule("every monday 09:00")
  .timeZone("Asia/Seoul")
  .onRun(async (context) => {
    console.log("?? YAGO VIBE 二쇨컙 留덉폆 由ы룷???앹꽦 ?쒖옉");
    
    try {
      const db = admin.firestore();
      
      // Firestore?먯꽌 marketItems ?곗씠???섏쭛
      const snap = await db.collection("marketItems").get();
      const items = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.() || new Date(d.data().createdAt || Date.now()),
      }));
      
      console.log(`?뱤 珥?${items.length}媛??곹뭹 ?곗씠???섏쭛 ?꾨즺`);
      
      // ?듦퀎 怨꾩궛
      const total = items.length;
      const sold = items.filter((i) => i.status === "sold").length;
      const reserved = items.filter((i) => i.status === "reserved").length;
      const open = items.filter((i) => i.status === "open").length;
      
      const avgPrice = total > 0 
        ? Math.round(items.reduce((sum, i) => sum + (i.price || 0), 0) / total)
        : 0;
        
      const avgAi = total > 0
        ? Math.round(
            items.reduce((sum, i) => sum + (i.ai?.score || 0), 0) / total
          )
        : 0;
      
      const completionRate = total > 0 ? Math.round((sold / total) * 100) : 0;
      
      // ?붾퀎 ?듦퀎 怨꾩궛
      const monthly = {};
      items.forEach((i) => {
        const key = `${i.createdAt.getFullYear()}-${String(i.createdAt.getMonth() + 1).padStart(2, "0")}`;
        if (!monthly[key]) {
          monthly[key] = { 
            month: key, 
            sold: 0, 
            avgAi: 0, 
            count: 0,
            totalPrice: 0
          };
        }
        if (i.status === "sold") monthly[key].sold += 1;
        monthly[key].avgAi += i.ai?.score || 0;
        monthly[key].totalPrice += i.price || 0;
        monthly[key].count += 1;
      });
      
      const chartData = Object.values(monthly)
        .map((m) => ({
          month: m.month,
          嫄곕옒?꾨즺: m.sold,
          ?됯퇏AI: m.count ? Math.round(m.avgAi / m.count) : 0,
          ?됯퇏媛寃? m.count ? Math.round(m.totalPrice / m.count) : 0,
        }))
        .sort((a, b) => a.month.localeCompare(b.month));
      
      // PDF ?앹꽦
      console.log("?뱞 PDF 由ы룷???앹꽦 以?..");
      const doc = new jsPDF();
      
      // ?ㅻ뜑
      doc.setFontSize(20);
      doc.setTextColor(30, 64, 175);
      doc.text("??YAGO VIBE 二쇨컙 留덉폆 由ы룷??, 15, 20);
      
      // ?앹꽦 ?뺣낫
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`?뱟 ?앹꽦?? ${new Date().toLocaleString('ko-KR')}`, 15, 35);
      doc.text(`?뱤 由ы룷??ID: ${Date.now()}`, 15, 45);
      doc.text(`?봽 ?먮룞 ?앹꽦: 留ㅼ＜ ?붿슂???ㅼ쟾 9??, 15, 55);
      
      // ?듭떖 ?듦퀎
      doc.setFontSize(14);
      doc.setTextColor(16, 185, 129);
      doc.text("?뱢 二쇨컙 ?듭떖 ?듦퀎", 15, 75);
      
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(`?벀 ?꾩껜 ?곹뭹: ${total}媛?, 15, 90);
      doc.text(`?윟 ?먮ℓ以? ${open}媛?, 15, 100);
      doc.text(`?윞 嫄곕옒以? ${reserved}媛?, 15, 110);
      doc.text(`??嫄곕옒?꾨즺: ${sold}媛?, 15, 120);
      doc.text(`?뮥 ?됯퇏 媛寃? ${avgPrice.toLocaleString()}??, 15, 130);
      doc.text(`?쨼 ?됯퇏 AI ?좊ː?? ${avgAi}??, 15, 140);
      doc.text(`?뱤 嫄곕옒 ?꾨즺?? ${completionRate}%`, 15, 150);
      
      // ?붾퀎 ?곗씠???뚯씠釉?      if (chartData.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(139, 92, 246);
        doc.text("?뱟 ?붾퀎 嫄곕옒 遺꾩꽍", 15, 170);
        
        const tableData = chartData.map((c) => [
          c.month,
          c.嫄곕옒?꾨즺.toString(),
          c.?됯퇏AI.toString(),
          `${c.?됯퇏媛寃?toLocaleString()}??
        ]);
        
        doc.autoTable({
          head: [["??, "嫄곕옒?꾨즺", "?됯퇏AI", "?됯퇏媛寃?]],
          body: tableData,
          startY: 180,
          styles: {
            fontSize: 9,
            cellPadding: 3,
          },
          headStyles: {
            fillColor: [59, 130, 246],
            textColor: [255, 255, 255],
          },
          alternateRowStyles: {
            fillColor: [249, 250, 251],
          },
        });
      }
      
      // ?붿빟 硫붿떆吏
      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 200;
      doc.setFontSize(12);
      doc.setTextColor(16, 185, 129);
      doc.text("?렞 二쇨컙 遺꾩꽍 ?붿빟", 15, finalY);
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`???대쾲 二?嫄곕옒 ?꾨즺??${completionRate}%濡?${completionRate >= 70 ? '?곗닔?? : '?묓샇??} ?깃낵瑜?蹂댁??듬땲??`, 15, finalY + 10);
      doc.text(`???됯퇏 AI ?좊ː??${avgAi}?먯쑝濡??곹뭹 ?덉쭏??${avgAi >= 70 ? '留ㅼ슦 ?곗닔' : '?곗닔'}?⑸땲??`, 15, finalY + 20);
      doc.text(`???꾩옱 ?쒖꽦 嫄곕옒 ${open + reserved}嫄댁씠 吏꾪뻾 以묒엯?덈떎.`, 15, finalY + 30);
      doc.text(`???됯퇏 ?곹뭹 媛寃?${avgPrice.toLocaleString()}?먯쑝濡?${avgPrice >= 100000 ? '?꾨━誘몄뾼' : '?⑸━?곸씤'} 媛寃⑸??낅땲??`, 15, finalY + 40);
      
      // ?명꽣
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text("YAGO VIBE - 異뺢뎄 以묒떖 以묎퀬嫄곕옒 ?뚮옯??, 15, doc.internal.pageSize.height - 10);
      doc.text("Generated by YAGO VIBE Analytics System (Automated)", 15, doc.internal.pageSize.height - 5);
      
      // PDF瑜?Buffer濡?蹂??      const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
      console.log("??PDF ?앹꽦 ?꾨즺");
      
      // ?대찓???ㅼ젙 寃利?      if (!validateEmailConfig()) {
        console.warn("?좑툘 Gmail ?ㅼ젙???꾨즺?섏? ?딆븘 ?대찓?쇱쓣 嫄대꼫?곷땲??");
        return { success: true, message: "PDF???앹꽦?섏뿀?쇰굹 ?대찓???꾩넚???꾪빐 Gmail ?ㅼ젙???꾩슂?⑸땲??" };
      }
      
      // ?대찓??諛쒖넚湲??ㅼ젙
      const transporter = createEmailTransporter();
      
      // ?대찓???쒗뵆由?媛?몄삤湲?      const emailTemplate = getEmailTemplate("weekly_report", {
        total,
        sold,
        reserved,
        open,
        avgPrice,
        avgAi,
        completionRate,
      });
      
      // ?대찓???댁슜
      const mailOptions = {
        from: `"YAGO VIBE" <${functions.config().gmail?.user || ADMIN_EMAIL}>`,
        to: ADMIN_EMAIL,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        attachments: [
          { 
            filename: `YAGO_VIBE_Weekly_Report_${new Date().toISOString().split('T')[0]}.pdf`, 
            content: pdfBuffer, 
            contentType: "application/pdf" 
          },
        ],
      };
      
      // ?대찓???꾩넚
      console.log("?벁 ?대찓???꾩넚 以?..");
      await transporter.sendMail(mailOptions);
      console.log(`???대찓???꾩넚 ?꾨즺: ${ADMIN_EMAIL}`);
      
      // 由ы룷???꾩넚 湲곕줉??Firestore?????      await db.collection("reportHistory").add({
        type: "weekly_market_report",
        generatedAt: admin.firestore.FieldValue.serverTimestamp(),
        stats: {
          total,
          sold,
          reserved,
          open,
          avgPrice,
          avgAi,
          completionRate,
        },
        recipients: ["admin@yagovibe.com"],
        status: "sent",
        pdfGenerated: true,
      });
      
      console.log("??二쇨컙 留덉폆 由ы룷???앹꽦 諛??꾩넚 ?꾨즺");
      return { success: true, message: "二쇨컙 由ы룷?멸? ?깃났?곸쑝濡??꾩넚?섏뿀?듬땲??" };
      
    } catch (error) {
      console.error("??二쇨컙 由ы룷???앹꽦/?꾩넚 ?ㅽ뙣:", error);
      
      // ?먮윭 湲곕줉 ???      await admin.firestore().collection("reportHistory").add({
        type: "weekly_market_report",
        generatedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: "failed",
        error: error.message,
      });
      
      throw new functions.https.HttpsError("internal", "由ы룷???앹꽦 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.");
    }
  });

// ???섎룞 由ы룷???앹꽦 ?⑥닔 (愿由ъ옄媛 吏곸젒 ?몄텧 媛??
export const generateMarketReport = functions.https.onCall(async (data, context) => {
  // ?몄쬆 ?뺤씤
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "?몄쬆???꾩슂?⑸땲??");
  }
  
  // 愿由ъ옄 沅뚰븳 ?뺤씤 (媛쒕컻??- ?ㅼ젣 ?댁쁺???대찓??寃利?異붽?)
  console.log("?뵍 ?섎룞 由ы룷???앹꽦 ?붿껌:", context.auth.uid);
  
  try {
    const db = admin.firestore();
    const snap = await db.collection("marketItems").get();
    const items = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.() || new Date(d.data().createdAt || Date.now()),
    }));
    
    // ?듦퀎 怨꾩궛 (?꾩? ?숈씪??濡쒖쭅)
    const total = items.length;
    const sold = items.filter((i) => i.status === "sold").length;
    const reserved = items.filter((i) => i.status === "reserved").length;
    const open = items.filter((i) => i.status === "open").length;
    const avgPrice = total > 0 ? Math.round(items.reduce((sum, i) => sum + (i.price || 0), 0) / total) : 0;
    const avgAi = total > 0 ? Math.round(items.reduce((sum, i) => sum + (i.ai?.score || 0), 0) / total) : 0;
    const completionRate = total > 0 ? Math.round((sold / total) * 100) : 0;
    
    return {
      success: true,
      stats: {
        total,
        sold,
        reserved,
        open,
        avgPrice,
        avgAi,
        completionRate,
      },
      message: "由ы룷???듦퀎媛 ?깃났?곸쑝濡??앹꽦?섏뿀?듬땲??",
    };
    
  } catch (error) {
    console.error("???섎룞 由ы룷???앹꽦 ?ㅽ뙣:", error);
    throw new functions.https.HttpsError("internal", "由ы룷???앹꽦 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.");
  }
});
