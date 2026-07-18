export default function StatCard({ label, value, sub, tone = 'default', meter = false }) {
  const toneClasses = {
    default: 'text-ink',
    good: 'text-primary-600',
    warn: 'text-clay-600',
    bad: 'text-alert-600',
  }

  return (
    <div className="card p-5">
      <div className="text-xs uppercase tracking-wide text-ink/50">{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${meter ? 'meter' : ''} ${toneClasses[tone]}`}>
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-ink/50">{sub}</div>}
    </div>
  )
}
