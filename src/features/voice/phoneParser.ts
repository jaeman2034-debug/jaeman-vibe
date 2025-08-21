// 📱 한국어 전화번호 파싱 유틸리티
// 음성 인식 결과에서 숫자와 하이픈을 추출하여 정규화된 전화번호로 변환

/** 한국어 숫자 단어 → 숫자 매핑 */
const KOREAN_NUMBER_MAP: Record<string, string> = {
  // 0
  '영': '0', '공': '0', '제로': '0', '빵': '0',
  
  // 1
  '일': '1', '하나': '1', 'one': '1',
  
  // 2
  '이': '2', '둘': '2', 'two': '2', '투': '2',
  
  // 3
  '삼': '3', '셋': '3', 'three': '3', '쓰리': '3',
  
  // 4
  '사': '4', '넷': '4', 'four': '4', '포': '4',
  
  // 5
  '오': '5', '다섯': '5', 'five': '5', '파이브': '5',
  
  // 6
  '육': '6', '여섯': '6', 'six': '6', '식스': '6',
  
  // 7
  '칠': '7', '일곱': '7', 'seven': '7', '세븐': '7',
  
  // 8
  '팔': '8', '여덟': '8', 'eight': '8', '에잇': '8',
  
  // 9
  '구': '9', '아홉': '9', 'nine': '9', '나인': '9',
};

/** 하이픈 관련 단어 → 하이픈 매핑 */
const HYPHEN_WORDS = [
  '대시', '하이픈', '빼기', 'dash', 'hyphen', 'minus'
];

/** 한국 휴대폰 번호 패턴 (010-xxxx-xxxx) */
const KR_PHONE_PATTERN = /^010[-\s]?(\d{4})[-\s]?(\d{4})$/;

/**
 * 음성 인식 결과에서 전화번호 추출 및 정규화
 * @param text 음성 인식 결과 텍스트
 * @returns { digits: string, formatted: string } 정규화된 전화번호
 */
export function extractPhoneKO(text: string): { digits: string; formatted: string } {
  if (!text || typeof text !== 'string') {
    return { digits: '', formatted: '' };
  }

  let normalized = text.toLowerCase().trim();
  
  // 1️⃣ 한국어 숫자 단어 → 숫자 변환
  Object.entries(KOREAN_NUMBER_MAP).forEach(([korean, digit]) => {
    const regex = new RegExp(korean, 'gi');
    normalized = normalized.replace(regex, digit);
  });
  
  // 2️⃣ 하이픈 관련 단어 → 하이픈 변환
  HYPHEN_WORDS.forEach(hyphenWord => {
    const regex = new RegExp(hyphenWord, 'gi');
    normalized = normalized.replace(regex, '-');
  });
  
  // 3️⃣ 숫자와 하이픈만 남기기
  let digits = normalized.replace(/[^\d-]/g, '');
  
  // 4️⃣ 연속된 하이픈 정리
  digits = digits.replace(/-{2,}/g, '-');
  
  // 5️⃣ 앞뒤 하이픈 제거
  digits = digits.replace(/^-+|-+$/g, '');
  
  // 6️⃣ 한국 휴대폰 번호 우선 추출 (010으로 시작하는 11자리)
  if (digits.includes('010')) {
    const startIndex = digits.indexOf('010');
    const potentialPhone = digits.slice(startIndex, startIndex + 11);
    
    if (potentialPhone.length === 11 && /^\d{11}$/.test(potentialPhone)) {
      const formatted = formatKR(potentialPhone);
      return { digits: potentialPhone, formatted };
    }
  }
  
  // 7️⃣ 일반적인 숫자 시퀀스에서 11자리 추출
  const cleanDigits = digits.replace(/[^\d]/g, '');
  if (cleanDigits.length >= 11) {
    const phoneDigits = cleanDigits.slice(0, 11);
    const formatted = formatKR(phoneDigits);
    return { digits: phoneDigits, formatted };
  }
  
  // 8️⃣ 11자리 미만인 경우 그대로 반환
  if (cleanDigits.length > 0) {
    return { digits: cleanDigits, formatted: cleanDigits };
  }
  
  return { digits: '', formatted: '' };
}

/**
 * 11자리 숫자를 한국 전화번호 형식으로 포맷팅
 * @param digits 11자리 숫자 문자열
 * @returns 010-xxxx-xxxx 형식의 전화번호
 */
export function formatKR(digits: string): string {
  if (!digits || digits.length !== 11 || !/^\d{11}$/.test(digits)) {
    return digits;
  }
  
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

/**
 * 전화번호 유효성 검사
 * @param phone 전화번호 문자열
 * @returns 유효한 한국 휴대폰 번호인지 여부
 */
export function isValidKRPhone(phone: string): boolean {
  if (!phone) return false;
  
  // 하이픈 제거 후 11자리 숫자인지 확인
  const clean = phone.replace(/[^\d]/g, '');
  if (clean.length !== 11) return false;
  
  // 010으로 시작하는지 확인
  if (!clean.startsWith('010')) return false;
  
  return true;
}

/**
 * 음성 인식 결과에서 숫자만 추출 (전화번호 외 용도)
 * @param text 음성 인식 결과 텍스트
 * @returns 숫자만 포함된 문자열
 */
export function extractDigits(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  let normalized = text.toLowerCase();
  
  // 한국어 숫자 단어 → 숫자 변환
  Object.entries(KOREAN_NUMBER_MAP).forEach(([korean, digit]) => {
    const regex = new RegExp(korean, 'gi');
    normalized = normalized.replace(regex, digit);
  });
  
  // 숫자만 추출
  return normalized.replace(/[^\d]/g, '');
} 