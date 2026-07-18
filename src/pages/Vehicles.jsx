import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { computeVehicleMetrics } from '../lib/calculations.js'
import { formatCostPerKm, formatKm } from '../utils/format.js'
import Modal from '../components/Modal.jsx'
import EmptyState from '../components/EmptyState.jsx'

const emptyForm = {
  make: '',
  model: '',
  year: new Date().getFullYear(),
  plate: '',
  purchaseDate: '',
  purchasePrice: '',
  residualValue: '',
  usefulLifeYears: 7,
  annualInsurance: '',
  annualTax: '',
  initialOdometer: 0,
  currentOdometer: 0,
}

function FormField({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs text-ink/50">{label}</span>
      {children}
    </label>
  )
}

const inputClass =
  'mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300'

export default function Vehicles() {
  const { vehicles, costLogs, settings, addVehicle, deleteVehicle } = useData()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    addVehicle({
      ...form,
      year: Number(form.year),
      purchasePrice: Number(form.purchasePrice) || 0,
      residualValue: Number(form.residualValue) || 0,
      usefulLifeYears: Number(form.usefulLifeYears) || 1,
      annualInsurance: Number(form.annualInsurance) || 0,
      annualTax: Number(form.annualTax) || 0,
      initialOdometer: Number(form.initialOdometer) || 0,
      currentOdometer: Number(form.currentOdometer) || 0,
    })
    setForm(emptyForm)
    setOpen(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Vehicles</h1>
          <p className="text-sm text-ink/50 mt-0.5">Every vehicle's true cost per km.</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={16} /> Add vehicle
        </button>
      </div>

      {vehicles.length === 0 ? (
        <EmptyState
          title="No vehicles yet"
          description="Add your first vehicle to start tracking its cost per km."
          action={
            <button onClick={() => setOpen(true)} className="text-sm text-primary-600 font-medium">
              Add vehicle
            </button>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink/40 bg-surface">
                <th className="px-4 py-3 font-normal">Vehicle</th>
                <th className="px-4 py-3 font-normal">Plate</th>
                <th className="px-4 py-3 font-normal">Odometer</th>
                <th className="px-4 py-3 font-normal text-right">Cost / km</th>
                <th className="px-4 py-3 font-normal w-10"></th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => {
                const metrics = computeVehicleMetrics(vehicle, costLogs)
                return (
                  <tr key={vehicle.id} className="border-t border-line hover:bg-surface/60">
                    <td className="px-4 py-3">
                      <Link to={`/vehicles/${vehicle.id}`} className="font-medium hover:underline">
                        {vehicle.make} {vehicle.model}
                      </Link>
                      <div className="text-xs text-ink/45">{vehicle.year}</div>
                    </td>
                    <td className="px-4 py-3 text-ink/70">{vehicle.plate || '—'}</td>
                    <td className="px-4 py-3 meter text-ink/70">{formatKm(vehicle.currentOdometer)}</td>
                    <td className="px-4 py-3 text-right meter font-semibold text-primary-700">
                      {formatCostPerKm(metrics.costPerKm, settings.currency)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          if (confirm(`Remove ${vehicle.make} ${vehicle.model}? This also removes its cost log entries.`)) {
                            deleteVehicle(vehicle.id)
                          }
                        }}
                        className="text-ink/30 hover:text-alert-600 transition-colors"
                        aria-label="Delete vehicle"
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

      <Modal open={open} onClose={() => setOpen(false)} title="Add vehicle" wide>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <FormField label="Make">
            <input required className={inputClass} value={form.make} onChange={(e) => handleChange('make', e.target.value)} />
          </FormField>
          <FormField label="Model">
            <input required className={inputClass} value={form.model} onChange={(e) => handleChange('model', e.target.value)} />
          </FormField>
          <FormField label="Year">
            <input type="number" required className={inputClass} value={form.year} onChange={(e) => handleChange('year', e.target.value)} />
          </FormField>
          <FormField label="License plate">
            <input className={inputClass} value={form.plate} onChange={(e) => handleChange('plate', e.target.value)} />
          </FormField>
          <FormField label="Purchase date">
            <input type="date" required className={inputClass} value={form.purchaseDate} onChange={(e) => handleChange('purchaseDate', e.target.value)} />
          </FormField>
          <FormField label="Price paid">
            <input type="number" step="0.01" required className={inputClass} value={form.purchasePrice} onChange={(e) => handleChange('purchasePrice', e.target.value)} />
          </FormField>
          <FormField label="Estimated residual value">
            <input type="number" step="0.01" className={inputClass} value={form.residualValue} onChange={(e) => handleChange('residualValue', e.target.value)} />
          </FormField>
          <FormField label="Useful life (years)">
            <input type="number" className={inputClass} value={form.usefulLifeYears} onChange={(e) => handleChange('usefulLifeYears', e.target.value)} />
          </FormField>
          <FormField label="Annual insurance">
            <input type="number" step="0.01" required className={inputClass} value={form.annualInsurance} onChange={(e) => handleChange('annualInsurance', e.target.value)} />
          </FormField>
          <FormField label="Annual tax">
            <input type="number" step="0.01" required className={inputClass} value={form.annualTax} onChange={(e) => handleChange('annualTax', e.target.value)} />
          </FormField>
          <FormField label="Odometer at purchase">
            <input type="number" className={inputClass} value={form.initialOdometer} onChange={(e) => handleChange('initialOdometer', e.target.value)} />
          </FormField>
          <FormField label="Current odometer">
            <input type="number" required className={inputClass} value={form.currentOdometer} onChange={(e) => handleChange('currentOdometer', e.target.value)} />
          </FormField>

          <div className="col-span-2 flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm rounded-lg text-ink/60 hover:bg-surface">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700">
              Save vehicle
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
