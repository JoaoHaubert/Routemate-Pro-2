import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Printer } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { computeVehicleMetrics, computeCostPerKmSeries, annualDepreciation } from '../lib/calculations.js'
import { formatCurrency, formatCostPerKm, formatKm, formatDate, CATEGORY_LABELS, STATUS_LABELS } from '../utils/format.js'
import StatCard from '../components/StatCard.jsx'
import CostTrendChart from '../components/CostTrendChart.jsx'
import CostBreakdownChart from '../components/CostBreakdownChart.jsx'
import { StatusBadge, GroupBadge } from '../components/Badge.jsx'

export default function VehicleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { vehicles, groups, drivers, costLogs, settings, updateVehicle } = useData()
  const [editing, setEditing] = useState(false)

  const vehicle = vehicles.find((v) => v.id === id)
  if (!vehicle) {
    return (
      <div>
        <Link to="/vehicles" className="text-sm text-primary-600 flex items-center gap-1">
          <ArrowLeft size={14} /> Back to vehicles
        </Link>
        <p className="mt-4 text-sm text-ink/50">Vehicle not found.</p>
      </div>
    )
  }

  const metrics = computeVehicleMetrics(vehicle, costLogs)
  const series = computeCostPerKmSeries(vehicle, costLogs)
  const depreciation = annualDepreciation(vehicle)
  const driver = drivers.find((d) => d.vehicleId === vehicle.id)
  const group = groups.find((g) => g.id === vehicle.groupId)
  const logs = costLogs
    .filter((l) => l.vehicleId === vehicle.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <Link to="/vehicles" className="text-sm text-ink/50 hover:text-ink flex items-center gap-1">
          <ArrowLeft size={14} /> Back to vehicles
        </Link>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing((v) => !v)}
            className="text-sm px-3 py-1.5 rounded-lg border border-line hover:bg-surface"
          >
            {editing ? 'Done editing' : 'Edit details'}
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-ink text-white hover:bg-ink/80"
          >
            <Printer size={14} /> Export PDF
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">
            {vehicle.make} {vehicle.model} <span className="text-ink/40 font-normal">· {vehicle.year}</span>
          </h1>
          <StatusBadge status={vehicle.status} />
          <GroupBadge group={group} />
        </div>
        <p className="text-sm text-ink/50 mt-0.5">
          {vehicle.plate || 'No plate on file'} {driver && <>· driven by {driver.fullName}</>}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Cost / km"
          value={formatCostPerKm(metrics.costPerKm, settings.currency)}
          sub={`${formatKm(metrics.kmDriven)} driven`}
          meter
          tone="good"
        />
        <StatCard
          label="Fixed cost to date"
          value={formatCurrency(metrics.fixedCostToDate, settings.currency)}
          sub="Depreciation + insurance + tax"
          meter
        />
        <StatCard
          label="Logged expenses"
          value={formatCurrency(metrics.variableCostToDate, settings.currency)}
          sub={`${metrics.logCount} entries`}
          meter
          tone="warn"
        />
        <StatCard
          label="Total cost to date"
          value={formatCurrency(metrics.totalCost, settings.currency)}
          sub="Fixed + logged"
          meter
        />
      </div>

      {editing && (
        <VehicleEditForm
          vehicle={vehicle}
          groups={groups}
          onSave={(patch) => {
            updateVehicle(vehicle.id, patch)
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="card p-5 lg:col-span-3">
          <h2 className="text-sm font-medium mb-2">Cost / km over time</h2>
          <CostTrendChart series={series} currency={settings.currency} />
        </div>
        <div className="card p-5 lg:col-span-2">
          <h2 className="text-sm font-medium mb-2">Logged spend by category</h2>
          <CostBreakdownChart byCategory={metrics.byCategory} currency={settings.currency} />
        </div>
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-medium mb-3">Fixed cost assumptions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-xs text-ink/45">Price paid</div>
            <div className="meter mt-0.5">{formatCurrency(vehicle.purchasePrice, settings.currency)}</div>
          </div>
          <div>
            <div className="text-xs text-ink/45">Residual value</div>
            <div className="meter mt-0.5">{formatCurrency(vehicle.residualValue, settings.currency)}</div>
          </div>
          <div>
            <div className="text-xs text-ink/45">Annual depreciation</div>
            <div className="meter mt-0.5">{formatCurrency(depreciation, settings.currency)}</div>
          </div>
          <div>
            <div className="text-xs text-ink/45">Useful life</div>
            <div className="meter mt-0.5">{vehicle.usefulLifeYears} years</div>
          </div>
          <div>
            <div className="text-xs text-ink/45">Annual insurance</div>
            <div className="meter mt-0.5">{formatCurrency(vehicle.annualInsurance, settings.currency)}</div>
          </div>
          <div>
            <div className="text-xs text-ink/45">Annual tax</div>
            <div className="meter mt-0.5">{formatCurrency(vehicle.annualTax, settings.currency)}</div>
          </div>
          <div>
            <div className="text-xs text-ink/45">Odometer at purchase</div>
            <div className="meter mt-0.5">{formatKm(vehicle.initialOdometer)}</div>
          </div>
          <div>
            <div className="text-xs text-ink/45">Current odometer</div>
            <div className="meter mt-0.5">{formatKm(vehicle.currentOdometer)}</div>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-medium mb-3">Cost log for this vehicle</h2>
        {logs.length === 0 ? (
          <p className="text-sm text-ink/40 py-6 text-center">No cost entries logged yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink/40 border-b border-line">
                <th className="pb-2 font-normal">Date</th>
                <th className="pb-2 font-normal">Odometer</th>
                <th className="pb-2 font-normal">Category</th>
                <th className="pb-2 font-normal">Notes</th>
                <th className="pb-2 font-normal text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-line last:border-0">
                  <td className="py-2.5 text-ink/70">{formatDate(log.date)}</td>
                  <td className="py-2.5 meter text-ink/70">{formatKm(log.odometer)}</td>
                  <td className="py-2.5">{CATEGORY_LABELS[log.category] || log.category}</td>
                  <td className="py-2.5 text-ink/50">{log.notes || '—'}</td>
                  <td className="py-2.5 text-right meter">{formatCurrency(log.amount, settings.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

const inputClass =
  'mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300'

function VehicleEditForm({ vehicle, groups, onSave, onCancel }) {
  const [form, setForm] = useState({
    purchasePrice: vehicle.purchasePrice,
    residualValue: vehicle.residualValue,
    usefulLifeYears: vehicle.usefulLifeYears,
    annualInsurance: vehicle.annualInsurance,
    annualTax: vehicle.annualTax,
    currentOdometer: vehicle.currentOdometer,
    status: vehicle.status,
    groupId: vehicle.groupId || '',
  })

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSave({
      purchasePrice: Number(form.purchasePrice) || 0,
      residualValue: Number(form.residualValue) || 0,
      usefulLifeYears: Number(form.usefulLifeYears) || 1,
      annualInsurance: Number(form.annualInsurance) || 0,
      annualTax: Number(form.annualTax) || 0,
      currentOdometer: Number(form.currentOdometer) || 0,
      status: form.status,
      groupId: form.groupId || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="card p-5 grid grid-cols-2 sm:grid-cols-3 gap-4 no-print">
      <label className="block">
        <span className="text-xs text-ink/50">Status</span>
        <select className={inputClass} value={form.status} onChange={(e) => handleChange('status', e.target.value)}>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-xs text-ink/50">Group</span>
        <select className={inputClass} value={form.groupId} onChange={(e) => handleChange('groupId', e.target.value)}>
          <option value="">No group</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-xs text-ink/50">Price paid</span>
        <input type="number" step="0.01" className={inputClass} value={form.purchasePrice} onChange={(e) => handleChange('purchasePrice', e.target.value)} />
      </label>
      <label className="block">
        <span className="text-xs text-ink/50">Residual value</span>
        <input type="number" step="0.01" className={inputClass} value={form.residualValue} onChange={(e) => handleChange('residualValue', e.target.value)} />
      </label>
      <label className="block">
        <span className="text-xs text-ink/50">Useful life (years)</span>
        <input type="number" className={inputClass} value={form.usefulLifeYears} onChange={(e) => handleChange('usefulLifeYears', e.target.value)} />
      </label>
      <label className="block">
        <span className="text-xs text-ink/50">Annual insurance</span>
        <input type="number" step="0.01" className={inputClass} value={form.annualInsurance} onChange={(e) => handleChange('annualInsurance', e.target.value)} />
      </label>
      <label className="block">
        <span className="text-xs text-ink/50">Annual tax</span>
        <input type="number" step="0.01" className={inputClass} value={form.annualTax} onChange={(e) => handleChange('annualTax', e.target.value)} />
      </label>
      <label className="block">
        <span className="text-xs text-ink/50">Current odometer</span>
        <input type="number" className={inputClass} value={form.currentOdometer} onChange={(e) => handleChange('currentOdometer', e.target.value)} />
      </label>
      <div className="col-span-2 sm:col-span-3 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-lg text-ink/60 hover:bg-surface">
          Cancel
        </button>
        <button type="submit" className="px-4 py-2 text-sm rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700">
          Save changes
        </button>
      </div>
    </form>
  )
}
