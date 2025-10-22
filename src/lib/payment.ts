import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();

// ?¬ì „ê²°ì œ ì²´í¬?„ì›ƒ ?œì‘
export async function startPrepayCheckout(params: {
  facilityId: string;
  slotId: string;
  facilityName: string;
  slotTime: string;
  amount: number;
}) {
  try {
    const createCheckoutSession = httpsCallable(functions, 'createCheckoutSessionFn');
    const result = await createCheckoutSession(params);
    
    const { checkoutUrl } = result.data as { checkoutUrl: string };
    
    // Stripe Checkout ?˜ì´ì§€ë¡??´ë™
    window.location.href = checkoutUrl;
    
    return { success: true, checkoutUrl };
  } catch (error: any) {
    console.error("ì²´í¬?„ì›ƒ ?œì‘ ?¤íŒ¨:", error);
    
    if (error.code === "functions/failed-precondition" && error.message === "PREPAY_NOT_REQUIRED") {
      throw new Error("?¬ì „ê²°ì œê°€ ?„ìš”?˜ì? ?ŠìŠµ?ˆë‹¤.");
    }
    
    throw new Error(`ê²°ì œ ?œì‘ ?¤íŒ¨: ${error.message || '?????†ëŠ” ?¤ë¥˜'}`);
  }
}

// ê²°ì œ ?•ì¸ ë°??ˆì•½ ?„ë£Œ
export async function confirmCheckoutAndReserve(sessionId: string) {
  try {
    const confirmSession = httpsCallable(functions, 'confirmSessionFn');
    const result = await confirmSession({ sessionId });
    
    const { reservationId, message } = result.data as { 
      reservationId: string; 
      message: string; 
    };
    
    return { 
      success: true, 
      reservationId, 
      message 
    };
  } catch (error: any) {
    console.error("ê²°ì œ ?•ì¸ ?¤íŒ¨:", error);
    throw new Error(`ê²°ì œ ?•ì¸ ?¤íŒ¨: ${error.message || '?????†ëŠ” ?¤ë¥˜'}`);
  }
}

// ê²°ì œ ?íƒœ ?•ì¸
export async function checkPaymentStatus(sessionId: string) {
  try {
    const confirmSession = httpsCallable(functions, 'confirmSessionFn');
    const result = await confirmSession({ sessionId });
    
    return { 
      success: true, 
      data: result.data 
    };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || '?????†ëŠ” ?¤ë¥˜' 
    };
  }
}

// ê²°ì œ ê¸ˆì•¡ ?¬ë§·??
export function formatPaymentAmount(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW'
  }).format(amount);
}

// ê²°ì œ ?¤ë¥˜ ë©”ì‹œì§€ ë³€??
export function getPaymentErrorMessage(errorCode: string): string {
  const errorMessages: Record<string, string> = {
    'PREPAY_REQUIRED': '? ë¢°?„ê? ??•„ ?¬ì „ê²°ì œê°€ ?„ìš”?©ë‹ˆ??',
    'PAYMENT_NOT_COMPLETED': 'ê²°ì œê°€ ?„ë£Œ?˜ì? ?Šì•˜?µë‹ˆ??',
    'SESSION_OWNER_MISMATCH': 'ê²°ì œ ?¸ì…˜ ?•ë³´ê°€ ?¼ì¹˜?˜ì? ?ŠìŠµ?ˆë‹¤.',
    'PAYMENT_SESSION_NOT_FOUND': 'ê²°ì œ ?¸ì…˜??ì°¾ì„ ???†ìŠµ?ˆë‹¤.',
    'SLOT_UNAVAILABLE': '?´ë‹¹ ?¬ë¡¯???ˆì•½?????†ìŠµ?ˆë‹¤.',
    'STRIPE_ERROR': 'ê²°ì œ ?œìŠ¤???¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.',
    'default': 'ê²°ì œ ì²˜ë¦¬ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.'
  };
  
  return errorMessages[errorCode] || errorMessages['default'];
}
