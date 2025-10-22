// ?�� AI 질의 ??- 천재 모드 5?�계 (GPT 분석)
import { getDocs, collection, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

interface ReportData {
  id: string;
  summary: string;
  kpis: Array<{ label: string; value: string | number }>;
  createdAt: any;
  date: string;
}

interface AnalysisResult {
  reply: string;
  reports: ReportData[];
  chartData: any[];
  insights: {
    trend: string;
    comparison: string;
    recommendation: string;
  };
}

export async function analyzeQuery(userQuery: string): Promise<AnalysisResult> {
  try {
    console.log('?�� AI 분석 ?�작:', userQuery);

    // Firestore?�서 최근 7??리포??가?�오�?    const snapshot = await getDocs(
      query(
        collection(db, 'adminReports'),
        orderBy('createdAt', 'desc'),
        limit(7)
      )
    );

    const reports: ReportData[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date()
      };
    });

    console.log('?�� 조회??리포??', reports.length, '�?);

    // GPT?�게 ?�약 분석 ?�청
    const systemPrompt = `?�는 관리자 리포??분석 보조 AI?? 
?�용?�의 질문???�??Firestore ?�이?��? 분석?�고 ?�음???�공?�줘:

1. ?�이???�약 �??�계
2. ?�렌??분석 (증�?/감소/변?�율)
3. ?�각???�인??(?�떤 차트가 ?�요?��?)
4. ?�성 ?�설???�연?�러???�국???�답

?�답 ?�식:
- ?�약: [?�심 ?�계 ?�약]
- ?�렌?? [증감 추이 분석]
- ?�각?? [차트 ?�??�??�인??
- ?�설: [?�성?�로 ?�을 ?�연?�러???�국???�명]`;

    const userPrompt = `?�용??질문: "${userQuery}"

Firestore ?�이??
${JSON.stringify(reports.map(r => ({
  date: r.date,
  summary: r.summary,
  kpis: r.kpis
})), null, 2)}`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt },
    ];

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.4,
      max_tokens: 1000,
    });

    const reply = completion.choices[0].message?.content ?? '';
    console.log('?�� GPT ?�답:', reply);

    // 차트 ?�이???�성
    const chartData = generateChartData(reports);

    // ?�사?�트 추출
    const insights = extractInsights(reply, reports);

    return {
      reply,
      reports,
      chartData,
      insights
    };

  } catch (error) {
    console.error('??AI 분석 ?�패:', error);
    return {
      reply: '죄송?�니?? ?�이??분석 �??�류가 발생?�습?�다.',
      reports: [],
      chartData: [],
      insights: {
        trend: '분석 불�?',
        comparison: '?�이???�음',
        recommendation: '?�시 ?�도?�주?�요'
      }
    };
  }
}

// 차트 ?�이???�성
function generateChartData(reports: ReportData[]) {
  return reports.map(report => {
    const joinKpi = report.kpis?.find(k => 
      k.label.includes('가??) || k.label.includes('user') || k.label.includes('?�원')
    );
    const tradeKpi = report.kpis?.find(k => 
      k.label.includes('거래') || k.label.includes('transaction') || k.label.includes('?�품')
    );
    const respKpi = report.kpis?.find(k => 
      k.label.includes('?�답') || k.label.includes('response')
    );

    return {
      date: report.date,
      name: new Date(report.createdAt).toLocaleDateString('ko-KR', { 
        month: 'short', 
        day: 'numeric' 
      }),
      가?�자: typeof joinKpi?.value === 'number' ? joinKpi.value : parseInt(joinKpi?.value?.toString() || '0'),
      거래?? typeof tradeKpi?.value === 'number' ? tradeKpi.value : parseInt(tradeKpi?.value?.toString() || '0'),
      ?�답�? typeof respKpi?.value === 'string' ? parseInt(respKpi.value.replace('%', '')) : (respKpi?.value as number) || 0,
      total: (typeof joinKpi?.value === 'number' ? joinKpi.value : parseInt(joinKpi?.value?.toString() || '0')) +
             (typeof tradeKpi?.value === 'number' ? tradeKpi.value : parseInt(tradeKpi?.value?.toString() || '0'))
    };
  }).reverse(); // ?�짜 ?�서?��??�렬
}

// GPT ?�답?�서 ?�사?�트 추출
function extractInsights(reply: string, reports: ReportData[]) {
  const trend = reply.includes('증�?') ? '증�?' : reply.includes('감소') ? '감소' : '?�정';
  
  let comparison = '비교 ?�이???�음';
  if (reports.length >= 2) {
    const latest = reports[0];
    const previous = reports[1];
    const latestTotal = latest.kpis?.reduce((sum, kpi) => {
      const value = typeof kpi.value === 'number' ? kpi.value : parseInt(kpi.value?.toString() || '0');
      return sum + value;
    }, 0) || 0;
    
    const previousTotal = previous.kpis?.reduce((sum, kpi) => {
      const value = typeof kpi.value === 'number' ? kpi.value : parseInt(kpi.value?.toString() || '0');
      return sum + value;
    }, 0) || 0;

    const changePercent = previousTotal > 0 ? ((latestTotal - previousTotal) / previousTotal * 100).toFixed(1) : '0';
    comparison = `?�일 ?��?${changePercent}% 변??;
  }

  const recommendation = reply.includes('개선') ? '개선 ?�요' : 
                        reply.includes('?�호') ? '?�호???�과' : 
                        '추�? 분석 ?�요';

  return {
    trend,
    comparison,
    recommendation
  };
}

// ?�정 질문 ?�??분석
export function getQueryType(query: string): string {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('그래??) || lowerQuery.includes('차트') || lowerQuery.includes('추세')) {
    return 'chart';
  } else if (lowerQuery.includes('비교') || lowerQuery.includes('?�었') || lowerQuery.includes('줄었')) {
    return 'comparison';
  } else if (lowerQuery.includes('?�약') || lowerQuery.includes('?�리')) {
    return 'summary';
  } else if (lowerQuery.includes('�?) || lowerQuery.includes('??) || lowerQuery.includes('개수')) {
    return 'count';
  } else {
    return 'general';
  }
}

// 차트 ?�??결정
export function getChartType(queryType: string, reports: ReportData[]): string {
  if (queryType === 'chart' && reports.length > 1) {
    return 'line'; // ?�렌??분석???�인 차트
  } else if (queryType === 'comparison') {
    return 'bar'; // 비교??�?차트
  } else {
    return 'line'; // 기본�?  }
}
