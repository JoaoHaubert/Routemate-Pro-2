import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext.jsx'
import { computeFleetMetrics } from '../lib/calculations.js'
import StatCard from '../components/StatCard.jsx'
import CostBreakdownChart from '../components/CostBreakdownChart.jsx'
import { formatCurrency, formatCostPerKm, formatKm, formatDate, CATEGORY_LABELS } from '../utils/format.js'

export default function Dashboard() {
  const { vehicles, drivers, costLogs, settings } = useData()
  const { perVehicle, totalCost, totalKm, fleetCostPerKm, thisMonthSpend, byCategory } =
    computeFleetMetrics(vehicles, costLogs)

  const rankedVehicles = [...perVehicle].sort((a, b) => b.metrics.costPerKm - a.metrics.costPerKm)
  const recentLogs = [...costLogs].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-ink/50 mt-0.5">Fleet-wide cost per km, at a glance.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Fleet cost / km"
          value={formatCurrency(fleetCostPerKm, settings.currency)}
          sub="Blended across all vehicles"
          meter
          tone="good"
        />
        <StatCard label="Vehicles" value={vehicles.length} sub={`${drivers.length} drivers`} />
        <StatCard
          label="Total km logged"
          value={formatKm(totalKm)}
          sub={`${formatCurrency(totalCost, settings.currency)} total cost`}
          meter
        />
        <StatCard
          label="This month's spend"
          value={formatCurrency(thisMonthSpend, settings.currency)}
          sub="Cost log entries, current month"
          meter
          tone="warn"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="card p-5 lg:col-span-2">
          <h2 className="text-sm font-medium mb-2">Spend by category</h2>
          <CostBreakdownChart byCategory={byCategory} currency={settings.currency} />
        </div>

        <div className="card p-5 lg:col-span-3">
          <h2 className="text-sm font-medium mb-3">Vehicles by cost / km</h2>
          <div className="space-y-2">
            {rankedVehicles.map(({ vehicle, metrics }) => (
              <Link
                key={vehicle.id}
                to={`/vehicles/${vehicle.id}`}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-surface transition-colors"
              >
                <div>
                  <div className="text-sm font-medium">
                    {vehicle.make} {vehicle.model}
                  </div>
                  <div className="text-xs text-ink/45">{vehicle.plate}</div>
                </div>
                <div className="meter text-sm font-semibold text-primary-700">
                  {formatCostPerKm(metrics.costPerKm, settings.currency)}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-medium mb-3">Recent cost log entries</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-ink/40 border-b border-line">
              <th className="pb-2 font-normal">Date</th>
              <th className="pb-2 font-normal">Vehicle</th>
              <th className="pb-2 font-normal">Category</th>
              <th className="pb-2 font-normal text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {recentLogs.map((log) => {
              const vehicle = vehicles.find((v) => v.id === log.vehicleId)
              return (
                <tr key={log.id} className="border-b border-line last:border-0">
                  <td className="py-2.5 text-ink/70">{formatDate(log.date)}</td>
                  <td className="py-2.5">{vehicle ? `${vehicle.make} ${vehicle.model}` : '—'}</td>
                  <td className="py-2.5 text-ink/70">{CATEGORY_LABELS[log.category] || log.category}</td>
                  <td className="py-2.5 text-right meter">{formatCurrency(log.amount, settings.currency)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
