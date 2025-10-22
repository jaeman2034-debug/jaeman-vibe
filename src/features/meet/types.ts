export type Meeting = {
  id: string;
  title: string;
  sport: string;     // cat id (e.g., "baseball")
  region: string;    // "KR" ??
  date: string;      // ISO date (YYYY-MM-DD)
  time?: string;     // "19:00"
  place?: string;    // "? ì‹¤?¼êµ¬??
  hostId: string;
  maxMembers?: number;
  memberCount?: number;
  createdAt: number; // ts
};
