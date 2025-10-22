export declare const createEmailTransporter: () => any;
export declare const getEmailTemplate: (type: "weekly_report" | "error_alert" | "system_notification", data: any) => {
    subject: string;
    html: string;
} | {
    subject: string;
    html: string;
} | {
    subject: string;
    html: string;
};
export declare const sendEmail: (to: string, subject: string, html: string, attachments?: any[]) => Promise<{
    success: boolean;
    error?: undefined;
} | {
    success: boolean;
    error: any;
}>;
export declare const ADMIN_EMAIL = "admin@yagovibe.com";
export declare const validateEmailConfig: () => boolean;
//# sourceMappingURL=emailConfig.d.ts.map
