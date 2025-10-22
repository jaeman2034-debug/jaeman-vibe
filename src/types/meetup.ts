export type GenderRule = 'any' | 'femaleOnly' | 'maleOnly';

export interface BucketRule {
  gender?: GenderRule;   // 기본 any
  minAge?: number;       // 만 나이
  maxAge?: number;       // 만 나이
}

export interface MeetupBucketDef {
  key: string;           // 'default'|'women'|'u10' 등
  label: string;         // 표시명
  description?: string;  // UI 설명
  capacity?: number;     // 이 버킷 정원(없으면 무한)
  rules?: BucketRule;    // 선택 규칙
}

export interface MeetupMeta {
  id: string;
  title: string;
  // ...기존 필드
  buckets?: MeetupBucketDef[];  // 없으면 ['default'] 자동
}
