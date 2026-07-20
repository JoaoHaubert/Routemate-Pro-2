// All cost-per-km logic lives here so it stays identical regardless of
// where the data ultimately comes from (mock data today, Supabase later).

const MS_PER_YEAR = 1000 * 60 * 60 * 24 * 365
const MS_PER_DAY = 1000 * 60 * 60 * 24

export function yearsSince(dateString, asOf = new Date()) {
  const start = new Date(dateString)
  const diff = asOf - start
  return Math.max(diff / MS_PER_YEAR, 1 / 365)
}

export function annualDepreciation(vehicle) {
  const depreciable = Math.max(vehicle.purchasePrice - vehicle.residualValue, 0)
  return depreciable / Math.max(vehicle.usefulLifeYears, 1)
}

export function annualFixedCost(vehicle) {
  return vehicle.annualInsurance + vehicle.annualTax + annualDepreciation(vehicle)
}

export function vehicleCostLogs(vehicleId, costLogs) {
  return costLogs
    .filter((l) => l.vehicleId === vehicleId)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
}

// Full lifetime breakdown for a single vehicle, used on the vehicle
// detail page and the dashboard's fleet rollup.
export function computeVehicleMetrics(vehicle, costLogs) {
  const logs = vehicleCostLogs(vehicle.id, costLogs)
  const fixedPerYear = annualFixedCost(vehicle)
  const fixedCostToDate = fixedPerYear * yearsSince(vehicle.purchaseDate)
  const variableCostToDate = logs.reduce((sum, l) => sum + Number(l.amount), 0)
  const totalCost = fixedCostToDate + variableCostToDate
  const kmDriven = Math.max(vehicle.currentOdometer - vehicle.initialOdometer, 1)
  const costPerKm = totalCost / kmDriven

  const byCategory = logs.reduce((acc, l) => {
    acc[l.category] = (acc[l.category] || 0) + Number(l.amount)
    return acc
  }, {})

  return {
    fixedPerYear,
    fixedCostToDate,
    variableCostToDate,
    totalCost,
    kmDriven,
    costPerKm,
    byCategory,
    logCount: logs.length,
  }
}

// Cost-per-km as it evolved at each cost-log entry, using that entry's
// odometer reading. Lets the vehicle detail page chart the trend line.
export function computeCostPerKmSeries(vehicle, costLogs) {
  const logs = vehicleCostLogs(vehicle.id, costLogs)
  const fixedPerYear = annualFixedCost(vehicle)
  let cumulativeVariable = 0

  return logs
    .filter((l) => l.odometer && l.odometer > vehicle.initialOdometer)
    .map((l) => {
      cumulativeVariable += Number(l.amount)
      const km = Math.max(l.odometer - vehicle.initialOdometer, 1)
      const fixedToDate = fixedPerYear * yearsSince(vehicle.purchaseDate, new Date(l.date))
      const costPerKm = (cumulativeVariable + fixedToDate) / km
      return { date: l.date, costPerKm, km }
    })
}

// Cost incurred between a vehicle's last odometer checkpoint and a new
// reading — what the driver mobile app shows right after "Update odometer".
export function computeIntervalCost(vehicle, costLogs, toOdometer, toDate = new Date()) {
  const fromDate = new Date(vehicle.lastOdometerUpdateAt || vehicle.purchaseDate)
  const fromOdometer = vehicle.lastOdometerUpdateValue ?? vehicle.initialOdometer

  const variableCost = vehicleCostLogs(vehicle.id, costLogs)
    .filter((l) => new Date(l.date) > fromDate)
    .reduce((sum, l) => sum + Number(l.amount), 0)

  const days = Math.max((toDate - fromDate) / MS_PER_DAY, 1 / 24)
  const fixedCost = annualFixedCost(vehicle) * (days / 365)
  const totalCost = variableCost + fixedCost
  const km = Math.max(toOdometer - fromOdometer, 0)
  const costPerKm = km > 0 ? totalCost / km : 0

  return { km, days, variableCost, fixedCost, totalCost, costPerKm }
}

// Fleet-wide rollup for the dashboard.
export function computeFleetMetrics(vehicles, costLogs) {
  const perVehicle = vehicles.map((v) => ({
    vehicle: v,
    metrics: computeVehicleMetrics(v, costLogs),
  }))

  const totalCost = perVehicle.reduce((s, p) => s + p.metrics.totalCost, 0)
  const totalKm = perVehicle.reduce((s, p) => s + p.metrics.kmDriven, 0)
  const fleetCostPerKm = totalKm > 0 ? totalCost / totalKm : 0

  const now = new Date()
  const thisMonthSpend = costLogs
    .filter((l) => {
      const d = new Date(l.date)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    .reduce((s, l) => s + Number(l.amount), 0)

  const byCategory = costLogs.reduce((acc, l) => {
    acc[l.category] = (acc[l.category] || 0) + Number(l.amount)
    return acc
  }, {})

  return { perVehicle, totalCost, totalKm, fleetCostPerKm, thisMonthSpend, byCategory }
}
