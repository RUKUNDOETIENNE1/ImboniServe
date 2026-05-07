import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface SalesChartProps {
  data: Array<{ time: string; sales: number }>
  formatRWF: (amount: number) => string
}

export default function SalesChart({ data, formatRWF }: SalesChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
        <XAxis 
          dataKey="time" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#94A3B8', fontSize: 12 }}
        />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#94A3B8', fontSize: 12 }}
          tickFormatter={(value) => `${value/1000}k`}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1E293B', 
            border: 'none', 
            borderRadius: '8px',
            color: '#fff'
          }}
          formatter={(value: number) => [formatRWF(value), 'Sales']}
        />
        <Area 
          type="monotone" 
          dataKey="sales" 
          stroke="#3B82F6" 
          strokeWidth={3}
          fill="url(#salesGradient)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
