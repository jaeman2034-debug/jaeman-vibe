// ?�스?�이먼츠 결제 관???�???�의

export interface TossPaymentRequest {
  facilityId: string;
  slotId: string;
  facilityName: string;
  slotTime: string;
  amount: number;
}

export interface TossPaymentSession {
  orderId: string;
  amount: number;
  successUrl: string;
  failUrl: string;
}

export interface TossPaymentConfirm {
  paymentKey: string;
  orderId: string;
  amount: number;
}

export interface TossPaymentResult {
  ok: boolean;
  reservationId?: string;
  message?: string;
  paymentData?: any;
}

export interface TossPaymentError {
  code: string;
  message: string;
  orderId?: string;
}

// ?�스?�이먼츠 결제 ?�태
export type TossPaymentStatus = 
  | 'READY'      // 결제 준�?
  | 'IN_PROGRESS' // 결제 진행�?
  | 'DONE'       // 결제 ?�료
  | 'CANCELED'   // 결제 취소
  | 'ABORTED'    // 결제 중단
  | 'FAILED';    // 결제 ?�패

// ?�스?�이먼츠 결제 방법
export type TossPaymentMethod = 
  | '카드'
  | '계좌?�체'
  | '가?�계�?
  | '?��???
  | '문화?�품�?
  | '?�서문화?�품�?
  | '게임문화?�품�?;

// ?�스?�이먼츠 결제 ?�청 ?�션
export interface TossPaymentOptions {
  amount: number;
  orderId: string;
  orderName: string;
  successUrl: string;
  failUrl: string;
  customerName?: string;
  customerEmail?: string;
  customerMobilePhone?: string;
  windowTarget?: 'iframe' | 'self' | 'popup';
  useInternationalCardOnly?: boolean;
  flowMode?: 'DEFAULT' | 'BILLING' | 'BUNDLE';
  easyPay?: string;
  discountAmount?: number;
  useEscrow?: boolean;
  taxFreeAmount?: number;
  taxExemptionAmount?: number;
}

// ?�스?�이먼츠 결제 ?�답
export interface TossPaymentResponse {
  paymentKey: string;
  orderId: string;
  orderName: string;
  method: TossPaymentMethod;
  status: TossPaymentStatus;
  requestedAt: string;
  approvedAt?: string;
  useEscrow: boolean;
  card?: {
    company: string;
    number: string;
    installmentPlanMonths: number;
    isInterestFree: boolean;
    approveNo: string;
    useCardPoint: boolean;
    cardType: string;
    ownerType: string;
    acquireStatus: string;
    amount: number;
  };
  virtualAccount?: {
    accountNumber: string;
    accountType: string;
    bankCode: string;
    customerName: string;
    dueDate: string;
    refundStatus: string;
    expired: boolean;
    settlementStatus: string;
  };
  transfer?: {
    bankCode: string;
    settlementStatus: string;
  };
  mobilePhone?: {
    customerName: string;
    settlementStatus: string;
    receiptUrl: string;
  };
  giftCertificate?: {
    approveNo: string;
    settlementStatus: string;
  };
  totalAmount: number;
  balanceAmount: number;
  suppliedAmount: number;
  vat: number;
  taxFreeAmount: number;
  taxExemptionAmount: number;
  cultureExpense: boolean;
  useDiscount: boolean;
  discount?: {
    amount: number;
  };
  useEscrow: boolean;
  escrow?: {
    amount: number;
  };
  failure?: {
    code: string;
    message: string;
  };
  cashReceipt?: {
    type: string;
    amount: number;
    taxFreeAmount: number;
    issueNumber: string;
    receiptUrl: string;
  };
  receiptUrl: string;
  currency: string;
  country: string;
  method: TossPaymentMethod;
  useEscrow: boolean;
  useDiscount: boolean;
  useCashReceipt: boolean;
  useCultureExpense: boolean;
  useTaxFreeAmount: boolean;
  useTaxExemptionAmount: boolean;
  useBalanceAmount: boolean;
  useVat: boolean;
  useSupplyAmount: boolean;
  useTotalAmount: boolean;
  useBalanceAmount: boolean;
  useVat: boolean;
  useSupplyAmount: boolean;
  useTotalAmount: boolean;
}

// ?�스?�이먼츠 결제 취소 ?�청
export interface TossPaymentCancelRequest {
  cancelReason: string;
  cancelAmount?: number;
  cancelTaxFreeAmount?: number;
  cancelVat?: number;
  cancelSupplyAmount?: number;
  refundBankCode?: string;
  refundAccountNumber?: string;
  refundHolderName?: string;
  refundEmail?: string;
  refundPhoneNumber?: string;
}

// ?�스?�이먼츠 결제 취소 ?�답
export interface TossPaymentCancelResponse {
  paymentKey: string;
  orderId: string;
  orderName: string;
  method: TossPaymentMethod;
  status: TossPaymentStatus;
  requestedAt: string;
  approvedAt?: string;
  useEscrow: boolean;
  card?: {
    company: string;
    number: string;
    installmentPlanMonths: number;
    isInterestFree: boolean;
    approveNo: string;
    useCardPoint: boolean;
    cardType: string;
    ownerType: string;
    acquireStatus: string;
    amount: number;
  };
  virtualAccount?: {
    accountNumber: string;
    accountType: string;
    bankCode: string;
    customerName: string;
    dueDate: string;
    refundStatus: string;
    expired: boolean;
    settlementStatus: string;
  };
  transfer?: {
    bankCode: string;
    settlementStatus: string;
  };
  mobilePhone?: {
    customerName: string;
    settlementStatus: string;
    receiptUrl: string;
  };
  giftCertificate?: {
    approveNo: string;
    settlementStatus: string;
  };
  totalAmount: number;
  balanceAmount: number;
  suppliedAmount: number;
  vat: number;
  taxFreeAmount: number;
  taxExemptionAmount: number;
  cultureExpense: boolean;
  useDiscount: boolean;
  discount?: {
    amount: number;
  };
  useEscrow: boolean;
  escrow?: {
    amount: number;
  };
  failure?: {
    code: string;
    message: string;
  };
  cashReceipt?: {
    type: string;
    amount: number;
    taxFreeAmount: number;
    issueNumber: string;
    receiptUrl: string;
  };
  receiptUrl: string;
  currency: string;
  country: string;
  method: TossPaymentMethod;
  useEscrow: boolean;
  useDiscount: boolean;
  useCashReceipt: boolean;
  useCultureExpense: boolean;
  useTaxFreeAmount: boolean;
  useTaxExemptionAmount: boolean;
  useBalanceAmount: boolean;
  useVat: boolean;
  useSupplyAmount: boolean;
  useTotalAmount: boolean;
  useBalanceAmount: boolean;
  useVat: boolean;
  useSupplyAmount: boolean;
  useTotalAmount: boolean;
  cancels?: Array<{
    cancelAmount: number;
    cancelReason: string;
    taxFreeAmount: number;
    taxExemptionAmount: number;
    refundableAmount: number;
    easyPayDiscountAmount: number;
    canceledAt: string;
    transactionKey: string;
    receiptKey: string;
  }>;
}
