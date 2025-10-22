import * as functions from "firebase-functions";
import fetch from "node-fetch";
/**
 * 음성 세션 생성 시 n8n 알림
 */
export const onVoiceSessionCreate = functions
    .region("asia-northeast3")
    .firestore.document("voiceSessions/{sessionId}")
    .onCreate(async (snap, context) => {
    var _a;
    const data = snap.data();
    const sessionId = context.params.sessionId;
    console.log("🎙️ 새로운 음성 세션 생성:", sessionId);
    // n8n 웹훅 호출 (선택사항)
    const n8nWebhook = (_a = functions.config().n8n) === null || _a === void 0 ? void 0 : _a.webhook;
    if (n8nWebhook) {
        try {
            await fetch(n8nWebhook, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "voice_session_created",
                    sessionId,
                    createdBy: data.createdBy,
                    createdAt: data.createdAt,
                    userAgent: data.ua,
                    device: data.device,
                    message: `🎙️ 새로운 음성 세션 생성됨: ${sessionId}`
                })
            });
            console.log("✅ n8n 알림 전송 완료");
        }
        catch (error) {
            console.error("❌ n8n 알림 전송 실패:", error);
        }
    }
    return null;
});
/**
 * NLU 수정 데이터 생성 시 학습 업데이트
 */
export const onNLUCorrectionCreate = functions
    .region("asia-northeast3")
    .firestore.document("nluCorrections/{correctionId}")
    .onCreate(async (snap, context) => {
    var _a;
    const data = snap.data();
    const correctionId = context.params.correctionId;
    console.log("🧠 NLU 수정 데이터 생성:", correctionId);
    // NLU 사전 업데이트
    const db = functions.admin.firestore();
    const dictionaryRef = db.collection("nluDictionary").doc(data.inputText);
    await dictionaryRef.set({
        correctedTags: data.correctedTags,
        lastUpdated: functions.admin.firestore.FieldValue.serverTimestamp(),
        correctionId,
        createdBy: data.createdBy
    }, { merge: true });
    console.log("✅ NLU 사전 업데이트 완료:", data.inputText);
    // n8n 알림 (선택사항)
    const n8nWebhook = (_a = functions.config().n8n) === null || _a === void 0 ? void 0 : _a.webhook;
    if (n8nWebhook) {
        try {
            await fetch(n8nWebhook, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "nlu_correction",
                    correctionId,
                    inputText: data.inputText,
                    correctedTags: data.correctedTags,
                    message: `🧠 NLU 학습 데이터 추가: "${data.inputText}" → [${data.correctedTags.join(", ")}]`
                })
            });
        }
        catch (error) {
            console.error("❌ n8n 알림 전송 실패:", error);
        }
    }
    return null;
});
/**
 * 오류 로그 생성 시 알림
 */
export const onErrorLogCreate = functions
    .region("asia-northeast3")
    .firestore.document("errors/{errorId}")
    .onCreate(async (snap, context) => {
    var _a;
    const data = snap.data();
    const errorId = context.params.errorId;
    console.log("❌ 오류 로그 생성:", errorId);
    // n8n 알림 (선택사항)
    const n8nWebhook = (_a = functions.config().n8n) === null || _a === void 0 ? void 0 : _a.webhook;
    if (n8nWebhook) {
        try {
            await fetch(n8nWebhook, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "error_log",
                    errorId,
                    error: data.error,
                    stack: data.stack,
                    userId: data.userId,
                    sessionId: data.sessionId,
                    message: `❌ 오류 발생: ${data.error}`
                })
            });
        }
        catch (error) {
            console.error("❌ n8n 알림 전송 실패:", error);
        }
    }
    return null;
});
//# sourceMappingURL=notifySession.js.map