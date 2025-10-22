import * as functions from 'firebase-functions';
export declare const suggestTeams: functions.https.CallableFunction<any, Promise<{
    teams: {
        name: string;
        uids: string[];
    }[];
}>, unknown>;
export declare const saveTeams: functions.https.CallableFunction<any, Promise<{
    ok: boolean;
}>, unknown>;
//# sourceMappingURL=team_assign.d.ts.map
