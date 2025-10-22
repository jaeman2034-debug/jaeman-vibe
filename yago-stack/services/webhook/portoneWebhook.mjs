import * as PortOne from '@portone/server-sdk';
import { alreadyProcessed } from './utils/idempotency.mjs';

const client = PortOne.PortOneClient(process.env.PORTONE_API_SECRET);

/**
 * PortOne 웹훅 처리
 * - 표준 Webhooks 시그니처 검증
 * - 아이템포턴시 체크
 * - 결제 상태 동기화
 */
export async function portoneWebhook(req, res) {
  try {
    // 1) 서명 검증 (표준 Webhooks 규격)
    const event = await PortOne.Webhook.verify(
      process.env.PORTONE_WEBHOOK_SECRET, 
      req.body, 
      req.headers
    );

    console.log('PortOne webhook verified:', event.type, event.data);

    // 2) 아이템포턴시 키 (transactionId | paymentId + timestamp)
    const data = event.data || {};
    const idKey = data.transactionId || data.paymentId || `evt:${event.type}:${event.timestamp}`;
    
    if (await alreadyProcessed('portone:' + idKey)) {
      console.log('PortOne webhook already processed:', idKey);
      return res.status(200).end();
    }

    // 3) 결제 단건 조회로 정합성 확인 (금액/상태)
    if ('paymentId' in data) {
      const { paymentId } = data;
      
      try {
        const payment = await client.payment.getPayment({ paymentId });
        if (!payment) {
          console.warn('PortOne payment not found:', paymentId);
          return res.status(200).end(); // 존재하지 않으면 무시
        }

        console.log('PortOne payment retrieved:', payment.status, payment.amount);

        // TODO: 내부 주문과 금액/상태 비교
        // const order = await getInternalOrder(paymentId);
        // if (order && order.amount !== payment.amount.total) {
        //   console.error('PortOne amount mismatch:', order.amount, payment.amount.total);
        //   return res.status(400).json({ error: 'amount mismatch' });
        // }

        // 4) 결제 상태별 처리
        switch (payment.status) {
          case 'PAID':
            console.log('PortOne payment completed:', paymentId);
            // 결제 완료 처리: 티켓 발급/상태 전환 등
            await handlePaymentCompleted(paymentId, payment);
            break;
            
          case 'CANCELLED':
          case 'PARTIAL_CANCELLED':
            console.log('PortOne payment cancelled:', paymentId);
            // 취소/부분취소 처리
            await handlePaymentCancelled(paymentId, payment);
            break;
            
          case 'VIRTUAL_ACCOUNT_ISSUED':
            console.log('PortOne virtual account issued:', paymentId);
            // 가상계좌 발급 처리 (필요시)
            await handleVirtualAccountIssued(paymentId, payment);
            break;
            
          case 'FAILED':
            console.log('PortOne payment failed:', paymentId);
            await handlePaymentFailed(paymentId, payment);
            break;
            
          default:
            console.log('PortOne payment status:', payment.status, paymentId);
        }
      } catch (e) {
        console.error('PortOne payment retrieval failed:', e);
        return res.status(500).json({ error: 'payment retrieval failed' });
      }
    }

    return res.status(200).end();
  } catch (e) {
    // 서명 검증 실패 등 → 400
    console.error('PortOne webhook verification failed:', e);
    return res.status(400).json({ ok: false, error: e?.message || 'verify failed' });
  }
}

/**
 * 결제 완료 처리
 */
async function handlePaymentCompleted(paymentId, payment) {
  try {
    // TODO: 내부 주문 시스템과 연동
    // const order = await getInternalOrder(paymentId);
    // if (order) {
    //   await markOrderAsPaid(order.id, {
    //     provider: 'portone',
    //     paymentId,
    //     amount: payment.amount.total,
    //     currency: payment.amount.currency,
    //     paidAt: payment.paidAt
    //   });
    // }
    
    console.log('Payment completed:', paymentId, payment.amount);
  } catch (e) {
    console.error('Failed to handle payment completion:', e);
  }
}

/**
 * 결제 취소 처리
 */
async function handlePaymentCancelled(paymentId, payment) {
  try {
    // TODO: 내부 주문 시스템과 연동
    // const order = await getInternalOrder(paymentId);
    // if (order) {
    //   await markOrderAsCancelled(order.id, {
    //     provider: 'portone',
    //     paymentId,
    //     reason: payment.cancelReason,
    //     cancelledAt: payment.cancelledAt
    //   });
    // }
    
    console.log('Payment cancelled:', paymentId, payment.cancelReason);
  } catch (e) {
    console.error('Failed to handle payment cancellation:', e);
  }
}

/**
 * 가상계좌 발급 처리
 */
async function handleVirtualAccountIssued(paymentId, payment) {
  try {
    // TODO: 가상계좌 정보 저장/알림
    console.log('Virtual account issued:', paymentId, payment.virtualAccount);
  } catch (e) {
    console.error('Failed to handle virtual account issuance:', e);
  }
}

/**
 * 결제 실패 처리
 */
async function handlePaymentFailed(paymentId, payment) {
  try {
    // TODO: 결제 실패 처리
    console.log('Payment failed:', paymentId, payment.failureReason);
  } catch (e) {
    console.error('Failed to handle payment failure:', e);
  }
}
