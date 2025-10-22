export function buildCaption({ meetup, link, extraTags = [] }) {
  const hash = (process.env.DEFAULT_HASHTAGS || '').split(/\s+/).filter(Boolean);
  const tags = Array.from(new Set([...hash, ...extraTags]));
  const date = meetup.dateText || new Date(meetup.dateStart).toLocaleString('ko-KR');
  const loc = meetup.location?.name || '';
  const title = meetup.title;
  
  const lines = [
    `【${title}】`,
    date + (loc ? ` · ${loc}` : ''),
    link,
    tags.join(' ')
  ];
  
  return lines.join('\n');
}
