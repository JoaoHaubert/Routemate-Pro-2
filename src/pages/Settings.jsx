import { useState } from 'react'
import { useData } from '../context/DataContext.jsx'
import { clearAllStorage } from '../lib/storage.js'

const inputClass =
  'mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300'

const CURRENCIES = ['EUR', 'USD', 'GBP']

export default function Settings() {
  const { settings, updateSettings } = useData()
  const [form, setForm] = useState(settings)
  const [saved, setSaved] = useState(false)

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
        <h2 className="text-sm font-medium mb-1">Local data</h2>
        <p className="text-xs text-ink/50 mb-3">
          Everything in this app is stored in your browser's local storage. Clearing it resets the app back to the
          demo dataset — nothing is sent anywhere, since there's no backend wired up yet.
        </p>
        <button
          onClick={() => {
            if (confirm('Reset all data back to the demo dataset? This cannot be undone.')) {
              clearAllStorage()
              window.location.reload()
            }
          }}
          className="text-sm text-alert-600 font-medium hover:underline"
        >
          Reset to demo data
        </button>
      </div>
    </div>
  )
}
