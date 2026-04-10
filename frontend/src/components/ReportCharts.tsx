import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, PieChart, Pie, Cell, Legend, BarChart, Bar, Rectangle
} from 'recharts';
import type { ChartDataPoint } from '../store/useReportStore';

// ═══════════════════════════════════════════════
// ألوان المخططات
// ═══════════════════════════════════════════════
const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
const DONUT_ENV = '#10b981';
const DONUT_CONS = '#3b82f6';

// ═══════════════════════════════════════════════
// مخطط زمني (Area Chart)
// ═══════════════════════════════════════════════
interface TimelineChartProps {
  data: ChartDataPoint[];
  title?: string;
}

export const TimelineChart = ({ data, title }: TimelineChartProps) => {
  const chartData = data.map(d => ({
    name: d.label,
    عينات: d.value,
    شهادات: d.value2 ?? 0,
  }));

  return (
    <div className="w-full" style={{ height: '300px' }}>
      {title && (
        <h4 className="text-sm font-bold text-center mb-2 opacity-70" style={{ color: 'var(--text-main)' }}>
          {title}
        </h4>
      )}
      <ResponsiveContainer width="99%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
          <defs>
            <linearGradient id="gradSamples" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="gradCerts" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              borderRadius: '12px',
              background: 'rgba(15, 23, 42, 0.85)',
              border: 'none',
              color: '#fff',
              backdropFilter: 'blur(8px)',
            }}
          />
          <Legend wrapperStyle={{ paddingTop: '10px' }} />
          <Area type="monotone" dataKey="عينات" stroke="#0ea5e9" fill="url(#gradSamples)" strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 2 }} />
          <Area type="monotone" dataKey="شهادات" stroke="#10b981" fill="url(#gradCerts)" strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// ═══════════════════════════════════════════════
// مخطط دائري (Donut Chart)
// ═══════════════════════════════════════════════
interface DonutChartProps {
  data: ChartDataPoint[];
  title?: string;
  colors?: string[];
}

export const DonutChart = ({ data, title, colors }: DonutChartProps) => {
  const chartData = data.map(d => ({ name: d.label, value: d.value }));
  const chartColors = colors || [DONUT_ENV, DONUT_CONS, ...COLORS];

  return (
    <div className="w-full flex flex-col items-center" style={{ height: '300px' }}>
      {title && (
        <h4 className="text-sm font-bold text-center mb-2 opacity-70" style={{ color: 'var(--text-main)' }}>
          {title}
        </h4>
      )}
      <ResponsiveContainer width="95%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
            animationBegin={0}
            animationDuration={800}
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: '12px',
              background: 'rgba(15, 23, 42, 0.85)',
              border: 'none',
              color: '#fff',
            }}
          />
          <Legend verticalAlign="bottom" align="center" iconType="rect" iconSize={12} wrapperStyle={{ paddingBottom: '5px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// ═══════════════════════════════════════════════
// مخطط أفقي (Horizontal Bar Chart)
// ═══════════════════════════════════════════════
interface HorizontalBarChartProps {
  data: ChartDataPoint[];
  title?: string;
  color?: string;
}

export const HorizontalBarChart = ({ data, title, color }: HorizontalBarChartProps) => {
  const chartData = data.map(d => ({ name: d.label, القيمة: d.value }));
  const barColor = color || '#0ea5e9';

  const renderActiveBar = (props: any) => {
    const { fill, x, y, width, height } = props;
    return (
      <Rectangle
        {...props}
        x={x}
        y={y - 2}
        width={width + 4}
        height={height + 4}
        fill={fill}
        stroke="#fff"
        strokeWidth={1}
        radius={[0, 8, 8, 0]}
        style={{ filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.2))', transition: 'all 0.3s ease' }}
      />
    );
  };

  return (
    <div className="w-full" style={{ height: '280px' }}>
      {title && (
        <h4 className="text-sm font-bold text-center mb-2 opacity-70" style={{ color: 'var(--text-main)' }}>
          {title}
        </h4>
      )}
      <ResponsiveContainer width="99%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 100, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.1} horizontal={false} />
          <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
          <YAxis dataKey="name" type="category" orientation="left" width={10} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold', textAnchor: 'start', dx: -20 }} />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            contentStyle={{
              borderRadius: '12px',
              background: 'rgba(15, 23, 42, 0.85)',
              border: 'none',
              color: '#fff',
            }}
          />
          <Bar dataKey="القيمة" fill={barColor} radius={[0, 6, 6, 0]} barSize={18} activeBar={renderActiveBar} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// ═══════════════════════════════════════════════
// مخطط الأداء الشهري (Grouped Bar - بيئي vs استهلاكي)
// ═══════════════════════════════════════════════
interface MonthlyPerformanceChartProps {
  data: ChartDataPoint[];
  title?: string;
}

export const MonthlyPerformanceChart = ({ data, title }: MonthlyPerformanceChartProps) => {
  const chartData = data.map(d => ({
    name: d.label,
    بيئية: d.value,
    استهلاكية: d.value2 ?? 0,
  }));

  const renderActiveBar = (props: any) => {
    const { fill, x, y, width, height } = props;
    return (
      <Rectangle
        {...props}
        x={x - 2}
        y={y - 3}
        width={width + 4}
        height={height + 3}
        fill={fill}
        stroke="#fff"
        strokeWidth={1}
        radius={[6, 6, 0, 0]}
        style={{ filter: 'drop-shadow(0px 6px 10px rgba(0,0,0,0.25))', transition: 'all 0.3s ease' }}
      />
    );
  };

  return (
    <div className="w-full" style={{ height: '300px' }}>
      {title && (
        <h4 className="text-sm font-bold text-center mb-2 opacity-70" style={{ color: 'var(--text-main)' }}>
          {title}
        </h4>
      )}
      <ResponsiveContainer width="99%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
          <defs>
            <linearGradient id="gradReportEnv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity={0.85} />
              <stop offset="100%" stopColor="#059669" stopOpacity={0.95} />
            </linearGradient>
            <linearGradient id="gradReportCons" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.85} />
              <stop offset="100%" stopColor="#2563eb" stopOpacity={0.95} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            contentStyle={{
              borderRadius: '12px',
              background: 'rgba(15, 23, 42, 0.85)',
              border: 'none',
              color: '#fff',
            }}
          />
          <Legend wrapperStyle={{ paddingTop: '15px' }} />
          <Bar dataKey="بيئية" fill="url(#gradReportEnv)" radius={[6, 6, 0, 0]} barSize={18} activeBar={renderActiveBar} />
          <Bar dataKey="استهلاكية" fill="url(#gradReportCons)" radius={[6, 6, 0, 0]} barSize={18} activeBar={renderActiveBar} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
