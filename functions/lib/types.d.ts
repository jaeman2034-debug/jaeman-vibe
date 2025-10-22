declare global {
    namespace NodeJS {
        interface ProcessEnv {
            N8N_WEBHOOK_URL?: string;
            NOTIFY_CENTER_LAT?: string;
            NOTIFY_CENTER_LNG?: string;
            NOTIFY_RADIUS_M?: string;
        }
    }
}
export {};
//# sourceMappingURL=types.d.ts.map
