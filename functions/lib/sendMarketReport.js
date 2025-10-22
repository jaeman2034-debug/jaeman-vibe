// ✅ YAGO VIBE 자동 마켓 리포트 생성 + 이메일 전송
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { createEmailTransporter, getEmailTemplate, ADMIN_EMAIL, validateEmailConfig } from "./emailConfig";
// Firebase Admin 초기화 (이미 초기화되어 있다면 무시)
if (!admin.apps.length) {
    admin.initializeApp();
}
// ✅ 매주 월요일 오전 9시 자동 리포트 생성 + 이메일 전송
export const sendWeeklyMarketReport = functions.pubsub
    .schedule("every monday 09:00")
    .timeZone("Asia/Seoul")
    .onRun(async (context) => {
    var _a;
    console.log("🚀 YAGO VIBE 주간 마켓 리포트 생성 시작");
    try {
        const db = admin.firestore();
        // Firestore에서 marketItems 데이터 수집
        const snap = await db.collection("marketItems").get();
        const items = snap.docs.map((d) => {
            var _a, _b;
            return ({
                id: d.id,
                ...d.data(),
                createdAt: ((_b = (_a = d.data().createdAt) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a)) || new Date(d.data().createdAt || Date.now()),
            });
        });
        console.log(`📊 총 ${items.length}개 상품 데이터 수집 완료`);
        // 통계 계산
        const total = items.length;
        const sold = items.filter((i) => i.status === "sold").length;
        const reserved = items.filter((i) => i.status === "reserved").length;
        const open = items.filter((i) => i.status === "open").length;
        const avgPrice = total > 0
            ? Math.round(items.reduce((sum, i) => sum + (i.price || 0), 0) / total)
            : 0;
        const avgAi = total > 0
            ? Math.round(items.reduce((sum, i) => { var _a; return sum + (((_a = i.ai) === null || _a === void 0 ? void 0 : _a.score) || 0); }, 0) / total)
            : 0;
        const completionRate = total > 0 ? Math.round((sold / total) * 100) : 0;
        // 월별 통계 계산
        const monthly = {};
        items.forEach((i) => {
            var _a;
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
            if (i.status === "sold")
                monthly[key].sold += 1;
            monthly[key].avgAi += ((_a = i.ai) === null || _a === void 0 ? void 0 : _a.score) || 0;
            monthly[key].totalPrice += i.price || 0;
            monthly[key].count += 1;
        });
        const chartData = Object.values(monthly)
            .map((m) => ({
            month: m.month,
            거래완료: m.sold,
            평균AI: m.count ? Math.round(m.avgAi / m.count) : 0,
            평균가격: m.count ? Math.round(m.totalPrice / m.count) : 0,
        }))
            .sort((a, b) => a.month.localeCompare(b.month));
        // PDF 생성
        console.log("📄 PDF 리포트 생성 중...");
        const doc = new jsPDF();
        // 헤더
        doc.setFontSize(20);
        doc.setTextColor(30, 64, 175);
        doc.text("⚽ YAGO VIBE 주간 마켓 리포트", 15, 20);
        // 생성 정보
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`📅 생성일: ${new Date().toLocaleString('ko-KR')}`, 15, 35);
        doc.text(`📊 리포트 ID: ${Date.now()}`, 15, 45);
        doc.text(`🔄 자동 생성: 매주 월요일 오전 9시`, 15, 55);
        // 핵심 통계
        doc.setFontSize(14);
        doc.setTextColor(16, 185, 129);
        doc.text("📈 주간 핵심 통계", 15, 75);
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(`📦 전체 상품: ${total}개`, 15, 90);
        doc.text(`🟢 판매중: ${open}개`, 15, 100);
        doc.text(`🟡 거래중: ${reserved}개`, 15, 110);
        doc.text(`⚫ 거래완료: ${sold}개`, 15, 120);
        doc.text(`💰 평균 가격: ${avgPrice.toLocaleString()}원`, 15, 130);
        doc.text(`🤖 평균 AI 신뢰도: ${avgAi}점`, 15, 140);
        doc.text(`📊 거래 완료율: ${completionRate}%`, 15, 150);
        // 월별 데이터 테이블
        if (chartData.length > 0) {
            doc.setFontSize(14);
            doc.setTextColor(139, 92, 246);
            doc.text("📅 월별 거래 분석", 15, 170);
            const tableData = chartData.map((c) => [
                c.month,
                c.거래완료.toString(),
                c.평균AI.toString(),
                `${c.평균가격.toLocaleString()}원`
            ]);
            doc.autoTable({
                head: [["월", "거래완료", "평균AI", "평균가격"]],
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
        // 요약 메시지
        const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 200;
        doc.setFontSize(12);
        doc.setTextColor(16, 185, 129);
        doc.text("🎯 주간 분석 요약", 15, finalY);
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`• 이번 주 거래 완료율 ${completionRate}%로 ${completionRate >= 70 ? '우수한' : '양호한'} 성과를 보였습니다.`, 15, finalY + 10);
        doc.text(`• 평균 AI 신뢰도 ${avgAi}점으로 상품 품질이 ${avgAi >= 70 ? '매우 우수' : '우수'}합니다.`, 15, finalY + 20);
        doc.text(`• 현재 활성 거래 ${open + reserved}건이 진행 중입니다.`, 15, finalY + 30);
        doc.text(`• 평균 상품 가격 ${avgPrice.toLocaleString()}원으로 ${avgPrice >= 100000 ? '프리미엄' : '합리적인'} 가격대입니다.`, 15, finalY + 40);
        // 푸터
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text("YAGO VIBE - 축구 중심 중고거래 플랫폼", 15, doc.internal.pageSize.height - 10);
        doc.text("Generated by YAGO VIBE Analytics System (Automated)", 15, doc.internal.pageSize.height - 5);
        // PDF를 Buffer로 변환
        const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
        console.log("✅ PDF 생성 완료");
        // 이메일 설정 검증
        if (!validateEmailConfig()) {
            console.warn("⚠️ Gmail 설정이 완료되지 않아 이메일을 건너뜁니다.");
            return { success: true, message: "PDF는 생성되었으나 이메일 전송을 위해 Gmail 설정이 필요합니다." };
        }
        // 이메일 발송기 설정
        const transporter = createEmailTransporter();
        // 이메일 템플릿 가져오기
        const emailTemplate = getEmailTemplate("weekly_report", {
            total,
            sold,
            reserved,
            open,
            avgPrice,
            avgAi,
            completionRate,
        });
        // 이메일 내용
        const mailOptions = {
            from: `"YAGO VIBE" <${((_a = functions.config().gmail) === null || _a === void 0 ? void 0 : _a.user) || ADMIN_EMAIL}>`,
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
        // 이메일 전송
        console.log("📧 이메일 전송 중...");
        await transporter.sendMail(mailOptions);
        console.log(`✅ 이메일 전송 완료: ${ADMIN_EMAIL}`);
        // 리포트 전송 기록을 Firestore에 저장
        await db.collection("reportHistory").add({
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
        console.log("✅ 주간 마켓 리포트 생성 및 전송 완료");
        return { success: true, message: "주간 리포트가 성공적으로 전송되었습니다." };
    }
    catch (error) {
        console.error("❌ 주간 리포트 생성/전송 실패:", error);
        // 에러 기록 저장
        await admin.firestore().collection("reportHistory").add({
            type: "weekly_market_report",
            generatedAt: admin.firestore.FieldValue.serverTimestamp(),
            status: "failed",
            error: error.message,
        });
        throw new functions.https.HttpsError("internal", "리포트 생성 중 오류가 발생했습니다.");
    }
});
// ✅ 수동 리포트 생성 함수 (관리자가 직접 호출 가능)
export const generateMarketReport = functions.https.onCall(async (data, context) => {
    // 인증 확인
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "인증이 필요합니다.");
    }
    // 관리자 권한 확인 (개발용 - 실제 운영시 이메일 검증 추가)
    console.log("🔐 수동 리포트 생성 요청:", context.auth.uid);
    try {
        const db = admin.firestore();
        const snap = await db.collection("marketItems").get();
        const items = snap.docs.map((d) => {
            var _a, _b;
            return ({
                id: d.id,
                ...d.data(),
                createdAt: ((_b = (_a = d.data().createdAt) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a)) || new Date(d.data().createdAt || Date.now()),
            });
        });
        // 통계 계산 (위와 동일한 로직)
        const total = items.length;
        const sold = items.filter((i) => i.status === "sold").length;
        const reserved = items.filter((i) => i.status === "reserved").length;
        const open = items.filter((i) => i.status === "open").length;
        const avgPrice = total > 0 ? Math.round(items.reduce((sum, i) => sum + (i.price || 0), 0) / total) : 0;
        const avgAi = total > 0 ? Math.round(items.reduce((sum, i) => { var _a; return sum + (((_a = i.ai) === null || _a === void 0 ? void 0 : _a.score) || 0); }, 0) / total) : 0;
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
            message: "리포트 통계가 성공적으로 생성되었습니다.",
        };
    }
    catch (error) {
        console.error("❌ 수동 리포트 생성 실패:", error);
        throw new functions.https.HttpsError("internal", "리포트 생성 중 오류가 발생했습니다.");
    }
});
//# sourceMappingURL=sendMarketReport.js.map