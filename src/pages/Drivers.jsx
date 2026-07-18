import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import Modal from '../components/Modal.jsx'
import EmptyState from '../components/EmptyState.jsx'

const emptyForm = { fullName: '', licenseNo: '', phone: '', vehicleId: '' }
const inputClass =
  'mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300'

export default function Drivers() {
  const { drivers, vehicles, addDriver, updateDriver, deleteDriver } = useData()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  function handleSubmit(e) {
    e.preventDefault()
    addDriver({ ...form, vehicleId: form.vehicleId || null })
    setForm(emptyForm)
    setOpen(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Drivers</h1>
          <p className="text-sm text-ink/50 mt-0.5">Who's behind the wheel of each vehicle.</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={16} /> Add driver
        </button>
      </div>

      {drivers.length === 0 ? (
        <EmptyState title="No drivers yet" description="Add a driver and assign them to a vehicle." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink/40 bg-surface">
                <th className="px-4 py-3 font-normal">Name</th>
                <th className="px-4 py-3 font-normal">License</th>
                <th className="px-4 py-3 font-normal">Phone</th>
                <th className="px-4 py-3 font-normal">Assigned vehicle</th>
                <th className="px-4 py-3 font-normal w-10"></th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver) => {
                const vehicle = vehicles.find((v) => v.id === driver.vehicleId)
                return (
                  <tr key={driver.id} className="border-t border-line hover:bg-surface/60">
                    <td className="px-4 py-3 font-medium">{driver.fullName}</td>
                    <td className="px-4 py-3 text-ink/70">{driver.licenseNo || '—'}</td>
                    <td className="px-4 py-3 text-ink/70">{driver.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <select
                        value={driver.vehicleId || ''}
                        onChange={(e) => updateDriver(driver.id, { vehicleId: e.target.value || null })}
                        className="rounded-lg border border-line px-2 py-1 text-sm bg-transparent"
                      >
                        <option value="">Unassigned</option>
                        {vehicles.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.make} {v.model}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => confirm(`Remove ${driver.fullName}?`) && deleteDriver(driver.id)}
                        className="text-ink/30 hover:text-alert-600 transition-colors"
                        aria-label="Delete driver"
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

      <Modal open={open} onClose={() => setOpen(false)} title="Add driver">
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-xs text-ink/50">Full name</span>
            <input required className={inputClass} value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} />
          </label>
          <label className="block">
            <span className="text-xs text-ink/50">License number</span>
            <input className={inputClass} value={form.licenseNo} onChange={(e) => setForm((p) => ({ ...p, licenseNo: e.target.value }))} />
          </label>
          <label className="block">
            <span className="text-xs text-ink/50">Phone</span>
            <input className={inputClass} value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
          </label>
          <label className="block">
            <span className="text-xs text-ink/50">Assign to vehicle</span>
            <select
              className={inputClass}
              value={form.vehicleId}
              onChange={(e) => setForm((p) => ({ ...p, vehicleId: e.target.value }))}
            >
              <option value="">Unassigned</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.make} {v.model}
                </option>
              ))}
            </select>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm rounded-lg text-ink/60 hover:bg-surface">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700">
              Save driver
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
