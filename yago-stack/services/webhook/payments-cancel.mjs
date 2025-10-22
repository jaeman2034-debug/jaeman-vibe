import fetch from 'node-fetch';
import { writeTicket } from './utils/tickets.mjs';
import { decPaid, wlShift } from './utils/capacity.mjs';
import { getRedis } from './utils/redisClient.mjs';
import { cancelAndPromote } from './utils/capacity-redis.mjs';
import { issuePromo } from './utils/promo.mjs';

/**
 * 티켓 취소 공통 처리
 * @param {Object} ticket - 티켓 객체
 * @param {Object} options - 취소 옵션
 * @param {string} options.actor - 취소 주체 ('user' | 'admin')
 * @param {string} options.reason - 취소 사유
 * @returns {Promise<Object>} 업데이트된 티켓
 */
export async function cancelTicketCore(ticket, { actor = 'user', reason = '' } = {}) {
  if (ticket.state === 'cancelled') {
    console.log('Ticket already cancelled:', ticket.id);
    return ticket;
  }

  // 무료 티켓 (금액 0)은 즉시 취소 처리
  if ((ticket.amount || 0) <= 0) {
    console.log('Cancelling free ticket:', ticket.id);
    ticket.state = 'cancelled';
    ticket.cancelledAt = Date.now();
    ticket.cancellation = {
      provider: 'free',
      reason,
      actor,
      cancelledAt: Date.now()
    };
    
    const updatedTicket = await writeTicket(ticket);
    
    // 무료 티켓도 카운트 감소 (버킷별)
    const redis = getRedis();
    if (redis) {
      const raw = await cancelAndPromote({ meetupId: ticket.meetupId, bucket: ticket.bucket || 'default' });
      if (raw) {
        const h = JSON.parse(raw);
        const promo = await issuePromo({ meetupId: ticket.meetupId, bucket: ticket.bucket || 'default', rid: h.rid });
        try {
          const url = process.env.N8N_URL && `${process.env.N8N_URL}/webhook/waitlist-notify`;
          if (url) {
            await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                meetupId: ticket.meetupId,
                bucket: ticket.bucket || 'default',
                user: h.user,
                promo
              })
            });
            console.log('Waitlist notification sent to:', url);
          }
        } catch (notifyError) {
          console.warn('Failed to send waitlist notification:', notifyError);
        }
      }
    } else {
      await decPaid(ticket.meetupId, ticket.bucket || 'default');
      
      // 자동 승급: 대기열 맨 앞 사용자에게 알림 (버킷별)
      const head = await wlShift(ticket.meetupId, ticket.bucket || 'default');
      if (head) {
        console.log('Promoting waitlist user:', head.id, 'for meetup:', ticket.meetupId);
        
        // n8n 등으로 알림 전달
        try {
          const url = process.env.N8N_URL && `${process.env.N8N_URL}/webhook/waitlist-notify`;
          if (url) {
            await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                meetupId: ticket.meetupId,
                reservationId: head.id,
                user: head.user,
                promotedAt: Date.now()
              })
            });
            console.log('Waitlist notification sent to:', url);
          }
        } catch (notifyError) {
          console.warn('Failed to send waitlist notification:', notifyError);
        }
      }
    }
    
    return updatedTicket;
  }

  // 유료 티켓은 결제사별 취소 API 호출
  const provider = ticket.payment?.provider;
  
  try {
    if (provider === 'toss') {
      await tossCancel(ticket, reason);
    } else if (provider === 'portone') {
      await portoneCancel(ticket, reason);
    } else {
      throw new Error(`Unknown payment provider: ${provider}`);
    }

    // 취소 성공 시 티켓 상태 업데이트
    ticket.state = 'cancelled';
    ticket.cancelledAt = Date.now();
    ticket.cancellation = {
      provider,
      reason,
      actor,
      cancelledAt: Date.now()
    };

    console.log('Ticket cancelled successfully:', ticket.id, provider);
    const updatedTicket = await writeTicket(ticket);
    
    // 유료 티켓이었던 경우 카운트 감소 (버킷별)
    const redis = getRedis();
    if (redis) {
      const raw = await cancelAndPromote({ meetupId: ticket.meetupId, bucket: ticket.bucket || 'default' });
      if (raw) {
        const h = JSON.parse(raw);
        const promo = await issuePromo({ meetupId: ticket.meetupId, bucket: ticket.bucket || 'default', rid: h.rid });
        try {
          const url = process.env.N8N_URL && `${process.env.N8N_URL}/webhook/waitlist-notify`;
          if (url) {
            await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                meetupId: ticket.meetupId,
                bucket: ticket.bucket || 'default',
                user: h.user,
                promo
              })
            });
            console.log('Waitlist notification sent to:', url);
          }
        } catch (notifyError) {
          console.warn('Failed to send waitlist notification:', notifyError);
        }
      }
    } else {
      if ((ticket.amount || 0) > 0) {
        await decPaid(ticket.meetupId, ticket.bucket || 'default');
      }
      
      // 자동 승급: 대기열 맨 앞 사용자에게 알림 (버킷별)
      const head = await wlShift(ticket.meetupId, ticket.bucket || 'default');
      if (head) {
        console.log('Promoting waitlist user:', head.id, 'for meetup:', ticket.meetupId);
        
        // n8n 등으로 알림 전달 (이메일/카톡 봇 등)
        try {
          const url = process.env.N8N_URL && `${process.env.N8N_URL}/webhook/waitlist-notify`;
          if (url) {
            await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                meetupId: ticket.meetupId,
                reservationId: head.id,
                user: head.user,
                promotedAt: Date.now()
              })
            });
            console.log('Waitlist notification sent to:', url);
          }
        } catch (notifyError) {
          console.warn('Failed to send waitlist notification:', notifyError);
        }
      }
    }
    
    return updatedTicket;
  } catch (e) {
    console.error('Failed to cancel ticket:', ticket.id, e);
    throw e;
  }
}

