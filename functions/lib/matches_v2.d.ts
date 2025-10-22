export declare const generateRoundRobin: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: boolean;
    count: number;
}>, unknown>;
export declare const generateSingleElim: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: boolean;
    count: number;
}>, unknown>;
/** ?ㅼ퐫???낅젰/?섏젙 ??standings 媛깆떊, 釉뚮옒???뱀옄 ?밴툒 */
export declare const reportMatch: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: boolean;
    winner: string | null;
}>, unknown>;
/** ?꾩껜 ?ㅽ깲???ш퀎??硫깅벑) */
export declare const recomputeStandings: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: boolean;
    teams: number;
}>, unknown>;
//# sourceMappingURL=matches_v2.d.ts.map
