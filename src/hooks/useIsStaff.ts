import { doc, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';

export function useIsStaff(eventId?: string) {
  const [ok, setOk] = useState<boolean>(false);
  
  useEffect(() => {
    const uid = getAuth().currentUser?.uid;
    if (!eventId || !uid) return setOk(false);
    
    const unsub = onSnapshot(
      doc(db, `events/${eventId}/roles/${uid}`), 
      s => setOk(s.exists)
    );
    
    return () => unsub();
  }, [eventId]);
  
  return ok;
}