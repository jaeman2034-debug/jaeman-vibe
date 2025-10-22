import * as functions from "firebase-functions";
import "jspdf-autotable";
export declare const sendWeeklyMarketReport: any;
export declare const generateMarketReport: functions.https.CallableFunction<any, Promise<{
    success: boolean;
    stats: {
        total: number;
        sold: number;
        reserved: number;
        open: number;
        avgPrice: number;
        avgAi: number;
        completionRate: number;
    };
    message: string;
}>, unknown>;
//# sourceMappingURL=sendMarketReport.d.ts.map
