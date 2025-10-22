// ?§  AI ì§ˆì˜ ??- ì²œì¬ ëª¨ë“œ 5?¨ê³„ (GPT ë¶„ì„)
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
    console.log('?§  AI ë¶„ì„ ?œì‘:', userQuery);

    // Firestore?ì„œ ìµœê·¼ 7??ë¦¬í¬??ê°€?¸ì˜¤ê¸?    const snapshot = await getDocs(
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

    console.log('?“Š ì¡°íšŒ??ë¦¬í¬??', reports.length, 'ê°?);

    // GPT?ê²Œ ?”ì•½ ë¶„ì„ ?”ì²­
    const systemPrompt = `?ˆëŠ” ê´€ë¦¬ì ë¦¬í¬??ë¶„ì„ ë³´ì¡° AI?? 
?¬ìš©?ì˜ ì§ˆë¬¸???€??Firestore ?°ì´?°ë? ë¶„ì„?˜ê³  ?¤ìŒ???œê³µ?´ì¤˜:

1. ?°ì´???”ì•½ ë°??µê³„
2. ?¸ë Œ??ë¶„ì„ (ì¦ê?/ê°ì†Œ/ë³€?”ìœ¨)
3. ?œê°???¬ì¸??(?´ë–¤ ì°¨íŠ¸ê°€ ?„ìš”?œì?)
4. ?Œì„± ?´ì„¤???ì—°?¤ëŸ¬???œêµ­???‘ë‹µ

?‘ë‹µ ?•ì‹:
- ?”ì•½: [?µì‹¬ ?µê³„ ?”ì•½]
- ?¸ë Œ?? [ì¦ê° ì¶”ì´ ë¶„ì„]
- ?œê°?? [ì°¨íŠ¸ ?€??ë°??¬ì¸??
- ?´ì„¤: [?Œì„±?¼ë¡œ ?½ì„ ?ì—°?¤ëŸ¬???œêµ­???¤ëª…]`;

    const userPrompt = `?¬ìš©??ì§ˆë¬¸: "${userQuery}"

Firestore ?°ì´??
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
    console.log('?¤– GPT ?‘ë‹µ:', reply);

    // ì°¨íŠ¸ ?°ì´???ì„±
    const chartData = generateChartData(reports);

    // ?¸ì‚¬?´íŠ¸ ì¶”ì¶œ
    const insights = extractInsights(reply, reports);

    return {
      reply,
      reports,
      chartData,
      insights
    };

  } catch (error) {
    console.error('??AI ë¶„ì„ ?¤íŒ¨:', error);
    return {
      reply: 'ì£„ì†¡?©ë‹ˆ?? ?°ì´??ë¶„ì„ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.',
      reports: [],
      chartData: [],
      insights: {
        trend: 'ë¶„ì„ ë¶ˆê?',
        comparison: '?°ì´???†ìŒ',
        recommendation: '?¤ì‹œ ?œë„?´ì£¼?¸ìš”'
      }
    };
  }
}

// ì°¨íŠ¸ ?°ì´???ì„±
function generateChartData(reports: ReportData[]) {
  return reports.map(report => {
    const joinKpi = report.kpis?.find(k => 
      k.label.includes('ê°€??) || k.label.includes('user') || k.label.includes('?Œì›')
    );
    const tradeKpi = report.kpis?.find(k => 
      k.label.includes('ê±°ë˜') || k.label.includes('transaction') || k.label.includes('?í’ˆ')
    );
    const respKpi = report.kpis?.find(k => 
      k.label.includes('?‘ë‹µ') || k.label.includes('response')
    );

    return {
      date: report.date,
      name: new Date(report.createdAt).toLocaleDateString('ko-KR', { 
        month: 'short', 
        day: 'numeric' 
      }),
      ê°€?…ì: typeof joinKpi?.value === 'number' ? joinKpi.value : parseInt(joinKpi?.value?.toString() || '0'),
      ê±°ë˜?? typeof tradeKpi?.value === 'number' ? tradeKpi.value : parseInt(tradeKpi?.value?.toString() || '0'),
      ?‘ë‹µë¥? typeof respKpi?.value === 'string' ? parseInt(respKpi.value.replace('%', '')) : (respKpi?.value as number) || 0,
      total: (typeof joinKpi?.value === 'number' ? joinKpi.value : parseInt(joinKpi?.value?.toString() || '0')) +
             (typeof tradeKpi?.value === 'number' ? tradeKpi.value : parseInt(tradeKpi?.value?.toString() || '0'))
    };
  }).reverse(); // ? ì§œ ?œì„œ?€ë¡??•ë ¬
}

// GPT ?‘ë‹µ?ì„œ ?¸ì‚¬?´íŠ¸ ì¶”ì¶œ
function extractInsights(reply: string, reports: ReportData[]) {
  const trend = reply.includes('ì¦ê?') ? 'ì¦ê?' : reply.includes('ê°ì†Œ') ? 'ê°ì†Œ' : '?ˆì •';
  
  let comparison = 'ë¹„êµ ?°ì´???†ìŒ';
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
    comparison = `?„ì¼ ?€ë¹?${changePercent}% ë³€??;
  }

  const recommendation = reply.includes('ê°œì„ ') ? 'ê°œì„  ?„ìš”' : 
                        reply.includes('?‘í˜¸') ? '?‘í˜¸???±ê³¼' : 
                        'ì¶”ê? ë¶„ì„ ?„ìš”';

  return {
    trend,
    comparison,
    recommendation
  };
}

// ?¹ì • ì§ˆë¬¸ ?€??ë¶„ì„
export function getQueryType(query: string): string {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('ê·¸ë˜??) || lowerQuery.includes('ì°¨íŠ¸') || lowerQuery.includes('ì¶”ì„¸')) {
    return 'chart';
  } else if (lowerQuery.includes('ë¹„êµ') || lowerQuery.includes('?˜ì—ˆ') || lowerQuery.includes('ì¤„ì—ˆ')) {
    return 'comparison';
  } else if (lowerQuery.includes('?”ì•½') || lowerQuery.includes('?•ë¦¬')) {
    return 'summary';
  } else if (lowerQuery.includes('ëª?) || lowerQuery.includes('??) || lowerQuery.includes('ê°œìˆ˜')) {
    return 'count';
  } else {
    return 'general';
  }
}

// ì°¨íŠ¸ ?€??ê²°ì •
export function getChartType(queryType: string, reports: ReportData[]): string {
  if (queryType === 'chart' && reports.length > 1) {
    return 'line'; // ?¸ë Œ??ë¶„ì„???¼ì¸ ì°¨íŠ¸
  } else if (queryType === 'comparison') {
    return 'bar'; // ë¹„êµ??ë°?ì°¨íŠ¸
  } else {
    return 'line'; // ê¸°ë³¸ê°?  }
}
