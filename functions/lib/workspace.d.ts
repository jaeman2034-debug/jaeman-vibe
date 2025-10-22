import * as admin from 'firebase-admin';
interface WorkspaceConfig {
    teamId: string;
    botToken: string;
    defaultChannel: string;
    locale: string;
    enabled: boolean;
    createdAt: admin.firestore.Timestamp;
    updatedAt: admin.firestore.Timestamp;
}
export declare class WorkspaceManager {
    private static cache;
    private static cacheExpiry;
    private static CACHE_TTL;
    static getWorkspace(teamId: string): Promise<WorkspaceConfig | null>;
    static setWorkspace(config: Omit<WorkspaceConfig, 'createdAt' | 'updatedAt'>): Promise<void>;
    static deleteWorkspace(teamId: string): Promise<void>;
    static listWorkspaces(): Promise<WorkspaceConfig[]>;
    static clearCache(): void;
}
export declare function slackApiW(teamId: string, method: string, body: any): Promise<any>;
export declare function buildBlocksI18n(data: any, teamId: string): any[];
export declare function rejectModalViewI18n(docId: string, teamId: string): any;
declare const _default: {
    WorkspaceManager: typeof WorkspaceManager;
    slackApiW: typeof slackApiW;
    buildBlocksI18n: typeof buildBlocksI18n;
    rejectModalViewI18n: typeof rejectModalViewI18n;
};
export default _default;
//# sourceMappingURL=workspace.d.ts.map
