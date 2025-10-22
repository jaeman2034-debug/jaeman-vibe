export type TicketState = 'pending' | 'paid' | 'checkedIn' | 'cancelled' | 'waitlisted';

export interface Ticket {
  id: string;
  meetupId: string;
  user: { 
    uid?: string; 
    email?: string; 
    name?: string; 
  };
  amount?: number; 
  currency?: 'KRW' | 'USD' | string;
  state: TicketState; 
  createdAt: number; 
  paidAt?: number; 
  checkedInAt?: number;
  eventStart?: number; 
  eventEnd?: number;
  bucket?: string; // 'default' | 'women' | 'u10' | ...
}

export interface TicketWithMeetup extends Ticket {
  meetup?: {
    id: string;
    title: string;
    subtitle?: string;
    venue?: {
      name: string;
      address?: string;
    };
    sport?: string;
    dateStart: number;
    dateEnd?: number;
  };
}
