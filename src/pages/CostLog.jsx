import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import Modal from '../components/Modal.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { formatCurrency, formatDate, formatKm, CATEGORY_LABELS } from '../utils/format.js'

const emptyForm = {
  vehicleId: '',
  driverId: '',
  date: new Date().toISOString().slice(0, 10),
  odometer: '',
  category: 'fuel',
  amount: '',
  notes: '',
}

const inputClass =
  'mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300'

export default function CostLog() {
  const { vehicles, drivers, costLogs, settings, addCostLog, deleteCostLog } = useData()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [vehicleFilter, setVehicleFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const filteredLogs = useMemo(() => {
    return [...costLogs]
      .filter((l) => !vehicleFilter || l.vehicleId === vehicleFilter)
      .filter((l) => !categoryFilter || l.category === categoryFilter)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [costLogs, vehicleFilter, categoryFilter])

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.vehicleId) return
    addCostLog({
      ...form,
      odometer: Number(form.odometer) || 0,
      amount: Number(form.amount) || 0,
      driverId: form.driverId || null,
    })
    setForm({ ...emptyForm, vehicleId: form.vehicleId })
    setOpen(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Cost log</h1>
          <p className="text-sm text-ink/50 mt-0.5">Every expense, tied to a vehicle and an odometer reading.</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={16} /> Add entry
        </button>
      </div>

      <div className="flex gap-3">
        <select
          value={vehicleFilter}
          onChange={(e) => setVehicleFilter(e.target.value)}
          className="rounded-lg border border-line px-3 py-2 text-sm bg-card"
        >
          <option value="">All vehicles</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.make} {v.model}
            </option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-line px-3 py-2 text-sm bg-card"
        >
          <option value="">All categories</option>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {filteredLogs.length === 0 ? (
        <EmptyState title="No entries match" description="Try a different filter, or add a new cost log entry." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink/40 bg-surface">
                <th className="px-4 py-3 font-normal">Date</th>
                <th className="px-4 py-3 font-normal">Vehicle</th>
                <th className="px-4 py-3 font-normal">Driver</th>
                <th className="px-4 py-3 font-normal">Odometer</th>
                <th className="px-4 py-3 font-normal">Category</th>
                <th className="px-4 py-3 font-normal">Notes</th>
                <th className="px-4 py-3 font-normal text-right">Amount</th>
                <th className="px-4 py-3 font-normal w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => {
                const vehicle = vehicles.find((v) => v.id === log.vehicleId)
                const driver = drivers.find((d) => d.id === log.driverId)
                return (
                  <tr key={log.id} className="border-t border-line hover:bg-surface/60">
                    <td className="px-4 py-3 text-ink/70">{formatDate(log.date)}</td>
                    <td className="px-4 py-3">{vehicle ? `${vehicle.make} ${vehicle.model}` : '—'}</td>
                    <td className="px-4 py-3 text-ink/70">{driver ? driver.fullName : '—'}</td>
                    <td className="px-4 py-3 meter text-ink/70">{formatKm(log.odometer)}</td>
                    <td className="px-4 py-3">{CATEGORY_LABELS[log.category] || log.category}</td>
                    <td className="px-4 py-3 text-ink/50">{log.notes || '—'}</td>
                    <td className="px-4 py-3 text-right meter">{formatCurrency(log.amount, settings.currency)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteCostLog(log.id)}
                        className="text-ink/30 hover:text-alert-600 transition-colors"
                        aria-label="Delete entry"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add cost log entry" wide>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs text-ink/50">Vehicle</span>
            <select
              required
              className={inputClass}
              value={form.vehicleId}
              onChange={(e) => setForm((p) => ({ ...p, vehicleId: e.target.value }))}
            >
              <option value="">Select vehicle</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.make} {v.model}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-ink/50">Driver (optional)</span>
            <select
              className={inputClass}
              value={form.driverId}
              onChange={(e) => setForm((p) => ({ ...p, driverId: e.target.value }))}
            >
              <option value="">Unassigned</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-ink/50">Date</span>
            <input type="date" required className={inputClass} value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
          </label>
          <label className="block">
            <span className="text-xs text-ink/50">Odometer reading</span>
            <input type="number" required className={inputClass} value={form.odometer} onChange={(e) => setForm((p) => ({ ...p, odometer: e.target.value }))} />
          </label>
          <label className="block">
            <span className="text-xs text-ink/50">Category</span>
            <select className={inputClass} value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-ink/50">Amount</span>
            <input type="number" step="0.01" required className={inputClass} value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} />
          </label>
          <label className="block col-span-2">
            <span className="text-xs text-ink/50">Notes</span>
            <input className={inputClass} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
          </label>

          <div className="col-span-2 flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm rounded-lg text-ink/60 hover:bg-surface">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700">
              Save entry
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
