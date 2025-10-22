import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.env.DATA_CACHE || '/data/cache';
const DIR = path.join(ROOT, 'webhooks');

/**
 * 웹훅 중복 처리 방지를 위한 아이템포턴시 체크
 * @param {string} key - 고유 식별자 (예: 'portone:paymentId:timestamp')
 * @returns {Promise<boolean>} 이미 처리된 경우 true, 새로운 요청인 경우 false
 */
export async function alreadyProcessed(key) {
  await fs.mkdir(DIR, { recursive: true });
  const f = path.join(DIR, encodeURIComponent(key));
  
  try { 
    await fs.access(f); 
    return true; // 이미 처리됨
  } catch { 
    await fs.writeFile(f, String(Date.now())); 
    return false; // 새로운 요청
  }
}

/**
 * 웹훅 처리 기록 삭제 (수동 재처리용)
 * @param {string} key - 삭제할 키
 */
export async function clearProcessed(key) {
  try {
    const f = path.join(DIR, encodeURIComponent(key));
    await fs.unlink(f);
  } catch (e) {
    // 파일이 없어도 에러 무시
  }
}

/**
 * 오래된 웹훅 기록 정리 (7일 이상)
 */
export async function cleanupOldRecords() {
  try {
    await fs.mkdir(DIR, { recursive: true });
    const files = await fs.readdir(DIR);
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7일
    
    for (const file of files) {
      const filePath = path.join(DIR, file);
      try {
        const stats = await fs.stat(filePath);
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
        }
      } catch (e) {
        // 개별 파일 삭제 실패는 무시
      }
    }
  } catch (e) {
    console.warn('Failed to cleanup old webhook records:', e);
  }
}
