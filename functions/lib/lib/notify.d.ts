/**
 * ?뚮┝ ?쒖뒪??(硫깅벑??蹂댁옣)
 */
export interface NotificationPayload {
    title: string;
    body: string;
    data?: Record<string, string>;
    imageUrl?: string;
}
export interface NotificationTarget {
    tokens: string[];
    userIds?: string[];
    topic?: string;
}
/**
 * 硫깅벑 ?뚮┝ 諛쒖넚
 */
export declare function sendNotification(key: string, target: NotificationTarget, payload: NotificationPayload): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
}>;
/**
 * ?ъ슜?먮퀎 ?뚮┝ 諛쒖넚
 */
export declare function sendToUser(userId: string, payload: NotificationPayload, options?: {
    idempotencyKey?: string;
}): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
}>;
/**
 * ?ㅼ쨷 ?ъ슜???뚮┝ 諛쒖넚
 */
export declare function sendToUsers(userIds: string[], payload: NotificationPayload, options?: {
    idempotencyKey?: string;
}): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
}>;
/**
 * ?좏겙 湲곕컲 ?뚮┝ 諛쒖넚
 */
export declare function sendToTokens(tokens: string[], payload: NotificationPayload, options?: {
    idempotencyKey?: string;
}): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
}>;
/**
 * 留덉폆 愿???뚮┝ ?쒗뵆由? */
export declare const MarketNotifications: {
    itemSold: (itemTitle: string, buyerName: string) => NotificationPayload;
    itemReserved: (itemTitle: string, sellerName: string) => NotificationPayload;
    offerReceived: (itemTitle: string, bidderName: string, price: number) => NotificationPayload;
    offerAccepted: (itemTitle: string, sellerName: string) => NotificationPayload;
};
/**
 * ?쒖뒪???뚮┝ ?쒗뵆由? */
export declare const SystemNotifications: {
    accountSuspended: (reason: string) => NotificationPayload;
    reportProcessed: (targetType: string, action: string) => NotificationPayload;
    paymentCompleted: (amount: number, itemTitle: string) => NotificationPayload;
};
//# sourceMappingURL=notify.d.ts.map
