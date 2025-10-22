/**
 * ?뮩 YAGO VIBE 寃곗젣 ?쒖뒪??(鍮꾪솢??怨④꺽)
 *
 * ?뵶 ?꾩옱 ?곹깭: ?뚯뒪??紐⑤뱶
 * ???쒖꽦?? TOSS_SECRET???ㅽ궎濡?援먯껜留??섎㈃ 利됱떆 ?ㅺ굅???꾪솚
 */
import * as functions from "firebase-functions";
/**
 * 1截뤴깵 寃곗젣 ?앹꽦
 * ?대씪?댁뼵?몄뿉???몄텧?섏뿬 寃곗젣瑜?珥덇린?뷀빀?덈떎.
 *
 * @param productId ?곹뭹 ID
 * @param buyerId 援щℓ??UID
 * @returns paymentId, checkoutUrl
 */
export declare const createPayment: functions.https.CallableFunction<any, Promise<{
    paymentId: string;
    checkoutUrl: string;
    message: string;
}>, unknown>;
/**
 * 2截뤴깵 Toss Webhook
 * Toss?먯꽌 寃곗젣 ?곹깭 蹂寃????몄텧?섎뒗 ?붾뱶?ъ씤?? *
 * POST https://<region>-<project>.cloudfunctions.net/tossWebhook
 */
export declare const tossWebhook: functions.https.HttpsFunction;
/**
 * 3截뤴깵 ?섎텋 泥섎━
 * 愿由ъ옄媛 ?몄텧?섏뿬 寃곗젣瑜??섎텋?⑸땲??
 *
 * @param paymentId 寃곗젣 ID
 * @param amount ?섎텋 湲덉븸 (?좏깮, 湲곕낯媛믪? ?꾩븸)
 * @param reason ?섎텋 ?ъ쑀
 */
export declare const refundPayment: functions.https.CallableFunction<any, Promise<{
    ok: boolean;
    message: string;
    refundAmount: any;
}>, unknown>;
/**
 * 4截뤴깵 寃곗젣 ?곹깭 議고쉶
 * ?대씪?댁뼵?몄뿉??寃곗젣 ?곹깭瑜??뺤씤?⑸땲??
 *
 * @param paymentId 寃곗젣 ID
 */
export declare const getPaymentStatus: functions.https.CallableFunction<any, Promise<{
    paymentId: string;
}>, unknown>;
//# sourceMappingURL=payments.d.ts.map
