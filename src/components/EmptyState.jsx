export default function EmptyState({ title, description, action }) {
  return (
    <div className="card flex flex-col items-center justify-center text-center px-6 py-14">
      <div className="text-base font-medium text-ink">{title}</div>
      {description && <div className="mt-1 text-sm text-ink/50 max-w-sm">{description}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
