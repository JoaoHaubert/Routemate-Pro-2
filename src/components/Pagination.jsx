import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, pageCount, onChange }) {
  if (pageCount <= 1) return null

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-line text-sm text-ink/60">
      <span>
        Page {page} of {pageCount}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-line hover:bg-surface disabled:opacity-40 disabled:hover:bg-transparent"
          aria-label="Previous page"
        >
          <ChevronLeft size={14} /> Prev
        </button>
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= pageCount}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-line hover:bg-surface disabled:opacity-40 disabled:hover:bg-transparent"
          aria-label="Next page"
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