/**
 * Toss 결제 취소
 * @param {Object} ticket - 티켓 객체
 * @param {string} reason - 취소 사유
 */
async function tossCancel(ticket, reason) {
  // Toss는 paymentKey 기반 취소 API 사용
  const paymentKey = ticket.payment?.payload?.paymentKey;
  if (!paymentKey) {
    throw new Error('Missing paymentKey for Toss cancellation');
  }

  const url = `https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`;
  const auth = 'Basic ' + Buffer.from(`${process.env.TOSS_SECRET_KEY}:`).toString('base64');
  
  const body = {
    cancelReason: reason || 'user cancel'
  };

  console.log('Calling Toss cancel API:', url, body);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': auth,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Toss cancel failed: ${response.status} ${errorData.message || response.statusText}`);
  }

  const result = await response.json();
  console.log('Toss cancellation successful:', result);
  return result;
}

/**
 * PortOne 결제 취소
 * @param {Object} ticket - 티켓 객체
 * @param {string} reason - 취소 사유
 */
async function portoneCancel(ticket, reason) {
  // PortOne는 paymentId 기반 취소 API 사용
  const paymentId = ticket.payment?.payload?.paymentId;
  if (!paymentId) {
    throw new Error('Missing paymentId for PortOne cancellation');
  }

  const url = `https://api.portone.io/payments/${paymentId}/cancel`;
  
  const body = {
    reason: reason || 'user cancel'
  };

  console.log('Calling PortOne cancel API:', url, body);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PORTONE_API_SECRET}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`PortOne cancel failed: ${response.status} ${errorData.message || response.statusText}`);
  }

  const result = await response.json();
  console.log('PortOne cancellation successful:', result);
  return result;
}

/**
 * 부분 환불 처리 (미래 확장용)
 * @param {Object} ticket - 티켓 객체
 * @param {number} amount - 환불 금액
 * @param {string} reason - 환불 사유
 */
export async function partialRefund(ticket, amount, reason) {
  // TODO: 부분 환불 로직 구현
  console.log('Partial refund not implemented yet:', ticket.id, amount, reason);
  throw new Error('Partial refund not implemented');
}

/**
 * 취소 가능 여부 확인 (환불 수수료 포함)
 * @param {Object} ticket - 티켓 객체
 * @param {number} now - 현재 시간
 * @returns {Object} 취소 가능 여부와 수수료 정보
 */
export function getCancellationInfo(ticket, now = Date.now()) {
  const canCancel = (ticket.amount || 0) > 0 && ticket.state !== 'checkedIn' && ticket.state !== 'cancelled';
  
  if (!canCancel) {
    return {
      canCancel: false,
      reason: ticket.state === 'checkedIn' ? 'already_checked_in' : 
              ticket.state === 'cancelled' ? 'already_cancelled' : 'free_ticket'
    };
  }

  const start = ticket.eventStart || now + 999999;
  const gapHours = (start - now) / 3_600_000;
  const limit = Number(process.env.CANCEL_HOURS_BEFORE || 1);

  if (gapHours < limit) {
    return {
      canCancel: false,
      reason: 'too_late',
      hoursLeft: gapHours
    };
  }

  // 환불 수수료 계산 (예시)
  let refundFee = 0;
  if (gapHours < 24) {
    refundFee = Math.floor(ticket.amount * 0.1); // 10% 수수료
  }

  return {
    canCancel: true,
    refundAmount: ticket.amount - refundFee,
    refundFee,
    hoursLeft: gapHours
  };
}
