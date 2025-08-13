// 한국어 발화를 이메일/비번 인식 친화적으로 강력 치환
export function normalizeSpeechKoreanToEmail(text: string) {
    let s = (text ?? '').trim();
  
    // 전처리: 전각/이상 공백 정리
    s = s.replace(/\u3000/g, ' ').replace(/\s+/g, ' ').trim();
  
    // 자주 나오는 변형(띄어쓰기 포함) 치환
    const pairs: Array<[RegExp, string]> = [
      // 골뱅이 변형
      [/골\s*뱅\s*이/gi, '@'],
      [/앳\s*사인|에이\s*티\s*사인/gi, '@'],
  
      // 닷컴/도메인
      [/(닷\s*컴|점\s*컴|닷컴|점컴)/gi, '.com'],
      [/(점\s*넷|점넷)/gi, '.net'],
      [/(점\s*오\s*알\s*지|점오알지|오알지)/gi, '.org'],
      [/도트|점/gi, '.'],
  
      // 메일 서비스
      [/지\s*메\s*일|지메일/gi, 'gmail'],
      [/네\s*이\s*버|네이버/gi, 'naver'],
      [/한\s*메\s*일|한메일|다음/gi, 'hanmail'],
  
      // 한글 숫자 → 숫자 (비밀번호용)
      [/영|공/gi, '0'],
      [/(하나|일)/gi, '1'],
      [/(둘|이)/gi, '2'],
      [/(셋|삼)/gi, '3'],
      [/(넷|사)/gi, '4'],
      [/(다섯|오)/gi, '5'],
      [/(여섯|육)/gi, '6'],
      [/(일곱|칠)/gi, '7'],
      [/(여덟|팔)/gi, '8'],
      [/(아홉|구)/gi, '9'],
    ];
    pairs.forEach(([r, v]) => (s = s.replace(r, v)));
  
    // @, . 양쪽 띄어쓰기 제거 ( ex: a @ gmail . com → a@gmail.com )
    s = s.replace(/\s*@\s*/g, '@').replace(/\s*\.\s*/g, '.');
  
    // 숫자 사이 띄어쓰기 제거 (비밀번호 "1 2 3 4" → "1234")
    s = s.replace(/(\d)\s+(\d)/g, '$1$2');
  
    return s.trim();
  }
  