// ?���??�짜 명령???�싱 ?�틸리티 - 천재 모드 4?�계
export function parseDateCommand(command: string): string {
  const today = new Date();
  const targetDate = new Date(today);
  
  // 명령?��? ?�문?�로 변?�하??비교
  const lowerCommand = command.toLowerCase();

  // ?�짜 ?�워??매칭
  if (lowerCommand.includes('?�제') || lowerCommand.includes('yesterday')) {
    targetDate.setDate(today.getDate() - 1);
  } else if (lowerCommand.includes('그제') || lowerCommand.includes('2?�전')) {
    targetDate.setDate(today.getDate() - 2);
  } else if (lowerCommand.includes('3?�전') || lowerCommand.includes('3????)) {
    targetDate.setDate(today.getDate() - 3);
  } else if (lowerCommand.includes('?�번�?) || lowerCommand.includes('?�번 �?) || lowerCommand.includes('this week')) {
    // ?�번 주는 최근 3?�로 ?�정
    targetDate.setDate(today.getDate() - 3);
  } else if (lowerCommand.includes('지?�주') || lowerCommand.includes('last week')) {
    targetDate.setDate(today.getDate() - 7);
  } else if (lowerCommand.includes('?�늘') || lowerCommand.includes('today')) {
    targetDate.setDate(today.getDate());
  } else if (lowerCommand.includes('최근') || lowerCommand.includes('recent')) {
    // 최근?� ?�늘�??�정
    targetDate.setDate(today.getDate());
  } else {
    // 명령?�에???�짜 ?�턴 찾기 (?? "10??17??, "2025-10-17")
    const datePattern = /(\d{1,2})??s*(\d{1,2})??g;
    const match = datePattern.exec(command);
    
    if (match) {
      const month = parseInt(match[1]) - 1; // JavaScript??0부???�작
      const day = parseInt(match[2]);
      targetDate.setMonth(month);
      targetDate.setDate(day);
    } else {
      // ?�짜 ?�턴???�으�??�늘�??�정
      targetDate.setDate(today.getDate());
    }
  }

  // YYYY-MM-DD ?�식?�로 반환
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

// ?�짜 ID�??�국???�짜 문자?�로 변??export function formatDateId(dateId: string): string {
  const date = new Date(dateId);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
}

// 명령?�에???�션 추출
export function parseAction(command: string): string {
  const lowerCommand = command.toLowerCase();
  
  if (lowerCommand.includes('?�어') || lowerCommand.includes('read')) {
    return 'read';
  } else if (lowerCommand.includes('보여') || lowerCommand.includes('show')) {
    return 'show';
  } else if (lowerCommand.includes('?�려') || lowerCommand.includes('tell')) {
    return 'tell';
  } else if (lowerCommand.includes('?�약') || lowerCommand.includes('summary')) {
    return 'summary';
  } else if (lowerCommand.includes('몇명') || lowerCommand.includes('how many')) {
    return 'count';
  } else {
    return 'read'; // 기본�?  }
}

// 명령?�에???�계 ?�??추출
export function parseStatType(command: string): string {
  const lowerCommand = command.toLowerCase();
  
  if (lowerCommand.includes('가?�자') || lowerCommand.includes('user') || lowerCommand.includes('?�원')) {
    return 'users';
  } else if (lowerCommand.includes('거래') || lowerCommand.includes('transaction')) {
    return 'transactions';
  } else if (lowerCommand.includes('?�답') || lowerCommand.includes('response')) {
    return 'responses';
  } else if (lowerCommand.includes('메시지') || lowerCommand.includes('message')) {
    return 'messages';
  } else {
    return 'all'; // 기본�? ?�체
  }
}
