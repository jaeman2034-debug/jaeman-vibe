export type JobPost = {
  id: string;
  title: string;
  sport: string;     // cat id
  region: string;
  type: "fulltime" | "parttime" | "coach" | "referee" | "etc";
  pay?: string;      // "?�급 15,000?? ??
  contact?: string;  // ?�메???�화/링크
  createdAt: number;
};
