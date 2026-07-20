import { Outlet } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

export default function MobileLayout() {
  const { signOut, profile } = useAuth()

  return (
    <div className="min-h-screen bg-surface text-ink flex flex-col">
      <header className="flex items-center justify-between px-4 py-4 bg-ink text-white/90">
        <div>
          <div className="meter text-lg font-bold text-primary-300 leading-none">00.00</div>
          <div className="text-xs text-white/60 mt-0.5">{profile?.fullName || 'Driver'}</div>
        </div>
        <button onClick={signOut} className="p-2 text-white/70 hover:text-white" aria-label="Sign out">
          <LogOut size={18} />
        </button>
      </header>
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
