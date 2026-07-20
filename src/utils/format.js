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

export const VEHICLE_TYPE_LABELS = {
  car: 'Car',
  suv: 'SUV',
  van: 'Van',
  pickup_truck: 'Pickup truck',
  truck: 'Truck',
  taxi: 'Taxi',
  motorcycle: 'Motorcycle',
  other: 'Other',
}

export const STATUS_LABELS = {
  in_service: 'In service',
  idle: 'Idle',
  maintenance: 'Maintenance',
}

export const STATUS_STYLES = {
  in_service: 'bg-primary-50 text-primary-700',
  idle: 'bg-surface text-ink/50 border border-line',
  maintenance: 'bg-clay-100 text-clay-600',
}

export const GROUP_COLOR_SWATCHES = [
  '#0F6E56', // primary green
  '#A85E20', // clay
  '#993C1D', // rust
  '#4B5563', // slate
  '#6B4C8A', // plum
  '#2C7A7B', // teal
]
