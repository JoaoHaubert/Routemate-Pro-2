// Thin wrapper around localStorage so it's a single place to swap for
// Supabase later — every read/write in the app goes through here.
const NAMESPACE = 'fleetcost:v1:'

export function loadFromStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(NAMESPACE + key)
    if (raw === null) return fallback
    return JSON.parse(raw)
  } catch (err) {
    console.error(`Failed to read "${key}" from storage`, err)
    return fallback
  }
}

export function saveToStorage(key, value) {
  try {
    window.localStorage.setItem(NAMESPACE + key, JSON.stringify(value))
  } catch (err) {
    console.error(`Failed to write "${key}" to storage`, err)
  }
}

export function clearAllStorage() {
  Object.keys(window.localStorage)
    .filter((k) => k.startsWith(NAMESPACE))
    .forEach((k) => window.localStorage.removeItem(k))
}
