import { NavLink } from 'react-router-dom'
import { Gauge, Car, Users, Receipt, Settings as SettingsIcon, Calculator } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'

const links = [
  { to: '/', label: 'Dashboard', icon: Gauge, end: true },
  { to: '/vehicles', label: 'Vehicles', icon: Car },
  { to: '/drivers', label: 'Drivers', icon: Users },
  { to: '/cost-log', label: 'Cost log', icon: Receipt },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

export default function Sidebar({ onOpenEstimate }) {
  const { settings } = useData()

  return (
    <aside className="w-60 shrink-0 bg-ink text-white/90 flex flex-col no-print">
      <div className="px-5 py-6 border-b border-white/10">
        <div className="meter text-2xl font-bold text-primary-300 leading-none">00.00</div>
        <div className="text-sm text-white/60 mt-1">{settings.companyName}</div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-primary-600/90 text-white'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={17} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 pb-4">
        <button
          onClick={onOpenEstimate}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm bg-primary-600/90 text-white hover:bg-primary-600 transition-colors"
        >
          <Calculator size={17} strokeWidth={2} />
          Trip estimate
        </button>
      </div>
      <div className="px-5 py-4 border-t border-white/10 text-xs text-white/40">
        Cost per km, tracked per vehicle.
      </div>
    </aside>
  )
}
