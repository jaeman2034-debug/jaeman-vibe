export type MeetCategory = {
  id: string;          // slug
  name: string;        // ?�시�?
  emoji?: string;      // ?�이�?간단??
};

export const MEET_CATEGORIES: MeetCategory[] = [
  { id: "baseball",   name: "?�구",     emoji: "?? },
  { id: "football",   name: "축구",     emoji: "?? },
  { id: "basketball", name: "?�구",     emoji: "??" },
  { id: "volleyball", name: "배구",     emoji: "?��" },
  { id: "golf",       name: "골프",     emoji: "?���? },
  { id: "tennis",     name: "?�니??,   emoji: "?��" },
  { id: "running",    name: "?�닝",     emoji: "?��" },
  { id: "outdoor",    name: "?�웃?�어", emoji: "?��" },
  { id: "fitness",    name: "?�트?�스", emoji: "?���? },
  { id: "esports",    name: "e?�포�?,  emoji: "?��" },
];
