import { useMemo, useState } from 'react'
import { Plus, Trash2, Route, Printer } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import Modal from './Modal.jsx'
import { computeVehicleMetrics } from '../lib/calculations.js'
import { formatCurrency, formatKm, formatDate } from '../utils/format.js'

const inputClass =
  'mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300'

const emptyState = {
  vehicleId: '',
  startAddress: '',
  endAddress: '',
  stops: [],
  distanceKm: '',
  ratePerKm: '',
}

export default function TripEstimateModal({ open, onClose }) {
  const { vehicles, costLogs, settings } = useData()
  const [form, setForm] = useState(emptyState)

  const vehicle = vehicles.find((v) => v.id === form.vehicleId)

  const suggestedRate = useMemo(() => {
    if (!vehicle) return null
    return computeVehicleMetrics(vehicle, costLogs).costPerKm
  }, [vehicle, costLogs])

  function handleVehicleChange(id) {
    const v = vehicles.find((x) => x.id === id)
    const rate = v ? computeVehicleMetrics(v, costLogs).costPerKm : null
    setForm((p) => ({ ...p, vehicleId: id, ratePerKm: rate ? rate.toFixed(2) : '' }))
  }

  function addStop() {
    setForm((p) => ({ ...p, stops: [...p.stops, ''] }))
  }
  function updateStop(i, value) {
    setForm((p) => ({ ...p, stops: p.stops.map((s, idx) => (idx === i ? value : s)) }))
  }
  function removeStop(i) {
    setForm((p) => ({ ...p, stops: p.stops.filter((_, idx) => idx !== i) }))
  }

  const km = Number(form.distanceKm) || 0
  const rate = Number(form.ratePerKm) || 0
  const estimatedCost = km * rate

  function handleClose() {
    setForm(emptyState)
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Trip cost estimate" wide>
      <div className="no-print space-y-4">
        <label className="block">
          <span className="text-xs text-ink/50">Vehicle</span>
          <select className={inputClass} value={form.vehicleId} onChange={(e) => handleVehicleChange(e.target.value)}>
            <option value="">Select vehicle</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.make} {v.model} ({v.plate})
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs text-ink/50">Start address</span>
            <input
              className={inputClass}
              value={form.startAddress}
              onChange={(e) => setForm((p) => ({ ...p, startAddress: e.target.value }))}
              placeholder="Depot, warehouse..."
            />
          </label>
          <label className="block">
            <span className="text-xs text-ink/50">End address</span>
            <input
              className={inputClass}
              value={form.endAddress}
              onChange={(e) => setForm((p) => ({ ...p, endAddress: e.target.value }))}
              placeholder="Final delivery..."
            />
          </label>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink/50">Stops / extra deliveries (optional)</span>
            <button
              type="button"
              onClick={addStop}
              className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              <Plus size={14} /> Add stop
            </button>
          </div>
          <div className="space-y-2 mt-2">
            {form.stops.map((stop, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  className={`${inputClass} mt-0`}
                  value={stop}
                  onChange={(e) => updateStop(i, e.target.value)}
                  placeholder={`Stop ${i + 1} address`}
                />
                <button
                  type="button"
                  onClick={() => removeStop(i)}
                  className="text-ink/30 hover:text-alert-600 transition-colors shrink-0"
                  aria-label="Remove stop"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            {form.stops.length === 0 && <p className="text-xs text-ink/40">No extra stops added.</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs text-ink/50">Total distance (km)</span>
            <input
              type="number"
              min="0"
              step="0.1"
              className={inputClass}
              value={form.distanceKm}
              onChange={(e) => setForm((p) => ({ ...p, distanceKm: e.target.value }))}
              placeholder="e.g. 84"
            />
          </label>
          <label className="block">
            <span className="text-xs text-ink/50">
              Price per km{suggestedRate ? ` (suggested ${formatCurrency(suggestedRate, settings.currency)})` : ''}
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputClass}
              value={form.ratePerKm}
              onChange={(e) => setForm((p) => ({ ...p, ratePerKm: e.target.value }))}
              placeholder="e.g. 0.35"
            />
          </label>
        </div>

        <div className="card bg-surface p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-ink/60 text-sm">
            <Route size={16} />
            Estimated trip cost
          </div>
          <div className="meter text-xl font-semibold">{formatCurrency(estimatedCost, settings.currency)}</div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={handleClose} className="px-4 py-2 text-sm rounded-lg text-ink/60 hover:bg-surface">
            Close
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-ink text-white hover:bg-ink/80"
          >
            <Printer size={14} /> Export PDF
          </button>
        </div>
      </div>

      <div className="hidden print:block">
        <h2 className="text-lg font-semibold">Trip cost estimate</h2>
        <p className="text-xs text-ink/50 mt-0.5">
          {settings.companyName} · Generated {formatDate(new Date())}
        </p>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm mt-5">
          <div>
            <dt className="text-xs text-ink/45">Vehicle</dt>
            <dd className="mt-0.5">{vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.plate})` : '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink/45">Price per km</dt>
            <dd className="meter mt-0.5">{formatCurrency(rate, settings.currency)}/km</dd>
          </div>
          <div>
            <dt className="text-xs text-ink/45">Start address</dt>
            <dd className="mt-0.5">{form.startAddress || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink/45">End address</dt>
            <dd className="mt-0.5">{form.endAddress || '—'}</dd>
          </div>
        </dl>

        <div className="mt-4">
          <dt className="text-xs text-ink/45">Stops / extra deliveries</dt>
          {form.stops.length === 0 ? (
            <dd className="text-sm mt-1">None</dd>
          ) : (
            <ol className="list-decimal list-inside text-sm mt-1 space-y-0.5">
              {form.stops.map((stop, i) => (
                <li key={i}>{stop || `Stop ${i + 1}`}</li>
              ))}
            </ol>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-line flex items-center justify-between">
          <div>
            <div className="text-xs text-ink/45">Total distance</div>
            <div className="meter text-sm mt-0.5">{formatKm(km)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-ink/45">Estimated trip cost</div>
            <div className="meter text-xl font-semibold mt-0.5">{formatCurrency(estimatedCost, settings.currency)}</div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
