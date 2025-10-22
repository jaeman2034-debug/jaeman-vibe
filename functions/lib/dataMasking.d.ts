export declare class DataMasking {
    private static rules;
    static mask(text: string): string;
    static maskObject(obj: any): any;
    private static maskSensitiveKey;
    static maskLogMessage(message: string, ...args: any[]): [string, ...any[]];
    static maskError(error: Error): Error;
    static maskHttpRequest(request: {
        url?: string;
        headers?: Record<string, string>;
        body?: any;
        method?: string;
    }): any;
    static maskHttpResponse(response: {
        status?: number;
        headers?: Record<string, string>;
        body?: any;
    }): any;
    static addRule(pattern: RegExp, replacement: string, name: string): void;
    static removeRule(name: string): void;
    static resetRules(): void;
    static getMaskingStats(text: string): {
        [ruleName: string]: number;
    };
    static safeLog(level: 'info' | 'warn' | 'error', message: string, ...args: any[]): void;
    static detectSensitiveData(text: string): {
        hasEmail: boolean;
        hasPhone: boolean;
        hasToken: boolean;
        hasCard: boolean;
        hasSSN: boolean;
        detectedTypes: string[];
    };
    static validateMasking(original: string, masked: string): {
        isValid: boolean;
        issues: string[];
    };
}
declare const _default: {
    DataMasking: typeof DataMasking;
};
export default _default;
//# sourceMappingURL=dataMasking.d.ts.map
