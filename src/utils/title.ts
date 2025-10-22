export function stripMd(x: string) {
  return x
    .replace(/`{1,3}[^`]*`{1,3}/g, "")        // inline code
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")     // images
    .replace(/\[[^\]]*\]\([^)]+\)/g, "")      // links
    .replace(/^#+\s*/gm, "")                  // headings
    .replace(/[*_~>`-]{1,}/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractTitleFromContent(content: string, max = 48) {
  const clean = stripMd(content);
  const lines = clean.split(/\n+/).map(s => s.trim()).filter(Boolean);

  let cand = lines[0] || '';
  for (const s of lines) {
    if (/모집|안내|공지|소개|신청|행사|대회|모임|공지사항/.test(s) && s.length >= 8) {
      cand = s; break;
    }
  }

  cand = cand
    .replace(/^안녕하세요[.,!\s]*/i, '')
    .replace(/^공지(?:사항)?[:\s-]*/i, '')
    .replace(/^소개[:\s-]*/i, '')
    .replace(/^모집[:\s-]*/i, '');

  cand = cand.replace(/[.!?…]+$/g, '');
  if (cand.length > max) cand = cand.slice(0, max - 1).trimEnd() + '…';
  return cand || '제목을 입력하세요';
}

export function makeExcerpt(content: string, max = 140) {
  const clean = stripMd(content);
  return clean.length > max ? clean.slice(0, max - 1).trimEnd() + "…" : clean;
}

// 본문에서 첫 이미지 URL 뽑기(마크다운/HTML 둘 다)
export function findFirstImageUrl(content: string) {
  const md = content.match(/!\[[^\]]*]\((https?:\/\/[^)]+)\)/);
  if (md) return md[1];
  const html = content.match(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/i);
  if (html) return html[1];
  return null;
}
