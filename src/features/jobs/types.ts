export type JobPost = {
  id: string;
  title: string;
  sport: string;     // cat id
  region: string;
  type: "fulltime" | "parttime" | "coach" | "referee" | "etc";
  pay?: string;      // "?œê¸‰ 15,000?? ??
  contact?: string;  // ?´ë©”???„í™”/ë§í¬
  createdAt: number;
};
