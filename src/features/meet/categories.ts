export type MeetCategory = {
  id: string;          // slug
  name: string;        // ?œì‹œëª?
  emoji?: string;      // ?„ì´ì½?ê°„ë‹¨??
};

export const MEET_CATEGORIES: MeetCategory[] = [
  { id: "baseball",   name: "?¼êµ¬",     emoji: "?? },
  { id: "football",   name: "ì¶•êµ¬",     emoji: "?? },
  { id: "basketball", name: "?êµ¬",     emoji: "??" },
  { id: "volleyball", name: "ë°°êµ¬",     emoji: "?" },
  { id: "golf",       name: "ê³¨í”„",     emoji: "?Œï¸? },
  { id: "tennis",     name: "?Œë‹ˆ??,   emoji: "?¾" },
  { id: "running",    name: "?¬ë‹",     emoji: "?‘Ÿ" },
  { id: "outdoor",    name: "?„ì›ƒ?„ì–´", emoji: "?§­" },
  { id: "fitness",    name: "?¼íŠ¸?ˆìŠ¤", emoji: "?‹ï¸? },
  { id: "esports",    name: "e?¤í¬ì¸?,  emoji: "?®" },
];
