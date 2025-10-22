// ?�� 리포??차트 컴포?�트 - 천재 모드 5?�계
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
  가?�자: number;
  거래?? number;
  ?�답�? number;
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
  title = '?�이???�렌??,
  insights 
}: ReportChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-64 bg-white/5 rounded-2xl border border-white/10 p-4 flex items-center justify-center">
        <p className="text-white/60">차트 ?�이?��? ?�습?�다.</p>
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
          dataKey="가?�자" 
          stroke="#82ca9d" 
          strokeWidth={3}
          dot={{ fill: '#82ca9d', strokeWidth: 2, r: 4 }}
          name="?�규 가?�자"
        />
        <Line 
          type="monotone" 
          dataKey="거래?? 
          stroke="#8884d8" 
          strokeWidth={3}
          dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
          name="거래??
        />
        <Line 
          type="monotone" 
          dataKey="?�답�? 
          stroke="#ffc658" 
          strokeWidth={3}
          dot={{ fill: '#ffc658', strokeWidth: 2, r: 4 }}
          name="?�답�?(%)"
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
        <Bar dataKey="가?�자" fill="#82ca9d" name="?�규 가?�자" />
        <Bar dataKey="거래?? fill="#8884d8" name="거래?? />
        <Bar dataKey="?�답�? fill="#ffc658" name="?�답�?(%)" />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderPieChart = () => {
    const pieData = [
      { name: '?�규 가?�자', value: data.reduce((sum, item) => sum + item.가?�자, 0) },
      { name: '거래??, value: data.reduce((sum, item) => sum + item.거래?? 0) },
      { name: '?�답�?, value: data.reduce((sum, item) => sum + item.?�답�? 0) / data.length },
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
      {/* 차트 ?�목 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <div className="flex gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            type === 'line' ? 'bg-blue-500/20 text-blue-400' :
            type === 'bar' ? 'bg-green-500/20 text-green-400' :
            'bg-purple-500/20 text-purple-400'
          }`}>
            {type === 'line' ? '?�� ?�렌?? : type === 'bar' ? '?�� 비교' : '?�� 분포'}
          </span>
        </div>
      </div>

      {/* 차트 ?�더�?*/}
      <div className="h-64">
        {renderChart()}
      </div>

      {/* ?�사?�트 ?�시 */}
      {insights && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-white/10">
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-xs text-white/60 mb-1">?�� ?�렌??/p>
            <p className="text-sm font-medium text-white">
              {insights.trend === '증�?' ? '?�� 증�? 추세' :
               insights.trend === '감소' ? '?�� 감소 추세' : '?�️ ?�정 추세'}
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-xs text-white/60 mb-1">?�� 비교</p>
            <p className="text-sm font-medium text-white">{insights.comparison}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-xs text-white/60 mb-1">?�� 권장?�항</p>
            <p className="text-sm font-medium text-white">{insights.recommendation}</p>
          </div>
        </div>
      )}

      {/* ?�이???�약 */}
      <div className="text-xs text-white/50">
        ?�� �?{data.length}?�간 ?�이??| 
        ?�균 가?�자: {Math.round(data.reduce((sum, item) => sum + item.가?�자, 0) / data.length)}�?|
        ?�균 거래?? {Math.round(data.reduce((sum, item) => sum + item.거래?? 0) / data.length)}�?      </div>
    </div>
  );
}
