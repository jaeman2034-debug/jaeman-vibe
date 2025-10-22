export type AvStatus = 'available' | 'unavailable' | 'tentative';

export interface AvSlot {
  startAt: number;
  endAt: number;
  status: AvStatus;
  note?: string;
}

export interface OfficialAvailability {
  uid: string;
  clubId: string;
  slots: AvSlot[];
  preferences?: {
    roles?: string[];
    regions?: string[];
    maxPerDay?: number;
  };
}

export interface PayoutRule {
  role: string;
  amountKRW: number;
}
