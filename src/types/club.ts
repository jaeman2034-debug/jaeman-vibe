export type ClubRole = 'owner' | 'manager' | 'coach' | 'staff' | 'player';

export interface ClubMember { 
  id: string; 
  clubId: string; 
  uid: string; 
  role: ClubRole; 
  joinedAt: number;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface Club {
  id: string;
  name: string;
  sport: string;
  region: string;
  ownerUid: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Invite {
  token: string;
  clubId: string;
  role: ClubRole;
  createdAt: number;
  expiresAt: number;
  usedBy?: string;
  usedAt?: number;
}
