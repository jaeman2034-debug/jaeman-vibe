export type PaymentStatus = 'initiated' | 'paid' | 'failed' | 'cancelled' | 'refunded';
export type PaymentMethod = 'card' | 'bank_transfer' | 'kakao_pay' | 'toss_pay';
/**
 * 寃곗젣 ?앹꽦 (硫깅벑??蹂댁옣)
 */
export declare const createPayment: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    orderId: string;
    status: string;
    paymentId: any;
    receiptNo?: undefined;
} | {
    success: boolean;
    orderId: string;
    paymentId: string;
    receiptNo: string;
    status: string;
}>, unknown>;
/**
 * 寃곗젣 痍⑥냼
 */
export declare const cancelPayment: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
}>, unknown>;
/**
 * 遺遺??섎텋
 */
export declare const partialRefund: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
}>, unknown>;
/**
 * 二쇰Ц ?댁뿭 議고쉶
 */
export declare const getOrderHistory: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    orders: {
        id: string;
    }[];
    hasMore: boolean;
}>, unknown>;
//# sourceMappingURL=payments.d.ts.map
