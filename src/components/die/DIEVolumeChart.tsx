import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

interface Props {
  data: { day: string; docs: number }[]
}

export default function DIEVolumeChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1B2D65" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#1B2D65" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} />
        <Tooltip />
        <Area type="monotone" dataKey="docs" stroke="#1B2D65" strokeWidth={2} fill="url(#volGrad)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
