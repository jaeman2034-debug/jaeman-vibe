export type Role =
  | "player" | "coach" | "club" | "facility" | "referee" | "trainer" | "shop";
export type TabKey = "market" | "clubs" | "jobs" | "events" | "facilities" | "admin";

export const ROLE_TABS: Record<Role, TabKey[]> = {
  player:   ["market","clubs","jobs","events","facilities","admin"],
  coach:    ["market","clubs","jobs","events","facilities","admin"],
  club:     ["market","clubs","jobs","events","facilities","admin"],
  facility: ["market","jobs","events","facilities","admin"],
  referee:  ["jobs","events","admin"],
  trainer:  ["market","jobs","events","facilities","admin"],
  shop:     ["market","jobs","events","facilities","admin"],
  // ê°œë°œ/?ŒìŠ¤?¸ìš©: ëª¨ë“  ??• ??admin ??ì¶”ê? (?¤ì œ ?´ì˜?ì„œ???¹ì • ??• ë§?
  // admin: ["admin"], // ?¤ì œ ?´ì˜ ?œì—??ë³„ë„ admin ??•  ?ì„±
};

export type ActionKey =
  | "create_product" | "join_club" | "create_club"
  | "post_job" | "apply_job"
  | "create_event" | "book_event"
  | "manage_facility";

export const TAB_ACTIONS: Record<TabKey, ActionKey[]> = {
  market:     ["create_product"],
  clubs:      ["join_club","create_club"],
  jobs:       ["post_job","apply_job"],
  events:     ["create_event","book_event"],
  facilities: ["manage_facility"],
};

export const ROLE_ACTIONS: Record<Role, ActionKey[]> = {
  player:   ["create_product","join_club","apply_job","book_event"],
  coach:    ["create_product","create_club","post_job","create_event"],
  club:     ["create_club","post_job","create_event"],
  facility: ["manage_facility","post_job","create_event"],
  referee:  ["apply_job","create_event"],
  trainer:  ["create_product","post_job","create_event","book_event"],
  shop:     ["create_product","post_job","create_event"],
};
