import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children, wide = false }) {
  if (!open) return null

  return (
    <div className="print-modal-overlay fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 px-4 py-10">
      <div className={`print-modal-card card w-full ${wide ? 'max-w-2xl' : 'max-w-md'} p-6 text-ink`}>
        <div className="no-print flex items-center justify-between mb-4">
          <h2 className="text-base font-medium">{title}</h2>
          <button
            onClick={onClose}
            className="text-ink/40 hover:text-ink transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
