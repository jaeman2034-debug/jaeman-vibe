import * as functions from "firebase-functions";
export declare const onSmartAutoReply: any;
export declare const initSellerData: functions.https.CallableFunction<any, Promise<{
    success: boolean;
    sellerId: any;
    message: string;
}>, unknown>;
export declare const updateSellerFAQ: functions.https.CallableFunction<any, Promise<{
    success: boolean;
    sellerId: any;
    faqCount: number;
}>, unknown>;
//# sourceMappingURL=smartChatbot.d.ts.map
