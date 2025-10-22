import fs from 'node:fs/promises';
import path from 'node:path';

const DATA_PUBLIC = process.env.DATA_PUBLIC || '/data/public';
export const TICKETS_DIR = path.join(DATA_PUBLIC, 'tickets');

/**
 * 티켓 읽기
 * @param {string} id - 티켓 ID
 * @returns {Promise<Object>} 티켓 객체
 */
export async function readTicket(id) {
  const f = path.join(TICKETS_DIR, `${id}.json`);
  return JSON.parse(await fs.readFile(f, 'utf8'));
}

/**
 * 티켓 쓰기
 * @param {Object} ticket - 티켓 객체
 * @returns {Promise<Object>} 저장된 티켓
 */
export async function writeTicket(ticket) {
  const f = path.join(TICKETS_DIR, `${ticket.id}.json`);
  await fs.writeFile(f, JSON.stringify(ticket, null, 2));
  return ticket;
}

/**
 * 취소 가능 여부 확인
 * @param {Object} ticket - 티켓 객체
 * @param {number} now - 현재 시간 (ms)
 * @returns {boolean} 취소 가능 여부
 */
export function canCancel(ticket, now = Date.now()) {
  // 이미 체크인된 티켓은 취소 불가
  if (ticket.state === 'checkedIn') return false;
  
  // 이미 취소된 티켓은 취소 불가
  if (ticket.state === 'cancelled') return false;
  
  // 이벤트 시작 시간 확인
  const start = ticket.eventStart || now + 999999;
  const gapHours = (start - now) / 3_600_000;
  const limit = Number(process.env.CANCEL_HOURS_BEFORE || 1);
  
  return gapHours >= limit;
}

/**
 * 티켓 상태 업데이트
 * @param {string} ticketId - 티켓 ID
 * @param {Object} updates - 업데이트할 필드들
 * @returns {Promise<Object>} 업데이트된 티켓
 */
export async function updateTicketStatus(ticketId, updates) {
  const ticket = await readTicket(ticketId);
  const updatedTicket = { ...ticket, ...updates };
  return await writeTicket(updatedTicket);
}

/**
 * 모임별 티켓 목록 조회
 * @param {string} meetupId - 모임 ID
 * @returns {Promise<Array>} 티켓 목록
 */
export async function getTicketsByMeetup(meetupId) {
  try {
    await fs.mkdir(TICKETS_DIR, { recursive: true });
    const files = await fs.readdir(TICKETS_DIR);
    const tickets = [];
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      try {
        const ticket = JSON.parse(await fs.readFile(path.join(TICKETS_DIR, file), 'utf8'));
        if (ticket.meetupId === meetupId) {
          tickets.push(ticket);
        }
      } catch (e) {
        console.warn(`Failed to parse ticket file ${file}:`, e);
      }
    }
    
    return tickets;
  } catch (e) {
    console.error('Failed to get tickets by meetup:', e);
    return [];
  }
}

/**
 * 사용자별 티켓 목록 조회
 * @param {string} uid - 사용자 UID
 * @param {string} email - 사용자 이메일 (fallback)
 * @returns {Promise<Array>} 티켓 목록
 */
export async function getTicketsByUser(uid, email) {
  try {
    await fs.mkdir(TICKETS_DIR, { recursive: true });
    const files = await fs.readdir(TICKETS_DIR);
    const tickets = [];
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      try {
        const ticket = JSON.parse(await fs.readFile(path.join(TICKETS_DIR, file), 'utf8'));
        const isOwner = (ticket.user?.uid && ticket.user.uid === uid) || 
                       (ticket.user?.email && ticket.user.email === email);
        
        if (isOwner) {
          tickets.push(ticket);
        }
      } catch (e) {
        console.warn(`Failed to parse ticket file ${file}:`, e);
      }
    }
    
    // 최신 순으로 정렬
    tickets.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return tickets;
  } catch (e) {
    console.error('Failed to get tickets by user:', e);
    return [];
  }
}
