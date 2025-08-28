import { addDoc, collection, doc, increment, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
export async function submitReview(threadId, targetId, stars, tags) { const u = auth.currentUser; if (!u)
    throw new Error('로그?�이 ?�요?�니??'); await addDoc(collection(db, 'reviews'), { threadId, writerId: u.uid, targetId, stars, tags, createdAt: serverTimestamp() }); await setDoc(doc(db, 'profiles', targetId), { stats: { trades: increment(1), starsSum: increment(stars), pos: increment(stars >= 4 ? 1 : 0), neg: increment(stars <= 2 ? 1 : 0) } }, { merge: true }); }
export function calcTemperature(stats) { if (!stats || stats.trades <= 0)
    return 36.5; const avg = stats.starsSum / stats.trades; } // 1~5  let temp = 36.5 + (stats.pos*1.0) - (stats.neg*2.0) + (avg - 3) * 5; // 가중치 ?�닝 가??    return Math.max(0, Math.min(99, Math.round(temp*10)/10));}
