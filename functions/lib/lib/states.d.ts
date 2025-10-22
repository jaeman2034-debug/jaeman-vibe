/**
 * 嫄곕옒 ?곹깭 癒몄떊 愿由? */
export type MarketState = 'listed' | 'reserved' | 'confirmed' | 'received' | 'closed' | 'disputed';
export interface StateTransition {
    from: MarketState;
    to: MarketState;
    by: string;
    at: any;
    reason?: string;
}
/**
 * ?곹깭 ?꾩씠媛 ?덉슜?섎뒗吏 ?뺤씤
 */
export declare function canTransition(from: MarketState, to: MarketState): boolean;
/**
 * ?곹깭 ?꾩씠 寃利?諛??ㅽ뻾
 */
export declare function validateTransition(currentState: MarketState, targetState: MarketState, userId: string, userRole?: string): {
    valid: boolean;
    reason?: string;
};
/**
 * ?곹깭蹂??ㅻ챸
 */
export declare function getStateDescription(state: MarketState): string;
/**
 * ?곹깭蹂?媛?ν븳 ?≪뀡?? */
export declare function getAvailableActions(state: MarketState, userRole?: string): string[];
/**
 * ?곹깭 ?덉뒪?좊━ ?앹꽦
 */
export declare function createStateHistory(from: MarketState, to: MarketState, by: string, reason?: string): StateTransition;
/**
 * ?곹깭 ?꾩씠 濡쒓렇 ?щ㎎?? */
export declare function formatStateHistory(history: StateTransition[]): string;
//# sourceMappingURL=states.d.ts.map
