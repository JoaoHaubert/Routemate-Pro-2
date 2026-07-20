// Supabase/Postgres columns are snake_case; the rest of the app works
// in camelCase objects (vehicle.purchasePrice, log.vehicleId, ...).
// These convert row <-> object at the data-access boundary only.

function snakeToCamel(key) {
  return key.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase())
}

function camelToSnake(key) {
  return key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
}

export function rowToCamel(row) {
  if (!row) return row
  return Object.fromEntries(Object.entries(row).map(([k, v]) => [snakeToCamel(k), v]))
}

export function objectToSnake(obj) {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [camelToSnake(k), v]))
}
