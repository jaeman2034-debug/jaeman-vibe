export type Intent =
  | { type: 'schedule'; team?: string }
  | { type: 'news'; team?: string }
  | { type: 'feed'; topic?: string }
  | { type: 'unknown' };

const TEAMS = ['?ì‚°','LG','KT','SSG','?¤ì?','KIA','ë¡?°','?¼ì„±','?œí™”','NC'];

export function parseIntent(ko: string): Intent {
  const t = ko.replace(/\s+/g,'').toLowerCase();

  const team = TEAMS.find(n => t.includes(n.toLowerCase()));
  if (t.includes('?¼ì •') || t.includes('?¤ì?ì¤?)) return { type: 'schedule', team };
  if (t.includes('?´ìŠ¤') || t.includes('?Œì‹')) return { type: 'news', team };
  if (t.includes('ê²½ê¸°') || t.includes('?Œë ¤ì¤?) || t.includes('ìµœê·¼')) return { type: 'feed', topic: 'latest' };

  return { type: 'unknown' };
}
