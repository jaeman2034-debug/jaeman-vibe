import * as functions from "firebase-functions";
/**
 * ?벀 Storage ?대?吏 ?낅줈?????먮룞 ?쒓렇 ?앹꽦 諛?Firestore ?낅뜲?댄듃
 *
 * ?몃━嫄? Storage onFinalize
 * 湲곕뒫:
 * 1. market-uploads 臾몄꽌?먯꽌 caption_ko 濡쒕뱶
 * 2. ?쒓뎅??罹≪뀡?먯꽌 ?ㅼ썙??異붿텧
 * 3. tags 諛곗뿴 ?꾨뱶 ?낅뜲?댄듃
 * 4. searchKeywords ?꾨뱶 ?앹꽦 (寃??理쒖쟻??
 */
export declare const autoGenerateTags: any;
/**
 * ?쭬 AI 湲곕컲 ?먯뿰??寃?됱뼱 ???쒓렇 蹂??(Callable Function)
 *
 * ?ъ슜?먭? "異뺢뎄?????좉린 醫뗭? ?좊컻" 媛숈? ?먯뿰?대줈 寃?됲븯硫? * GPT媛 ?듭떖 ?ㅼ썙??2-3媛쒕? 異붿텧?댁꽌 諛섑솚
 */
export declare const refineSearchKeyword: functions.https.CallableFunction<any, Promise<{
    keywords: any;
}>, unknown>;
//# sourceMappingURL=autoTagging.d.ts.map
