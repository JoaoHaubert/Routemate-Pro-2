import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { formatDate, formatCurrency } from '../utils/format.js'

export default function CostTrendChart({ series, currency }) {
  if (!series || series.length < 2) {
    return (
      <div className="text-sm text-ink/40 py-10 text-center">
        Not enough logged entries yet to chart a trend
      </div>
    )
  }

  const data = series.map((p) => ({ ...p, label: formatDate(p.date) }))

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E3E1D8" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => formatCurrency(v, currency)}
          width={70}
        />
        <Tooltip formatter={(v) => [formatCurrency(v, currency), 'Cost / km']} />
        <Line type="monotone" dataKey="costPerKm" stroke="#0F6E56" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
