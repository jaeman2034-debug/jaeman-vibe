interface LocaleConfig {
    code: string;
    name: string;
    messages: Record<string, string>;
}
export declare function getLocale(teamId: string): string;
export declare function t(key: string, teamId: string, params?: Record<string, any>): string;
export declare function getAvailableLocales(): LocaleConfig[];
export declare function isValidLocale(locale: string): boolean;
declare const _default: {
    getLocale: typeof getLocale;
    t: typeof t;
    getAvailableLocales: typeof getAvailableLocales;
    isValidLocale: typeof isValidLocale;
};
export default _default;
//# sourceMappingURL=i18n.d.ts.map
