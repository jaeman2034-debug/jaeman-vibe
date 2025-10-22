export interface UserProfile {
  uid: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  // 선택 동의 항목 (자격 검증용)
  gender?: 'female' | 'male' | 'other';
  birthdate?: string; // ISO 'YYYY-MM-DD'
}
