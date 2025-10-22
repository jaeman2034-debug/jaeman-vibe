export function refineKoTitle(raw: string, max = 48) {
  let t = (raw || '').trim();

  // 1) '운동장은/장소는' → '운동장:' / '장소:'
  t = t.replace(/(운동장|장소|활동장|집합장소)\s*(은|는)\s*/g, '$1: ');

  // 2) '창단한 지 약 3년 되었고/되었습니다' → '창단 3년'
  t = t.replace(/창단한?\s*지?\s*약?\s*(\d+)\s*년\s*되었(?:고|습니다)?/g, '창단 $1년');
  t = t.replace(/창단한?\s*지?\s*(\d+)\s*년\s*되었(?:고|습니다)?/g, '창단 $1년');

  // 3) 문두의 주제 표지 '은/는'을 쉼표로 바꾸기 (기관명, 팀명 뒤)
  t = t.replace(/^(.{2,20}?)(?:은|는)\s+/, '$1, ');

  // 4) 공손체/서술 종결 제거
  t = t.replace(/(입니다|예요|이에요|되었습니다|되었어요)\.?$/g, '').trim();

  // 5) 공백/구두점 정리
  t = t.replace(/\s*[,·]\s*/g, m => (m.includes('·') ? ' · ' : ', '));
  t = t.replace(/\s+/g, ' ').replace(/\s*,\s*/g, ', ').replace(/\s*·\s*/g, ' · ').trim();

  // 6) 길이 제한
  if (t.length > max) t = t.slice(0, max - 1).trimEnd() + '…';
  return t;
}

export function smartKoTitle(
  text: string,
  opts: { subjectOnly?: boolean; max?: number } = {}
) {
  const { subjectOnly = false, max = 48 } = opts;
  const src = (text || '').replace(/\r/g, '').trim();
  const clean = src.replace(/^안녕하세요[^\n]*\n?/i, '');

  // 주어(팀명/클럽명) = '...는/은 ' 앞부분
  const subject =
    clean.match(/^([^\n]{2,40}?)(?:은|는)\s+/)?.[1] ||
    clean.split('\n')[0].replace(/[.!?…]+$/, '').trim();

  if (subjectOnly) {
    const t = subject || '제목';
    return t.length > max ? t.slice(0, max - 1).trimEnd() + '…' : t;
  }

  // (기존: 명사구 조합이 필요할 때)
  const years = clean.match(/창단(?:한\s*지)?\s*약?\s*(\d+)\s*년/)?.[1];
  const placeBase =
    clean.match(/(?:운동장|장소|활동장)\s*(?:은|는|:)\s*([^\n,·]+?)(?=[,·.\n]|$)/)?.[1];
  const placeExtra = clean.match(/제\s*\d+\s*구장/)?.[0]?.replace(/\s+/g, '');
  const place = placeBase ? `${placeBase}${placeExtra ? ` ${placeExtra}` : ''}` : null;

  const parts = [subject, years && `창단 ${years}년`, place && `운동장: ${place}`]
    .filter(Boolean) as string[];

  let title = parts.join(' · ').replace(/\s+/g, ' ').trim();
  if (title.length > max) title = title.slice(0, max - 1).trimEnd() + '…';
  return title || '제목';
}

export function smartComposeKoTitle(text: string) {
  return smartKoTitle(text, { subjectOnly: false });
}
