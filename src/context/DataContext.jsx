import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { loadFromStorage, saveToStorage } from '../lib/storage.js'
import { seedVehicles, seedGroups, seedDrivers, seedCostLogs, defaultSettings } from '../lib/seedData.js'

const DataContext = createContext(null)

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`
}

export function DataProvider({ children }) {
  const [vehicles, setVehicles] = useState(() => loadFromStorage('vehicles', seedVehicles))
  const [groups, setGroups] = useState(() => loadFromStorage('groups', seedGroups))
  const [drivers, setDrivers] = useState(() => loadFromStorage('drivers', seedDrivers))
  const [costLogs, setCostLogs] = useState(() => loadFromStorage('costLogs', seedCostLogs))
  const [settings, setSettings] = useState(() => loadFromStorage('settings', defaultSettings))

  useEffect(() => saveToStorage('vehicles', vehicles), [vehicles])
  useEffect(() => saveToStorage('groups', groups), [groups])
  useEffect(() => saveToStorage('drivers', drivers), [drivers])
  useEffect(() => saveToStorage('costLogs', costLogs), [costLogs])
  useEffect(() => saveToStorage('settings', settings), [settings])

  const addVehicle = useCallback((vehicle) => {
    setVehicles((prev) => [
      ...prev,
      { status: 'in_service', groupId: null, ...vehicle, id: makeId('v') },
    ])
  }, [])

  const updateVehicle = useCallback((id, patch) => {
    setVehicles((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)))
  }, [])

  const deleteVehicle = useCallback((id) => {
    setVehicles((prev) => prev.filter((v) => v.id !== id))
    setCostLogs((prev) => prev.filter((c) => c.vehicleId !== id))
    setDrivers((prev) => prev.map((d) => (d.vehicleId === id ? { ...d, vehicleId: null } : d)))
  }, [])

  const addGroup = useCallback((group) => {
    setGroups((prev) => [...prev, { ...group, id: makeId('g') }])
  }, [])

  const updateGroup = useCallback((id, patch) => {
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)))
  }, [])

  const deleteGroup = useCallback((id) => {
    setGroups((prev) => prev.filter((g) => g.id !== id))
    setVehicles((prev) => prev.map((v) => (v.groupId === id ? { ...v, groupId: null } : v)))
  }, [])

  const addDriver = useCallback((driver) => {
    setDrivers((prev) => [...prev, { ...driver, id: makeId('d') }])
  }, [])

  const updateDriver = useCallback((id, patch) => {
    setDrivers((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)))
  }, [])

  const deleteDriver = useCallback((id) => {
    setDrivers((prev) => prev.filter((d) => d.id !== id))
  }, [])

  const addCostLog = useCallback((entry) => {
    setCostLogs((prev) => [...prev, { ...entry, id: makeId('c') }])
    // Keep the vehicle's current odometer in sync with the latest entry.
    setVehicles((prev) =>
      prev.map((v) =>
        v.id === entry.vehicleId && entry.odometer > v.currentOdometer
          ? { ...v, currentOdometer: Number(entry.odometer) }
          : v,
      ),
    )
  }, [])

  const updateCostLog = useCallback((id, patch) => {
    setCostLogs((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }, [])

  const deleteCostLog = useCallback((id) => {
    setCostLogs((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const updateSettings = useCallback((patch) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }, [])

  const value = {
    vehicles,
    groups,
    drivers,
    costLogs,
    settings,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    addGroup,
    updateGroup,
    deleteGroup,
    addDriver,
    updateDriver,
    deleteDriver,
    addCostLog,
    updateCostLog,
    deleteCostLog,
    updateSettings,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within a DataProvider')
  return ctx
}
