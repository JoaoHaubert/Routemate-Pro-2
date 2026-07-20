import { useState } from 'react'
import { Fuel, Gauge, Pencil } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useData } from '../../context/DataContext.jsx'
import { computeIntervalCost, computeVehicleMetrics } from '../../lib/calculations.js'
import { formatCurrency, formatKm, formatCostPerKm, CATEGORY_LABELS } from '../../utils/format.js'
import Modal from '../../components/Modal.jsx'

const inputClass =
  'mt-1 w-full rounded-lg border border-line px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-primary-300'

export default function DriveHome() {
  const { user } = useAuth()
  const { vehicles, drivers, settings, loading, addVehicle, updateDriver, reload } = useData()

  const myDriver = drivers.find((d) => d.userId === user.id)
  const myVehicle = vehicles.find((v) => v.id === myDriver?.vehicleId)

  if (loading || !myDriver) {
    return <p className="text-sm text-ink/50 text-center py-10">Loading…</p>
  }

  if (!myVehicle) {
    return <Onboarding myDriver={myDriver} settings={settings} addVehicle={addVehicle} updateDriver={updateDriver} reload={reload} />
  }

  return <VehicleHome vehicle={myVehicle} driver={myDriver} settings={settings} />
}

function Onboarding({ myDriver, settings, addVehicle, updateDriver, reload }) {
  const [form, setForm] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    plate: '',
    currentOdometer: '',
    purchasePrice: '',
    annualInsurance: '',
    annualTax: '',
  })
  const [busy, setBusy] = useState(false)

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    const purchasePrice = Number(form.purchasePrice) || 0
    const odometer = Number(form.currentOdometer) || 0
    const residualValue = purchasePrice * ((settings.defaultResidualPct || 0) / 100)

    const newVehicle = await addVehicle({
      type: 'taxi',
      make: form.make,
      model: form.model,
      year: Number(form.year) || new Date().getFullYear(),
      plate: form.plate,
      purchaseDate: new Date().toISOString().slice(0, 10),
      purchasePrice,
      residualValue,
      usefulLifeYears: settings.defaultUsefulLifeYears || 7,
      annualInsurance: Number(form.annualInsurance) || 0,
      annualTax: Number(form.annualTax) || 0,
      initialOdometer: odometer,
      currentOdometer: odometer,
      status: 'in_service',
      groupId: null,
    })

    if (newVehicle) {
      await updateDriver(myDriver.id, { vehicleId: newVehicle.id })
      await reload()
    }
    setBusy(false)
  }

  return (
    <div>
      <h1 className="text-lg font-semibold">Welcome — let's set up your vehicle</h1>
      <p className="text-sm text-ink/50 mt-1 mb-5">
        A few details so we can start tracking your real cost per km.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-xs text-ink/50">Make</span>
          <input required className={inputClass} value={form.make} onChange={(e) => handleChange('make', e.target.value)} />
        </label>
        <label className="block">
          <span className="text-xs text-ink/50">Model</span>
          <input required className={inputClass} value={form.model} onChange={(e) => handleChange('model', e.target.value)} />
        </label>
        <label className="block">
          <span className="text-xs text-ink/50">Year</span>
          <input
            type="number"
            required
            className={inputClass}
            value={form.year}
            onChange={(e) => handleChange('year', e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-xs text-ink/50">License plate</span>
          <input className={inputClass} value={form.plate} onChange={(e) => handleChange('plate', e.target.value)} />
        </label>
        <label className="block">
          <span className="text-xs text-ink/50">Current odometer (km)</span>
          <input
            type="number"
            required
            className={inputClass}
            value={form.currentOdometer}
            onChange={(e) => handleChange('currentOdometer', e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-xs text-ink/50">Price paid for the vehicle</span>
          <input
            type="number"
            step="0.01"
            required
            className={inputClass}
            value={form.purchasePrice}
            onChange={(e) => handleChange('purchasePrice', e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-xs text-ink/50">Annual insurance</span>
          <input
            type="number"
            step="0.01"
            required
            className={inputClass}
            value={form.annualInsurance}
            onChange={(e) => handleChange('annualInsurance', e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-xs text-ink/50">Annual tax</span>
          <input
            type="number"
            step="0.01"
            required
            className={inputClass}
            value={form.annualTax}
            onChange={(e) => handleChange('annualTax', e.target.value)}
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="w-full px-4 py-3 text-sm rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-60"
        >
          {busy ? 'Setting up…' : 'Start tracking'}
        </button>
      </form>
    </div>
  )
}

function VehicleHome({ vehicle, driver, settings }) {
  const { costLogs, addCostLog, updateVehicle } = useData()
  const [logOpen, setLogOpen] = useState(false)
  const [odoOpen, setOdoOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [result, setResult] = useState(null)

  const metrics = computeVehicleMetrics(vehicle, costLogs)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">
            {vehicle.make} {vehicle.model}
          </h1>
          <p className="text-sm text-ink/50 mt-0.5">{formatKm(vehicle.currentOdometer)} on the clock</p>
        </div>
        <button
          onClick={() => setEditOpen(true)}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-line hover:bg-surface shrink-0"
        >
          <Pencil size={13} /> Edit details
        </button>
      </div>

      <div className="card p-4 text-center">
        <div className="text-xs text-ink/45">Your cost / km so far</div>
        <div className="meter text-2xl font-bold text-primary-700 mt-1">
          {formatCostPerKm(metrics.costPerKm, settings.currency)}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <button
          onClick={() => setLogOpen(true)}
          className="flex items-center justify-center gap-2 w-full px-4 py-5 rounded-xl bg-primary-600 text-white text-base font-medium hover:bg-primary-700"
        >
          <Fuel size={20} /> Log a cost
        </button>
        <button
          onClick={() => setOdoOpen(true)}
          className="flex items-center justify-center gap-2 w-full px-4 py-5 rounded-xl bg-ink text-white text-base font-medium hover:bg-ink/85"
        >
          <Gauge size={20} /> Update odometer
        </button>
      </div>

      <LogCostModal
        open={logOpen}
        onClose={() => setLogOpen(false)}
        vehicle={vehicle}
        driver={driver}
        addCostLog={addCostLog}
      />
      <UpdateOdometerModal
        open={odoOpen}
        onClose={() => setOdoOpen(false)}
        vehicle={vehicle}
        costLogs={costLogs}
        updateVehicle={updateVehicle}
        currency={settings.currency}
        onResult={setResult}
      />
      <ResultModal result={result} currency={settings.currency} onClose={() => setResult(null)} />
      <EditVehicleModal open={editOpen} onClose={() => setEditOpen(false)} vehicle={vehicle} updateVehicle={updateVehicle} />
    </div>
  )
}

function EditVehicleModal({ open, onClose, vehicle, updateVehicle }) {
  const [form, setForm] = useState(() => ({
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    plate: vehicle.plate || '',
    purchasePrice: vehicle.purchasePrice,
    annualInsurance: vehicle.annualInsurance,
    annualTax: vehicle.annualTax,
  }))
  const [busy, setBusy] = useState(false)

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    await updateVehicle(vehicle.id, {
      make: form.make,
      model: form.model,
      year: Number(form.year) || vehicle.year,
      plate: form.plate,
      purchasePrice: Number(form.purchasePrice) || 0,
      annualInsurance: Number(form.annualInsurance) || 0,
      annualTax: Number(form.annualTax) || 0,
    })
    setBusy(false)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit vehicle details">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-xs text-ink/50">Make</span>
          <input required className={inputClass} value={form.make} onChange={(e) => handleChange('make', e.target.value)} />
        </label>
        <label className="block">
          <span className="text-xs text-ink/50">Model</span>
          <input required className={inputClass} value={form.model} onChange={(e) => handleChange('model', e.target.value)} />
        </label>
        <label className="block">
          <span className="text-xs text-ink/50">Year</span>
          <input
            type="number"
            required
            className={inputClass}
            value={form.year}
            onChange={(e) => handleChange('year', e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-xs text-ink/50">License plate</span>
          <input className={inputClass} value={form.plate} onChange={(e) => handleChange('plate', e.target.value)} />
        </label>
        <label className="block">
          <span className="text-xs text-ink/50">Price paid for the vehicle</span>
          <input
            type="number"
            step="0.01"
            required
            className={inputClass}
            value={form.purchasePrice}
            onChange={(e) => handleChange('purchasePrice', e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-xs text-ink/50">Annual insurance</span>
          <input
            type="number"
            step="0.01"
            required
            className={inputClass}
            value={form.annualInsurance}
            onChange={(e) => handleChange('annualInsurance', e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-xs text-ink/50">Annual tax</span>
          <input
            type="number"
            step="0.01"
            required
            className={inputClass}
            value={form.annualTax}
            onChange={(e) => handleChange('annualTax', e.target.value)}
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="w-full px-4 py-3 text-sm rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </Modal>
  )
}

function LogCostModal({ open, onClose, vehicle, driver, addCostLog }) {
  const [form, setForm] = useState({ category: 'fuel', amount: '', odometer: '', notes: '' })
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    await addCostLog({
      vehicleId: vehicle.id,
      driverId: driver.id,
      date: new Date().toISOString().slice(0, 10),
      odometer: Number(form.odometer) || vehicle.currentOdometer,
      category: form.category,
      amount: Number(form.amount) || 0,
      notes: form.notes,
    })
    setBusy(false)
    setForm({ category: 'fuel', amount: '', odometer: '', notes: '' })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Log a cost">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-xs text-ink/50">Category</span>
          <select
            className={inputClass}
            value={form.category}
            onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
          >
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-ink/50">Amount</span>
          <input
            type="number"
            step="0.01"
            required
            className={inputClass}
            value={form.amount}
            onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
          />
        </label>
        <label className="block">
          <span className="text-xs text-ink/50">Current odometer (km)</span>
          <input
            type="number"
            required
            min={vehicle.currentOdometer}
            placeholder={String(vehicle.currentOdometer)}
            className={inputClass}
            value={form.odometer}
            onChange={(e) => setForm((p) => ({ ...p, odometer: e.target.value }))}
          />
        </label>
        <label className="block">
          <span className="text-xs text-ink/50">Notes (optional)</span>
          <input className={inputClass} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="w-full px-4 py-3 text-sm rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
      </form>
    </Modal>
  )
}

function UpdateOdometerModal({ open, onClose, vehicle, costLogs, updateVehicle, currency, onResult }) {
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const newOdometer = Number(value)
    if (!newOdometer || newOdometer <= vehicle.currentOdometer) return
    setBusy(true)
    const now = new Date()
    const interval = computeIntervalCost(vehicle, costLogs, newOdometer, now)
    await updateVehicle(vehicle.id, {
      currentOdometer: newOdometer,
      lastOdometerUpdateAt: now.toISOString(),
      lastOdometerUpdateValue: newOdometer,
    })
    setBusy(false)
    setValue('')
    onClose()
    onResult({ ...interval, currency })
  }

  return (
    <Modal open={open} onClose={onClose} title="Update odometer">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-ink/50">Current: {formatKm(vehicle.currentOdometer)}</p>
        <label className="block">
          <span className="text-xs text-ink/50">New odometer reading (km)</span>
          <input
            type="number"
            required
            min={vehicle.currentOdometer + 1}
            className={inputClass}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="w-full px-4 py-3 text-sm rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-60"
        >
          {busy ? 'Calculating…' : 'Update'}
        </button>
      </form>
    </Modal>
  )
}

function ResultModal({ result, currency, onClose }) {
  return (
    <Modal open={!!result} onClose={onClose} title="Since your last update">
      {result && (
        <div className="text-center space-y-3 py-2">
          <div>
            <div className="text-xs text-ink/45">Distance driven</div>
            <div className="meter text-xl font-semibold">{formatKm(result.km)}</div>
          </div>
          <div>
            <div className="text-xs text-ink/45">Cost incurred</div>
            <div className="meter text-xl font-semibold">{formatCurrency(result.totalCost, currency)}</div>
          </div>
          <div className="card p-3 bg-surface">
            <div className="text-xs text-ink/45">Cost per km</div>
            <div className="meter text-2xl font-bold text-primary-700">{formatCostPerKm(result.costPerKm, currency)}</div>
          </div>
          <button onClick={onClose} className="w-full px-4 py-2.5 text-sm rounded-lg bg-ink text-white font-medium hover:bg-ink/85 mt-2">
            Got it
          </button>
        </div>
      )}
    </Modal>
  )
}
