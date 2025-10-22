// src/lib/ical.ts
export type RRuleOpts = {
  freq: 'DAILY'|'WEEKLY';
  interval?: number; // 기본 1
  byweekday?: number[]; // 0=일,1=월,...6=토
  count?: number; // N회
  until?: Date;   // 또는 종료일
};

export function buildRRule(opts: RRuleOpts){
  const parts = [`FREQ=${opts.freq}`, `INTERVAL=${opts.interval ?? 1}`];
  if (opts.byweekday?.length) parts.push(`BYDAY=${opts.byweekday.map(i=> ['SU','MO','TU','WE','TH','FR','SA'][i]).join(',')}`);
  if (opts.count) parts.push(`COUNT=${opts.count}`);
  if (opts.until) parts.push(`UNTIL=${toUTC(opts.until)}`);
  return parts.join(';');
}

export function makeICS({ uid, title, start, end, location, description, rrule }:{
  uid: string; title:string; start:Date; end?:Date; location?:string; description?:string; rrule?:string;
}){
  const dtStart = toUTC(start);
  const dtEnd = toUTC(end ?? new Date(start.getTime()+60*60*1000));
  const lines = [
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//YAGO VIBE//Events//KO','CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toUTC(new Date())}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escape(title)}`,
    location ? `LOCATION:${escape(location)}` : '',
    description ? `DESCRIPTION:${escape(description)}` : '',
    rrule ? `RRULE:${rrule}` : '',
    'END:VEVENT','END:VCALENDAR'
  ].filter(Boolean);
  return lines.join('\r\n');
}

function toUTC(d:Date){
  const pad = (n:number)=> String(n).padStart(2,'0');
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}
function escape(s:string){
  return s.replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/[,;]/g, m=> m===';'?'\\;':'\\,');
}
