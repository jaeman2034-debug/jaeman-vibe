import * as functions from "firebase-functions";
import fetch from "node-fetch";

/**
 * ?뚯꽦 ?몄뀡 ?앹꽦 ??n8n ?뚮┝
 */
export const onVoiceSessionCreate = functions
  .region("asia-northeast3")
  .firestore.document("voiceSessions/{sessionId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const sessionId = context.params.sessionId;
    
    console.log("?럺截??덈줈???뚯꽦 ?몄뀡 ?앹꽦:", sessionId);
    
    // n8n ?뱁썒 ?몄텧 (?좏깮?ы빆)
    const n8nWebhook = functions.config().n8n?.webhook;
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
            message: `?럺截??덈줈???뚯꽦 ?몄뀡 ?앹꽦?? ${sessionId}`
          })
        });
        console.log("??n8n ?뚮┝ ?꾩넚 ?꾨즺");
      } catch (error) {
        console.error("??n8n ?뚮┝ ?꾩넚 ?ㅽ뙣:", error);
      }
    }
    
    return null;
  });

/**
 * NLU ?섏젙 ?곗씠???앹꽦 ???숈뒿 ?낅뜲?댄듃
 */
export const onNLUCorrectionCreate = functions
  .region("asia-northeast3")
  .firestore.document("nluCorrections/{correctionId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const correctionId = context.params.correctionId;
    
    console.log("?쭬 NLU ?섏젙 ?곗씠???앹꽦:", correctionId);
    
    // NLU ?ъ쟾 ?낅뜲?댄듃
    const db = functions.admin.firestore();
    const dictionaryRef = db.collection("nluDictionary").doc(data.inputText);
    
    await dictionaryRef.set({
      correctedTags: data.correctedTags,
      lastUpdated: functions.admin.firestore.FieldValue.serverTimestamp(),
      correctionId,
      createdBy: data.createdBy
    }, { merge: true });
    
    console.log("??NLU ?ъ쟾 ?낅뜲?댄듃 ?꾨즺:", data.inputText);
    
    // n8n ?뚮┝ (?좏깮?ы빆)
    const n8nWebhook = functions.config().n8n?.webhook;
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
            message: `?쭬 NLU ?숈뒿 ?곗씠??異붽?: "${data.inputText}" ??[${data.correctedTags.join(", ")}]`
          })
        });
      } catch (error) {
        console.error("??n8n ?뚮┝ ?꾩넚 ?ㅽ뙣:", error);
      }
    }
    
    return null;
  });

/**
 * ?ㅻ쪟 濡쒓렇 ?앹꽦 ???뚮┝
 */
export const onErrorLogCreate = functions
  .region("asia-northeast3")
  .firestore.document("errors/{errorId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const errorId = context.params.errorId;
    
    console.log("???ㅻ쪟 濡쒓렇 ?앹꽦:", errorId);
    
    // n8n ?뚮┝ (?좏깮?ы빆)
    const n8nWebhook = functions.config().n8n?.webhook;
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
            message: `???ㅻ쪟 諛쒖깮: ${data.error}`
          })
        });
      } catch (error) {
        console.error("??n8n ?뚮┝ ?꾩넚 ?ㅽ뙣:", error);
      }
    }
    
    return null;
  });
