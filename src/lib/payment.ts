import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();

// ?�전결제 체크?�웃 ?�작
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
    
    // Stripe Checkout ?�이지�??�동
    window.location.href = checkoutUrl;
    
    return { success: true, checkoutUrl };
  } catch (error: any) {
    console.error("체크?�웃 ?�작 ?�패:", error);
    
    if (error.code === "functions/failed-precondition" && error.message === "PREPAY_NOT_REQUIRED") {
      throw new Error("?�전결제가 ?�요?��? ?�습?�다.");
    }
    
    throw new Error(`결제 ?�작 ?�패: ${error.message || '?????�는 ?�류'}`);
  }
}

// 결제 ?�인 �??�약 ?�료
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
    console.error("결제 ?�인 ?�패:", error);
    throw new Error(`결제 ?�인 ?�패: ${error.message || '?????�는 ?�류'}`);
  }
}

// 결제 ?�태 ?�인
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
      error: error.message || '?????�는 ?�류' 
    };
  }
}

// 결제 금액 ?�맷??
export function formatPaymentAmount(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW'
  }).format(amount);
}

// 결제 ?�류 메시지 변??
export function getPaymentErrorMessage(errorCode: string): string {
  const errorMessages: Record<string, string> = {
    'PREPAY_REQUIRED': '?�뢰?��? ??�� ?�전결제가 ?�요?�니??',
    'PAYMENT_NOT_COMPLETED': '결제가 ?�료?��? ?�았?�니??',
    'SESSION_OWNER_MISMATCH': '결제 ?�션 ?�보가 ?�치?��? ?�습?�다.',
    'PAYMENT_SESSION_NOT_FOUND': '결제 ?�션??찾을 ???�습?�다.',
    'SLOT_UNAVAILABLE': '?�당 ?�롯???�약?????�습?�다.',
    'STRIPE_ERROR': '결제 ?�스???�류가 발생?�습?�다.',
    'default': '결제 처리 �??�류가 발생?�습?�다.'
  };
  
  return errorMessages[errorCode] || errorMessages['default'];
}
