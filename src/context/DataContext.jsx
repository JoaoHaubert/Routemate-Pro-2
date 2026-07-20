import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { rowToCamel, objectToSnake } from '../lib/caseMap.js'
import { useAuth } from './AuthContext.jsx'

const DataContext = createContext(null)

async function fetchTable(table, order) {
  let query = supabase.from(table).select('*')
  if (order) query = query.order(order)
  const { data, error } = await query
  if (error) throw error
  return (data || []).map(rowToCamel)
}

export function DataProvider({ children }) {
  const { session, profile } = useAuth()
  const ownerId = profile?.ownerId

  const [vehicles, setVehicles] = useState([])
  const [groups, setGroups] = useState([])
  const [drivers, setDrivers] = useState([])
  const [costLogs, setCostLogs] = useState([])
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  const reloadVehicles = useCallback(() => fetchTable('vehicles', 'created_at').then(setVehicles), [])
  const reloadGroups = useCallback(() => fetchTable('groups').then(setGroups), [])
  const reloadDrivers = useCallback(() => fetchTable('drivers', 'created_at').then(setDrivers), [])
  const reloadCostLogs = useCallback(() => fetchTable('cost_logs', 'date').then(setCostLogs), [])
  const reloadSettings = useCallback(async () => {
    const { data, error } = await supabase.from('settings').select('*').maybeSingle()
    if (error) throw error
    setSettings(rowToCamel(data))
  }, [])

  useEffect(() => {
    if (!session || !ownerId) {
      setVehicles([])
      setGroups([])
      setDrivers([])
      setCostLogs([])
      setSettings(null)
      setLoading(!!session)
      return
    }
    setLoading(true)
    Promise.all([reloadVehicles(), reloadGroups(), reloadDrivers(), reloadCostLogs(), reloadSettings()])
      .catch((err) => console.error('Failed to load fleet data', err))
      .finally(() => setLoading(false))
  }, [session, ownerId, reloadVehicles, reloadGroups, reloadDrivers, reloadCostLogs, reloadSettings])

  const addVehicle = useCallback(async (vehicle) => {
    // Generated client-side and inserted without .select(): a driver
    // inserting their own onboarding vehicle doesn't match the
    // vehicles_driver_select policy until their drivers row is linked
    // a moment later, and .select() on an insert asks Postgres to also
    // RETURNING the row — which requires it to already pass a SELECT
    // policy, so it would 42501 even though the insert itself is allowed.
    const newRow = {
      id: crypto.randomUUID(),
      status: 'in_service',
      groupId: null,
      ...vehicle,
      ownerId,
    }
    const { error } = await supabase.from('vehicles').insert(objectToSnake(newRow))
    if (error) {
      console.error('Failed to add vehicle', error)
      return null
    }
    await reloadVehicles()
    return newRow
  }, [ownerId, reloadVehicles])

  const updateVehicle = useCallback(async (id, patch) => {
    const { error } = await supabase.from('vehicles').update(objectToSnake(patch)).eq('id', id)
    if (error) return console.error('Failed to update vehicle', error)
    await reloadVehicles()
  }, [reloadVehicles])

  const deleteVehicle = useCallback(async (id) => {
    const { error } = await supabase.from('vehicles').delete().eq('id', id)
    if (error) return console.error('Failed to delete vehicle', error)
    await Promise.all([reloadVehicles(), reloadCostLogs(), reloadDrivers()])
  }, [reloadVehicles, reloadCostLogs, reloadDrivers])

  const addGroup = useCallback(async (group) => {
    const { error } = await supabase.from('groups').insert({ ...objectToSnake(group), owner_id: ownerId })
    if (error) return console.error('Failed to add group', error)
    await reloadGroups()
  }, [ownerId, reloadGroups])

  const updateGroup = useCallback(async (id, patch) => {
    const { error } = await supabase.from('groups').update(objectToSnake(patch)).eq('id', id)
    if (error) return console.error('Failed to update group', error)
    await reloadGroups()
  }, [reloadGroups])

  const deleteGroup = useCallback(async (id) => {
    const { error } = await supabase.from('groups').delete().eq('id', id)
    if (error) return console.error('Failed to delete group', error)
    await Promise.all([reloadGroups(), reloadVehicles()])
  }, [reloadGroups, reloadVehicles])

  const addDriver = useCallback(async (driver) => {
    const { error } = await supabase.from('drivers').insert({ ...objectToSnake(driver), owner_id: ownerId })
    if (error) return console.error('Failed to add driver', error)
    await reloadDrivers()
  }, [ownerId, reloadDrivers])

  const updateDriver = useCallback(async (id, patch) => {
    const { error } = await supabase.from('drivers').update(objectToSnake(patch)).eq('id', id)
    if (error) return console.error('Failed to update driver', error)
    await reloadDrivers()
  }, [reloadDrivers])

  const deleteDriver = useCallback(async (id) => {
    const { error } = await supabase.from('drivers').delete().eq('id', id)
    if (error) return console.error('Failed to delete driver', error)
    await reloadDrivers()
  }, [reloadDrivers])

  const addCostLog = useCallback(async (entry) => {
    const { error } = await supabase.from('cost_logs').insert({ ...objectToSnake(entry), owner_id: ownerId })
    if (error) return console.error('Failed to add cost log', error)

    const vehicle = vehicles.find((v) => v.id === entry.vehicleId)
    if (vehicle && Number(entry.odometer) > vehicle.currentOdometer) {
      await supabase.from('vehicles').update({ current_odometer: Number(entry.odometer) }).eq('id', vehicle.id)
    }
    await Promise.all([reloadCostLogs(), reloadVehicles()])
  }, [ownerId, vehicles, reloadCostLogs, reloadVehicles])

  const updateCostLog = useCallback(async (id, patch) => {
    const { error } = await supabase.from('cost_logs').update(objectToSnake(patch)).eq('id', id)
    if (error) return console.error('Failed to update cost log', error)
    await reloadCostLogs()
  }, [reloadCostLogs])

  const deleteCostLog = useCallback(async (id) => {
    const { error } = await supabase.from('cost_logs').delete().eq('id', id)
    if (error) return console.error('Failed to delete cost log', error)
    await reloadCostLogs()
  }, [reloadCostLogs])

  const updateSettings = useCallback(async (patch) => {
    const { error } = await supabase.from('settings').update(objectToSnake(patch)).eq('owner_id', ownerId)
    if (error) return console.error('Failed to update settings', error)
    await reloadSettings()
  }, [ownerId, reloadSettings])

  // Full refetch of every table. Mainly needed after a driver's vehicle_id
  // gets linked during onboarding — RLS only lets them see a vehicle once
  // that link exists, so the vehicles list fetched during the insert step
  // (before the link) misses it.
  const reload = useCallback(
    () => Promise.all([reloadVehicles(), reloadGroups(), reloadDrivers(), reloadCostLogs(), reloadSettings()]),
    [reloadVehicles, reloadGroups, reloadDrivers, reloadCostLogs, reloadSettings],
  )

  const value = {
    vehicles,
    groups,
    drivers,
    costLogs,
    settings: settings || {},
    loading,
    reload,
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
