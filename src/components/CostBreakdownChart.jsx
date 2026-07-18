import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { CATEGORY_LABELS, formatCurrency } from '../utils/format.js'

const COLORS = ['#0F6E56', '#D07A2E', '#7F77DD', '#D85A30', '#378ADD', '#639922', '#993556', '#888780']

export default function CostBreakdownChart({ byCategory, currency }) {
  const data = Object.entries(byCategory)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => ({ name: CATEGORY_LABELS[key] || key, value }))

  if (data.length === 0) {
    return <div className="text-sm text-ink/40 py-10 text-center">No cost entries yet</div>
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
          ))}
        </Pie>
        <Tooltip formatter={(value) => formatCurrency(value, currency)} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
