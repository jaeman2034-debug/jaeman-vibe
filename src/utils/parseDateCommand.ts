// ?—“ï¸?? ì§œ ëª…ë ¹???Œì‹± ? í‹¸ë¦¬í‹° - ì²œì¬ ëª¨ë“œ 4?¨ê³„
export function parseDateCommand(command: string): string {
  const today = new Date();
  const targetDate = new Date(today);
  
  // ëª…ë ¹?´ë? ?Œë¬¸?ë¡œ ë³€?˜í•˜??ë¹„êµ
  const lowerCommand = command.toLowerCase();

  // ? ì§œ ?¤ì›Œ??ë§¤ì¹­
  if (lowerCommand.includes('?´ì œ') || lowerCommand.includes('yesterday')) {
    targetDate.setDate(today.getDate() - 1);
  } else if (lowerCommand.includes('ê·¸ì œ') || lowerCommand.includes('2?¼ì „')) {
    targetDate.setDate(today.getDate() - 2);
  } else if (lowerCommand.includes('3?¼ì „') || lowerCommand.includes('3????)) {
    targetDate.setDate(today.getDate() - 3);
  } else if (lowerCommand.includes('?´ë²ˆì£?) || lowerCommand.includes('?´ë²ˆ ì£?) || lowerCommand.includes('this week')) {
    // ?´ë²ˆ ì£¼ëŠ” ìµœê·¼ 3?¼ë¡œ ?¤ì •
    targetDate.setDate(today.getDate() - 3);
  } else if (lowerCommand.includes('ì§€?œì£¼') || lowerCommand.includes('last week')) {
    targetDate.setDate(today.getDate() - 7);
  } else if (lowerCommand.includes('?¤ëŠ˜') || lowerCommand.includes('today')) {
    targetDate.setDate(today.getDate());
  } else if (lowerCommand.includes('ìµœê·¼') || lowerCommand.includes('recent')) {
    // ìµœê·¼?€ ?¤ëŠ˜ë¡??¤ì •
    targetDate.setDate(today.getDate());
  } else {
    // ëª…ë ¹?´ì—??? ì§œ ?¨í„´ ì°¾ê¸° (?? "10??17??, "2025-10-17")
    const datePattern = /(\d{1,2})??s*(\d{1,2})??g;
    const match = datePattern.exec(command);
    
    if (match) {
      const month = parseInt(match[1]) - 1; // JavaScript??0ë¶€???œì‘
      const day = parseInt(match[2]);
      targetDate.setMonth(month);
      targetDate.setDate(day);
    } else {
      // ? ì§œ ?¨í„´???†ìœ¼ë©??¤ëŠ˜ë¡??¤ì •
      targetDate.setDate(today.getDate());
    }
  }

  // YYYY-MM-DD ?•ì‹?¼ë¡œ ë°˜í™˜
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

// ? ì§œ IDë¥??œêµ­??? ì§œ ë¬¸ì?´ë¡œ ë³€??export function formatDateId(dateId: string): string {
  const date = new Date(dateId);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
}

// ëª…ë ¹?´ì—???¡ì…˜ ì¶”ì¶œ
export function parseAction(command: string): string {
  const lowerCommand = command.toLowerCase();
  
  if (lowerCommand.includes('?½ì–´') || lowerCommand.includes('read')) {
    return 'read';
  } else if (lowerCommand.includes('ë³´ì—¬') || lowerCommand.includes('show')) {
    return 'show';
  } else if (lowerCommand.includes('?Œë ¤') || lowerCommand.includes('tell')) {
    return 'tell';
  } else if (lowerCommand.includes('?”ì•½') || lowerCommand.includes('summary')) {
    return 'summary';
  } else if (lowerCommand.includes('ëª‡ëª…') || lowerCommand.includes('how many')) {
    return 'count';
  } else {
    return 'read'; // ê¸°ë³¸ê°?  }
}

// ëª…ë ¹?´ì—???µê³„ ?€??ì¶”ì¶œ
export function parseStatType(command: string): string {
  const lowerCommand = command.toLowerCase();
  
  if (lowerCommand.includes('ê°€?…ì') || lowerCommand.includes('user') || lowerCommand.includes('?Œì›')) {
    return 'users';
  } else if (lowerCommand.includes('ê±°ë˜') || lowerCommand.includes('transaction')) {
    return 'transactions';
  } else if (lowerCommand.includes('?‘ë‹µ') || lowerCommand.includes('response')) {
    return 'responses';
  } else if (lowerCommand.includes('ë©”ì‹œì§€') || lowerCommand.includes('message')) {
    return 'messages';
  } else {
    return 'all'; // ê¸°ë³¸ê°? ?„ì²´
  }
}
