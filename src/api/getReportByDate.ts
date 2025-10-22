// ?�� Firestore 리포??조회 API - 천재 모드 4?�계
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ?�정 ?�짜??리포??조회
export async function getReportByDate(dateId: string) {
  try {
    const ref = doc(db, 'adminReports', dateId);
    const snap = await getDoc(ref);
    
    if (snap.exists()) {
      const data = snap.data();
      console.log(`??${dateId} 리포??조회 ?�공:`, data);
      return {
        id: dateId,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date()
      };
    } else {
      console.log(`??${dateId} 리포?��? 찾을 ???�습?�다.`);
      return null;
    }
  } catch (error) {
    console.error(`??${dateId} 리포??조회 ?�패:`, error);
    return null;
  }
}

// 최신 리포??조회
export async function getLatestReport() {
  try {
    const q = query(
      collection(db, 'adminReports'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const data = doc.data();
      console.log('??최신 리포??조회 ?�공:', data);
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date()
      };
    } else {
      console.log('???�?�된 리포?��? ?�습?�다.');
      return null;
    }
  } catch (error) {
    console.error('??최신 리포??조회 ?�패:', error);
    return null;
  }
}

// ?�러 ?�짜??리포??조회 (주간 리포?�용)
export async function getWeeklyReports(days: number = 7) {
  try {
    const q = query(
      collection(db, 'adminReports'),
      orderBy('createdAt', 'desc'),
      limit(days)
    );
    
    const snapshot = await getDocs(q);
    const reports = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      reports.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date()
      });
    });
    
    console.log(`??최근 ${days}??리포??조회 ?�공:`, reports.length, '�?);
    return reports;
  } catch (error) {
    console.error(`??최근 ${days}??리포??조회 ?�패:`, error);
    return [];
  }
}

// ?�정 ?�계 ?�보 추출
export function extractStatFromReport(report: any, statType: string): string {
  if (!report || !report.kpis) {
    return '?�이?��? 찾을 ???�습?�다.';
  }

  const kpis = report.kpis;
  
  switch (statType) {
    case 'users':
      const userKpi = kpis.find((k: any) => 
        k.label.includes('가??) || k.label.includes('user') || k.label.includes('?�원')
      );
      return userKpi ? `${userKpi.label}: ${userKpi.value}` : '가?�자 ?�보�?찾을 ???�습?�다.';
      
    case 'transactions':
      const transKpi = kpis.find((k: any) => 
        k.label.includes('거래') || k.label.includes('transaction')
      );
      return transKpi ? `${transKpi.label}: ${transKpi.value}` : '거래 ?�보�?찾을 ???�습?�다.';
      
    case 'responses':
      const respKpi = kpis.find((k: any) => 
        k.label.includes('?�답') || k.label.includes('response')
      );
      return respKpi ? `${respKpi.label}: ${respKpi.value}` : '?�답 ?�보�?찾을 ???�습?�다.';
      
    case 'messages':
      const msgKpi = kpis.find((k: any) => 
        k.label.includes('메시지') || k.label.includes('message')
      );
      return msgKpi ? `${msgKpi.label}: ${msgKpi.value}` : '메시지 ?�보�?찾을 ???�습?�다.';
      
    default:
      return report.summary || '?�약 ?�보�?찾을 ???�습?�다.';
  }
}

// 리포???�약 ?�성
export function generateReportSummary(report: any, action: string, statType: string): string {
  if (!report) {
    return '?�청?�신 리포?��? 찾을 ???�습?�다.';
  }

  const dateStr = new Date(report.createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  if (action === 'count' && statType !== 'all') {
    const statInfo = extractStatFromReport(report, statType);
    return `${dateStr} ${statInfo}?�니??`;
  } else if (action === 'summary') {
    return `${dateStr} 리포???�약: ${report.summary}`;
  } else {
    return `${dateStr} 리포?�입?�다. ${report.summary}`;
  }
}
