import { alreadyProcessed } from './utils/idempotency.mjs';
import fetch from 'node-fetch';

/**
 * Toss 웹훅 처리
 * - 결제수단별 검증 전략
 * - 가상계좌: secret 교차검증
 * - 일반결제: 승인 API 조회로 상태 교차확인
 */
export async function tossWebhook(req, res) {
  try {
    const evt = req.body || {};
    const { eventType, data } = evt; // PAYMENT_STATUS_CHANGED | DEPOSIT_CALLBACK | ...
    
    console.log('Toss webhook received:', eventType, data);

    // 1) 아이템포턴시 키 구성 (orderId + status + createdAt)
    const idKey = `toss:${eventType}:${data?.orderId || data?.transactionKey || 'n/a'}:${evt.createdAt}`;
    
    if (await alreadyProcessed(idKey)) {
      console.log('Toss webhook already processed:', idKey);
      return res.status(200).end();
    }

    // 2) 결제수단별 검증
    let isValid = false;
    
    if (eventType === 'DEPOSIT_CALLBACK') {
      // 가상계좌: webhook.data.secret 과 결제 객체의 secret 이 일치해야 정상
      isValid = await validateVirtualAccountDeposit(data);
    } else if (eventType === 'PAYMENT_STATUS_CHANGED') {
      // 일반 결제: Toss 결제 조회로 상태 교차확인 (권장)
      isValid = await validatePaymentStatus(data);
    } else {
      // 기타 이벤트는 기본적으로 유효하다고 간주
      isValid = true;
    }

    if (!isValid) {
      console.error('Toss webhook validation failed:', eventType, data);
      return res.status(400).json({ ok: false, error: 'validation failed' });
    }

    // 3) 비즈 로직: status 에 따라 발급/취소 반영
    await handleTossEvent(eventType, data);

    return res.status(200).end();
  } catch (e) {
    console.error('Toss webhook processing failed:', e);
    return res.status(400).json({ ok: false, error: e?.message || 'toss webhook failed' });
  }
}

/**
 * 가상계좌 입금 검증
 */
async function validateVirtualAccountDeposit(data) {
  try {
    const { orderId, secret: secretFromWebhook } = data;
    
    if (!secretFromWebhook) {
      console.error('Missing secret in VA deposit webhook:', orderId);
      return false;
    }

    // TODO: 주문 생성/승인 단계에서 받은 Payment.secret 을 orderId 키로 보관해둔다.
    const expectedSecret = await getOrderSecret(orderId);
    
    if (!expectedSecret) {
      console.error('No stored secret found for order:', orderId);
      return false;
    }

    const isValid = expectedSecret === secretFromWebhook;
    console.log('VA deposit validation:', orderId, isValid);
    
    return isValid;
  } catch (e) {
    console.error('VA deposit validation error:', e);
    return false;
  }
}

/**
 * 일반 결제 상태 검증
 */
async function validatePaymentStatus(data) {
  try {
    const { orderId, status } = data;
    
    if (!orderId || !status) {
      console.error('Missing orderId or status in payment webhook:', data);
      return false;
    }

    // TODO: Toss 결제 조회 API 호출
    // const payment = await tossApiGetPaymentByOrderId(orderId);
    // if (!payment || payment.status !== status) {
    //   console.error('Payment status mismatch:', orderId, status, payment?.status);
    //   return false;
    // }

    // 임시로 항상 유효하다고 간주 (실제 구현 시 위 로직 사용)
    console.log('Payment status validation:', orderId, status);
    return true;
  } catch (e) {
    console.error('Payment status validation error:', e);
    return false;
  }
}

/**
 * Toss 이벤트 처리
 */
async function handleTossEvent(eventType, data) {
  try {
    switch (eventType) {
      case 'DEPOSIT_CALLBACK':
        console.log('Virtual account deposit received:', data.orderId, data.secret);
        await handleVirtualAccountDeposit(data);
        break;
        
      case 'PAYMENT_STATUS_CHANGED':
        console.log('Payment status changed:', data.orderId, data.status);
        await handlePaymentStatusChange(data);
        break;
        
      default:
        console.log('Unhandled Toss event type:', eventType);
    }
  } catch (e) {
    console.error('Failed to handle Toss event:', e);
  }
}

/**
 * 가상계좌 입금 처리
 */
async function handleVirtualAccountDeposit(data) {
  try {
    const { orderId, secret, amount } = data;
    
    // TODO: 내부 주문 시스템과 연동
    // const order = await getInternalOrder(orderId);
    // if (order) {
    //   await markOrderAsPaid(order.id, {
    //     provider: 'toss',
    //     orderId,
    //     amount,
    //     secret,
    //     paidAt: Date.now()
    //   });
    // }
    
    console.log('VA deposit processed:', orderId, amount);
  } catch (e) {
    console.error('Failed to handle VA deposit:', e);
  }
}

/**
 * 결제 상태 변경 처리
 */
async function handlePaymentStatusChange(data) {
  try {
    const { orderId, status } = data;
    
    switch (status) {
      case 'DONE':
        console.log('Toss payment completed:', orderId);
        await handleTossPaymentCompleted(orderId, data);
        break;
        
      case 'CANCELED':
        console.log('Toss payment cancelled:', orderId);
        await handleTossPaymentCancelled(orderId, data);
        break;
        
      default:
        console.log('Toss payment status:', status, orderId);
    }
  } catch (e) {
    console.error('Failed to handle payment status change:', e);
  }
}

/**
 * Toss 결제 완료 처리
 */
async function handleTossPaymentCompleted(orderId, data) {
  try {
    // TODO: 내부 주문 시스템과 연동
    console.log('Toss payment completed:', orderId, data.amount);
  } catch (e) {
    console.error('Failed to handle Toss payment completion:', e);
  }
}

/**
 * Toss 결제 취소 처리
 */
async function handleTossPaymentCancelled(orderId, data) {
  try {
    // TODO: 내부 주문 시스템과 연동
    console.log('Toss payment cancelled:', orderId, data.cancelReason);
  } catch (e) {
    console.error('Failed to handle Toss payment cancellation:', e);
  }
}

/**
 * 주문별 secret 조회 (TODO: 실제 구현 필요)
 */
async function getOrderSecret(orderId) {
  // TODO: 실제 구현 - DB나 캐시에서 주문별 secret 조회
  // 예시: Redis, MongoDB, 파일 시스템 등
  console.log('Getting secret for order:', orderId);
  return null; // 임시로 null 반환
}

/**
 * 주문별 secret 저장 (TODO: 실제 구현 필요)
 */
async function saveOrderSecret(orderId, secret) {
  // TODO: 실제 구현 - 주문 생성/승인 시 secret 저장
  console.log('Saving secret for order:', orderId, secret);
}
