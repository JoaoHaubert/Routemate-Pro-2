import { useState } from 'react'
import { Plus, Trash2, Copy, Check } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { GROUP_COLOR_SWATCHES } from '../utils/format.js'

const inputClass =
  'mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300'

const CURRENCIES = ['EUR', 'USD', 'GBP']

export default function Settings() {
  const { settings, updateSettings, vehicles, groups, addGroup, updateGroup, deleteGroup } = useData()
  const [form, setForm] = useState(settings)
  const [saved, setSaved] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupColor, setNewGroupColor] = useState(GROUP_COLOR_SWATCHES[0])
  const [codeCopied, setCodeCopied] = useState(false)

  function handleAddGroup(e) {
    e.preventDefault()
    if (!newGroupName.trim()) return
    addGroup({ name: newGroupName.trim(), color: newGroupColor })
    setNewGroupName('')
    setNewGroupColor(GROUP_COLOR_SWATCHES[0])
  }

  function handleSubmit(e) {
    e.preventDefault()
    updateSettings({
      ...form,
      defaultUsefulLifeYears: Number(form.defaultUsefulLifeYears) || 7,
      defaultResidualPct: Number(form.defaultResidualPct) || 0,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-ink/50 mt-0.5">Company profile and default cost assumptions.</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-5 space-y-4">
        <label className="block">
          <span className="text-xs text-ink/50">Company / fleet name</span>
          <input className={inputClass} value={form.companyName} onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))} />
        </label>
        <label className="block">
          <span className="text-xs text-ink/50">Currency</span>
          <select className={inputClass} value={form.currency} onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-ink/50">Default useful life for new vehicles (years)</span>
          <input
            type="number"
            className={inputClass}
            value={form.defaultUsefulLifeYears}
            onChange={(e) => setForm((p) => ({ ...p, defaultUsefulLifeYears: e.target.value }))}
          />
        </label>
        <label className="block">
          <span className="text-xs text-ink/50">Default residual value (% of purchase price)</span>
          <input
            type="number"
            className={inputClass}
            value={form.defaultResidualPct}
            onChange={(e) => setForm((p) => ({ ...p, defaultResidualPct: e.target.value }))}
          />
        </label>
        <div className="flex items-center gap-3 pt-2">
          <button type="submit" className="px-4 py-2 text-sm rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700">
            Save settings
          </button>
          {saved && <span className="text-xs text-primary-600">Saved</span>}
        </div>
      </form>

      <div className="card p-5">
        <h2 className="text-sm font-medium mb-1">Vehicle groups</h2>
        <p className="text-xs text-ink/50 mb-3">
          Group vehicles by fleet role, e.g. a group for trucks that constantly haul chemicals. Assign a vehicle to
          a group from the vehicle's own page or the add-vehicle form.
        </p>

        {groups.length > 0 && (
          <ul className="space-y-2 mb-4">
            {groups.map((g) => {
              const count = vehicles.filter((v) => v.groupId === g.id).length
              return (
                <li key={g.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-line">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
                    <input
                      className="text-sm bg-transparent focus:outline-none min-w-0"
                      value={g.name}
                      onChange={(e) => updateGroup(g.id, { name: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-ink/45">{count} vehicle{count === 1 ? '' : 's'}</span>
                    <button
                      onClick={() => {
                        if (confirm(`Remove group "${g.name}"? Vehicles keep their data but lose this group.`)) {
                          deleteGroup(g.id)
                        }
                      }}
                      className="text-ink/30 hover:text-alert-600 transition-colors"
                      aria-label={`Delete group ${g.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        <form onSubmit={handleAddGroup} className="flex items-center gap-2">
          <input
            className={`${inputClass} mt-0 flex-1`}
            placeholder="New group name"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
          <div className="flex items-center gap-1">
            {GROUP_COLOR_SWATCHES.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setNewGroupColor(color)}
                className={`w-6 h-6 rounded-full shrink-0 ${newGroupColor === color ? 'ring-2 ring-offset-1 ring-ink/60' : ''}`}
                style={{ backgroundColor: color }}
                aria-label={`Choose color ${color}`}
              />
            ))}
          </div>
          <button
            type="submit"
            className="flex items-center gap-1 text-sm px-3 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 shrink-0"
          >
            <Plus size={14} /> Add
          </button>
        </form>
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-medium mb-1">Driver access</h2>
        <p className="text-xs text-ink/50 mb-3">
          Share this fleet code with your drivers — they enter it when creating their account on the driver login
          page to join your fleet.
        </p>
        <div className="flex items-center gap-2">
          <span className="meter text-lg font-semibold tracking-wide px-3 py-2 rounded-lg bg-surface border border-line">
            {settings.fleetCode || '—'}
          </span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(settings.fleetCode || '')
              setCodeCopied(true)
              setTimeout(() => setCodeCopied(false), 1500)
            }}
            className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-line hover:bg-surface"
          >
            {codeCopied ? <Check size={14} /> : <Copy size={14} />}
            {codeCopied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  )
}
