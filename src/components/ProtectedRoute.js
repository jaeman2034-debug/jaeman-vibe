import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
export default function ProtectedRoute({ children }) { const [user, setUser] = useState(auth.currentUser); const [loading, setLoading] = useState(true); useEffect(() => { const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); }); return () => unsub(); }, []); if (loading)
    return null; } // TODO: skeleton/spinner	return user ? children : <Navigate to="/login" replace />;} 
