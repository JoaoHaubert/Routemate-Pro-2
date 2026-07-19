import { STATUS_LABELS, STATUS_STYLES } from '../utils/format.js'

export function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status] || STATUS_STYLES.idle}`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  )
}

export function GroupBadge({ group }) {
  if (!group) return <span className="text-ink/30 text-xs">—</span>
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-surface border border-line">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: group.color }} />
      {group.name}
    </span>
  )
}
