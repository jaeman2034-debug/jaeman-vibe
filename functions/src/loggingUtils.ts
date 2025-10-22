import * as admin from "firebase-admin";

/**
 * ?뱤 愿由ъ옄 ??쒕낫?쒖슜 濡쒓퉭 ?좏떥由ы떚
 * 紐⑤뱺 Functions?먯꽌 ?ъ슜?????덈뒗 怨듯넻 濡쒓퉭 ?⑥닔?? */

// Firebase Admin 珥덇린??(?대? 珥덇린?붾릺???덈떎硫?臾댁떆)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * ?몄떆 ?뚮┝ ?꾩넚 濡쒓렇 湲곕줉
 */
export async function logPush(payload: {
  title: string;
  body: string;
  tokens: string[];
  data?: any;
  successCount?: number;
  failureCount?: number;
}) {
  try {
    await db.collection("notificationLogs").add({
      type: "push",
      title: payload.title,
      body: payload.body,
      tokenCount: payload.tokens.length,
      successCount: payload.successCount || 0,
      failureCount: payload.failureCount || 0,
      data: payload.data || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log("?뱤 ?몄떆 ?뚮┝ 濡쒓렇 ????꾨즺");
  } catch (error) {
    console.error("???몄떆 ?뚮┝ 濡쒓렇 ????ㅽ뙣:", error);
  }
}

/**
 * 釉뚮━???꾩넚 濡쒓렇 湲곕줉
 */
export async function logBriefing(payload: {
  summary: string;
  audience: string;
  sentCount: number;
  itemCount: number;
  teamCount: number;
  totalCount: number;
  data?: any[];
}) {
  try {
    await db.collection("briefingLogs").add({
      summary: payload.summary,
      audience: payload.audience,
      sentCount: payload.sentCount,
      itemCount: payload.itemCount,
      teamCount: payload.teamCount,
      totalCount: payload.totalCount,
      data: payload.data || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log("?뱤 釉뚮━??濡쒓렇 ????꾨즺");
  } catch (error) {
    console.error("??釉뚮━??濡쒓렇 ????ㅽ뙣:", error);
  }
}

/**
 * ?먮윭 濡쒓렇 湲곕줉
 */
export async function logError(
  source: string, 
  err: any, 
  meta?: any,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
) {
  try {
    await db.collection("errors").add({
      source,
      message: String(err?.message || err),
      stack: err?.stack || null,
      severity,
      meta: meta ?? null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`?뱤 ?먮윭 濡쒓렇 ????꾨즺: ${source}`);
  } catch (error) {
    console.error("???먮윭 濡쒓렇 ????ㅽ뙣:", error);
  }
}

/**
 * ?ъ슜???쒕룞 濡쒓렇 湲곕줉
 */
export async function logUserActivity(payload: {
  userId: string;
  activity: string;
  details?: any;
  location?: { lat: number; lng: number };
  sessionId?: string;
}) {
  try {
    await db.collection("userActivities").add({
      userId: payload.userId,
      activity: payload.activity,
      details: payload.details || null,
      location: payload.location || null,
      sessionId: payload.sessionId || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`?뱤 ?ъ슜???쒕룞 濡쒓렇 ????꾨즺: ${payload.activity}`);
  } catch (error) {
    console.error("???ъ슜???쒕룞 濡쒓렇 ????ㅽ뙣:", error);
  }
}

/**
 * AI ?붿껌 濡쒓렇 湲곕줉
 */
export async function logAIRequest(payload: {
  type: 'summary' | 'description' | 'tags' | 'briefing';
  input: string;
  output: string;
  model: string;
  tokensUsed?: number;
  processingTime?: number;
  userId?: string;
}) {
  try {
    await db.collection("aiRequests").add({
      type: payload.type,
      input: payload.input,
      output: payload.output,
      model: payload.model,
      tokensUsed: payload.tokensUsed || 0,
      processingTime: payload.processingTime || 0,
      userId: payload.userId || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`?뱤 AI ?붿껌 濡쒓렇 ????꾨즺: ${payload.type}`);
  } catch (error) {
    console.error("??AI ?붿껌 濡쒓렇 ????ㅽ뙣:", error);
  }
}

/**
 * ?쒖뒪???깅뒫 濡쒓렇 湲곕줉
 */
export async function logPerformance(payload: {
  functionName: string;
  executionTime: number;
  memoryUsed?: number;
  success: boolean;
  errorMessage?: string;
  metadata?: any;
}) {
  try {
    await db.collection("performanceLogs").add({
      functionName: payload.functionName,
      executionTime: payload.executionTime,
      memoryUsed: payload.memoryUsed || 0,
      success: payload.success,
      errorMessage: payload.errorMessage || null,
      metadata: payload.metadata || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`?뱤 ?깅뒫 濡쒓렇 ????꾨즺: ${payload.functionName}`);
  } catch (error) {
    console.error("???깅뒫 濡쒓렇 ????ㅽ뙣:", error);
  }
}

/**
 * ?쇱씪 ?듦퀎 ?낅뜲?댄듃
 */
export async function updateDailyStats(date: string, stats: {
  newItems?: number;
  newSessions?: number;
  pushSent?: number;
  errors?: number;
  aiRequests?: number;
  uniqueUsers?: number;
}) {
  try {
    const docRef = db.collection("dailyStats").doc(date);
    
    await docRef.set({
      date,
      ...stats,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    
    console.log(`?뱤 ?쇱씪 ?듦퀎 ?낅뜲?댄듃 ?꾨즺: ${date}`);
  } catch (error) {
    console.error("???쇱씪 ?듦퀎 ?낅뜲?댄듃 ?ㅽ뙣:", error);
  }
}

/**
 * ?ㅼ떆媛?硫뷀듃由??낅뜲?댄듃
 */
export async function updateRealtimeMetrics(metrics: {
  activeUsers?: number;
  currentSessions?: number;
  queueSize?: number;
  systemLoad?: number;
}) {
  try {
    await db.collection("realtimeMetrics").doc("current").set({
      ...metrics,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    
    console.log("?뱤 ?ㅼ떆媛?硫뷀듃由??낅뜲?댄듃 ?꾨즺");
  } catch (error) {
    console.error("???ㅼ떆媛?硫뷀듃由??낅뜲?댄듃 ?ㅽ뙣:", error);
  }
}

/**
 * 濡쒓렇 ?뺣━ ?⑥닔 (30???댁긽 ??濡쒓렇 ??젣)
 */
export async function cleanupOldLogs() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const collections = [
      "notificationLogs",
      "aiRequests", 
      "performanceLogs",
      "userActivities"
    ];
    
    for (const collectionName of collections) {
      const oldLogs = await db
        .collection(collectionName)
        .where("createdAt", "<", admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
        .get();
      
      if (!oldLogs.empty) {
        const batch = db.batch();
        oldLogs.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        console.log(`?뿊截?${collectionName}: ${oldLogs.size}媛?濡쒓렇 ?뺣━ ?꾨즺`);
      }
    }
    
    console.log("???ㅻ옒??濡쒓렇 ?뺣━ ?꾨즺");
  } catch (error) {
    console.error("??濡쒓렇 ?뺣━ ?ㅽ뙣:", error);
  }
}

/**
 * ??쒕낫?쒖슜 吏묎퀎 ?곗씠???앹꽦
 */
export async function generateDashboardMetrics() {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // ?ㅻ뒛 ?듦퀎 怨꾩궛
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    
    const [
      itemsSnapshot,
      sessionsSnapshot,
      notificationsSnapshot,
      errorsSnapshot,
      aiRequestsSnapshot
    ] = await Promise.all([
      db.collection("marketItems")
        .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(todayStart))
        .get(),
      db.collection("voiceSessions")
        .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(todayStart))
        .get(),
      db.collection("notificationLogs")
        .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(todayStart))
        .where("type", "==", "push")
        .get(),
      db.collection("errors")
        .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(todayStart))
        .get(),
      db.collection("aiRequests")
        .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(todayStart))
        .get()
    ]);
    
    const stats = {
      newItems: itemsSnapshot.size,
      newSessions: sessionsSnapshot.size,
      pushSent: notificationsSnapshot.size,
      errors: errorsSnapshot.size,
      aiRequests: aiRequestsSnapshot.size,
      uniqueUsers: new Set(sessionsSnapshot.docs.map(d => d.data().createdBy)).size
    };
    
    await updateDailyStats(todayStr, stats);
    console.log("?뱤 ??쒕낫??硫뷀듃由??앹꽦 ?꾨즺:", stats);
    
    return stats;
  } catch (error) {
    console.error("????쒕낫??硫뷀듃由??앹꽦 ?ㅽ뙣:", error);
    return null;
  }
}
