import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import TripEstimateModal from './TripEstimateModal.jsx'
import { useData } from '../context/DataContext.jsx'

export default function Layout() {
  const [estimateOpen, setEstimateOpen] = useState(false)
  const { loading } = useData()

  return (
    <>
      <div className={`min-h-screen flex bg-surface text-ink ${estimateOpen ? 'print:hidden' : ''}`}>
        <Sidebar onOpenEstimate={() => setEstimateOpen(true)} />
        <main className="flex-1 min-w-0 px-8 py-7">
          {loading ? <div className="text-sm text-ink/50">Loading…</div> : <Outlet />}
        </main>
      </div>
      <TripEstimateModal open={estimateOpen} onClose={() => setEstimateOpen(false)} />
    </>
  )
}
