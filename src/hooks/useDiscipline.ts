import { doc, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';

interface DisciplineData {
  strikeCount?: number;
  strikeUntil?: any;
}

export function useDiscipline() {
  const [discipline, setDiscipline] = useState<DisciplineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const uid = getAuth().currentUser?.uid;
    if (!uid) {
      setDiscipline(null);
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(
      doc(db, 'users', uid),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setDiscipline(data?.discipline || { strikeCount: 0 });
        } else {
          setDiscipline({ strikeCount: 0 });
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching discipline data:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // 페널티로 인한 참가 제한 여부 확인
  const isBanned = () => {
    if (!discipline) return false;
    
    const strikeCount = discipline.strikeCount || 0;
    const strikeUntil = discipline.strikeUntil;
    
    // 3회 이상 스트라이크 또는 제한 기간 중
    if (strikeCount >= 3) return true;
    
    // strikeUntil이 있고 현재 시간이 제한 기간 내
    if (strikeUntil && strikeUntil.toDate && strikeUntil.toDate() > new Date()) {
      return true;
    }
    
    return false;
  };

  // 남은 제한 기간 계산 (일 단위)
  const getRemainingDays = () => {
    if (!discipline?.strikeUntil) return 0;
    
    const until = discipline.strikeUntil.toDate();
    const now = new Date();
    const diffTime = until.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  // 제한 사유 메시지
  const getBanMessage = () => {
    if (!isBanned()) return '';
    
    const strikeCount = discipline?.strikeCount || 0;
    const remainingDays = getRemainingDays();
    
    if (strikeCount >= 3) {
      if (remainingDays > 0) {
        return `노쇼 페널티로 참가 제한 중입니다. (${remainingDays}일 후 해제)`;
      } else {
        return '노쇼 페널티로 참가 제한 중입니다.';
      }
    }
    
    return '참가 제한 중입니다.';
  };

  return {
    discipline,
    loading,
    error,
    isBanned: isBanned(),
    remainingDays: getRemainingDays(),
    banMessage: getBanMessage(),
    strikeCount: discipline?.strikeCount || 0
  };
}
