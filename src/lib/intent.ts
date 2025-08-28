export type Intent =
  | { type: 'schedule'; team?: string }
  | { type: 'news'; team?: string }
  | { type: 'feed'; topic?: string }
  | { type: 'unknown' };

const TEAMS = ['두산','LG','KT','SSG','키움','KIA','롯데','삼성','한화','NC'];

export function parseIntent(ko: string): Intent {
  const t = ko.replace(/\s+/g,'').toLowerCase();

  const team = TEAMS.find(n => t.includes(n.toLowerCase()));
  if (t.includes('일정') || t.includes('스케줄')) return { type: 'schedule', team };
  if (t.includes('뉴스') || t.includes('소식')) return { type: 'news', team };
  if (t.includes('경기') || t.includes('알려줘') || t.includes('최근')) return { type: 'feed', topic: 'latest' };

  return { type: 'unknown' };
}
