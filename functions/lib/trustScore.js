/**
 * 🧠 YAGO VIBE 판매자 신뢰도 자동 평가 시스템
 *
 * 거래 완료 시 자동으로 판매자의 신뢰도를 계산하여 업데이트합니다.
 * 신뢰도 = (평균 평점 × 20) + (거래 횟수 × 2) + (찜 영향력)
 */
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
const db = admin.firestore();
/**
 * 거래 완료 시 판매자 신뢰도 자동 갱신
 * marketItems의 status가 "completed"로 변경되면 트리거
 */
export const updateTrustScore = functions.firestore
    .document("marketItems/{itemId}")
    .onUpdate(async (change, context) => {
    try {
        const before = change.before.data();
        const after = change.after.data();
        const { itemId } = context.params;
        // 거래가 완료로 바뀐 경우만 작동
        if (before.status !== "completed" && after.status === "completed") {
            const sellerId = after.sellerUid || after.sellerId;
            if (!sellerId) {
                console.warn("⚠️ sellerId가 없습니다:", itemId);
                return null;
            }
            console.log(`📊 [${sellerId}] 신뢰도 갱신 시작`);
            const sellerRef = db.collection("users").doc(sellerId);
            const sellerSnap = await sellerRef.get();
            const sellerData = sellerSnap.exists() ? sellerSnap.data() : {};
            // 거래 통계 계산
            const totalSales = (sellerData.totalSales || 0) + 1;
            const completedTransactions = (sellerData.completedTransactions || 0) + 1;
            const avgRating = sellerData.avgRating || 4.5; // 기본 평점
            // 찜 영향력 (최대 30점)
            const likesImpact = Math.min(after.likeCount || 0, 30);
            // 신뢰도 계산 (0-100점)
            // = (평균 평점 × 20) + (거래 횟수 × 2) + (찜 개수, 최대 30)
            const trustScore = Math.min(Math.round(avgRating * 20 + totalSales * 2 + likesImpact), 100);
            // 판매자 정보 업데이트
            await sellerRef.set({
                totalSales,
                completedTransactions,
                avgRating,
                trustScore,
                lastActive: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
            console.log(`✅ [${sellerId}] 신뢰도 갱신 완료:`);
            console.log(`   - 총 거래: ${totalSales}건`);
            console.log(`   - 평균 평점: ${avgRating}`);
            console.log(`   - 신뢰도: ${trustScore}점`);
            return { success: true, sellerId, trustScore };
        }
        return null;
    }
    catch (error) {
        console.error("❌ 신뢰도 갱신 실패:", error);
        return null;
    }
});
/**
 * 판매자 신뢰도 조회 (클라이언트에서 호출)
 */
export const getSellerTrustScore = functions.https.onCall(async (data, context) => {
    try {
        const { sellerId } = data;
        if (!sellerId) {
            throw new functions.https.HttpsError("invalid-argument", "sellerId가 필요합니다.");
        }
        const sellerRef = db.collection("users").doc(sellerId);
        const sellerSnap = await sellerRef.get();
        if (!sellerSnap.exists()) {
            return {
                success: false,
                message: "판매자 정보를 찾을 수 없습니다.",
                defaultData: {
                    trustScore: 50,
                    totalSales: 0,
                    avgRating: 0,
                    completedTransactions: 0,
                },
            };
        }
        const sellerData = sellerSnap.data();
        return {
            success: true,
            sellerId,
            trustScore: sellerData.trustScore || 50,
            totalSales: sellerData.totalSales || 0,
            avgRating: sellerData.avgRating || 0,
            completedTransactions: sellerData.completedTransactions || 0,
            lastActive: sellerData.lastActive,
        };
    }
    catch (error) {
        console.error("❌ 판매자 신뢰도 조회 실패:", error);
        throw error;
    }
});
/**
 * 상위 신뢰도 판매자 조회 (관리자용)
 */
export const getTopSellers = functions.https.onCall(async (data, context) => {
    try {
        const { limit = 10 } = data;
        const sellersSnap = await db
            .collection("users")
            .where("trustScore", ">", 0)
            .orderBy("trustScore", "desc")
            .limit(limit)
            .get();
        const topSellers = sellersSnap.docs.map((doc) => ({
            sellerId: doc.id,
            ...doc.data(),
        }));
        return {
            success: true,
            topSellers,
            count: topSellers.length,
        };
    }
    catch (error) {
        console.error("❌ 상위 판매자 조회 실패:", error);
        throw error;
    }
});
//# sourceMappingURL=trustScore.js.map