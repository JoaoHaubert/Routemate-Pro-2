export function formatCurrency(value, currency = 'EUR') {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value || 0)
}

export function formatCostPerKm(value, currency = 'EUR') {
  return `${formatCurrency(value, currency)}/km`
}

export function formatKm(value) {
  return `${new Intl.NumberFormat('en-IE').format(Math.round(value || 0))} km`
}

export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-IE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export const CATEGORY_LABELS = {
  fuel: 'Fuel',
  maintenance: 'Maintenance',
  repair: 'Repair',
  tires: 'Tires',
  toll: 'Tolls',
  fine: 'Fines',
  cleaning: 'Cleaning',
  other: 'Other',
}
