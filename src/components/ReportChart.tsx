// ?“Š ë¦¬í¬??ì°¨íŠ¸ ì»´í¬?ŒíŠ¸ - ì²œì¬ ëª¨ë“œ 5?¨ê³„
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface ChartData {
  date: string;
  name: string;
  ê°€?…ì: number;
  ê±°ë˜?? number;
  ?‘ë‹µë¥? number;
  total: number;
}

interface ReportChartProps {
  data: ChartData[];
  type?: 'line' | 'bar' | 'pie';
  title?: string;
  insights?: {
    trend: string;
    comparison: string;
    recommendation: string;
  };
}

const COLORS = ['#82ca9d', '#8884d8', '#ffc658', '#ff7300', '#00ff00'];

export default function ReportChart({ 
  data, 
  type = 'line', 
  title = '?°ì´???¸ë Œ??,
  insights 
}: ReportChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-64 bg-white/5 rounded-2xl border border-white/10 p-4 flex items-center justify-center">
        <p className="text-white/60">ì°¨íŠ¸ ?°ì´?°ê? ?†ìŠµ?ˆë‹¤.</p>
      </div>
    );
  }

  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid stroke="#333" strokeDasharray="3 3" />
        <XAxis 
          dataKey="name" 
          stroke="#aaa" 
          fontSize={12}
          tick={{ fill: '#aaa' }}
        />
        <YAxis 
          stroke="#aaa" 
          fontSize={12}
          tick={{ fill: '#aaa' }}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '8px',
            color: '#fff'
          }}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="ê°€?…ì" 
          stroke="#82ca9d" 
          strokeWidth={3}
          dot={{ fill: '#82ca9d', strokeWidth: 2, r: 4 }}
          name="? ê·œ ê°€?…ì"
        />
        <Line 
          type="monotone" 
          dataKey="ê±°ë˜?? 
          stroke="#8884d8" 
          strokeWidth={3}
          dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
          name="ê±°ë˜??
        />
        <Line 
          type="monotone" 
          dataKey="?‘ë‹µë¥? 
          stroke="#ffc658" 
          strokeWidth={3}
          dot={{ fill: '#ffc658', strokeWidth: 2, r: 4 }}
          name="?‘ë‹µë¥?(%)"
        />
      </LineChart>
    </ResponsiveContainer>
  );

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid stroke="#333" strokeDasharray="3 3" />
        <XAxis 
          dataKey="name" 
          stroke="#aaa" 
          fontSize={12}
          tick={{ fill: '#aaa' }}
        />
        <YAxis 
          stroke="#aaa" 
          fontSize={12}
          tick={{ fill: '#aaa' }}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '8px',
            color: '#fff'
          }}
        />
        <Legend />
        <Bar dataKey="ê°€?…ì" fill="#82ca9d" name="? ê·œ ê°€?…ì" />
        <Bar dataKey="ê±°ë˜?? fill="#8884d8" name="ê±°ë˜?? />
        <Bar dataKey="?‘ë‹µë¥? fill="#ffc658" name="?‘ë‹µë¥?(%)" />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderPieChart = () => {
    const pieData = [
      { name: '? ê·œ ê°€?…ì', value: data.reduce((sum, item) => sum + item.ê°€?…ì, 0) },
      { name: 'ê±°ë˜??, value: data.reduce((sum, item) => sum + item.ê±°ë˜?? 0) },
      { name: '?‘ë‹µë¥?, value: data.reduce((sum, item) => sum + item.?‘ë‹µë¥? 0) / data.length },
    ];

    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px',
              color: '#fff'
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return renderBarChart();
      case 'pie':
        return renderPieChart();
      default:
        return renderLineChart();
    }
  };

  return (
    <div className="w-full bg-white/5 rounded-2xl border border-white/10 p-4 space-y-4">
      {/* ì°¨íŠ¸ ?œëª© */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <div className="flex gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            type === 'line' ? 'bg-blue-500/20 text-blue-400' :
            type === 'bar' ? 'bg-green-500/20 text-green-400' :
            'bg-purple-500/20 text-purple-400'
          }`}>
            {type === 'line' ? '?“ˆ ?¸ë Œ?? : type === 'bar' ? '?“Š ë¹„êµ' : '?¥§ ë¶„í¬'}
          </span>
        </div>
      </div>

      {/* ì°¨íŠ¸ ?Œë”ë§?*/}
      <div className="h-64">
        {renderChart()}
      </div>

      {/* ?¸ì‚¬?´íŠ¸ ?œì‹œ */}
      {insights && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-white/10">
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-xs text-white/60 mb-1">?“ˆ ?¸ë Œ??/p>
            <p className="text-sm font-medium text-white">
              {insights.trend === 'ì¦ê?' ? '?“ˆ ì¦ê? ì¶”ì„¸' :
               insights.trend === 'ê°ì†Œ' ? '?“‰ ê°ì†Œ ì¶”ì„¸' : '?¡ï¸ ?ˆì • ì¶”ì„¸'}
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-xs text-white/60 mb-1">?”„ ë¹„êµ</p>
            <p className="text-sm font-medium text-white">{insights.comparison}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-xs text-white/60 mb-1">?’¡ ê¶Œì¥?¬í•­</p>
            <p className="text-sm font-medium text-white">{insights.recommendation}</p>
          </div>
        </div>
      )}

      {/* ?°ì´???”ì•½ */}
      <div className="text-xs text-white/50">
        ?“Š ì´?{data.length}?¼ê°„ ?°ì´??| 
        ?‰ê·  ê°€?…ì: {Math.round(data.reduce((sum, item) => sum + item.ê°€?…ì, 0) / data.length)}ëª?|
        ?‰ê·  ê±°ë˜?? {Math.round(data.reduce((sum, item) => sum + item.ê±°ë˜?? 0) / data.length)}ê±?      </div>
    </div>
  );
}
