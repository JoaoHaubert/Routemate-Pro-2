import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Vehicles from './pages/Vehicles.jsx'
import VehicleDetail from './pages/VehicleDetail.jsx'
import Drivers from './pages/Drivers.jsx'
import CostLog from './pages/CostLog.jsx'
import Settings from './pages/Settings.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/vehicles" element={<Vehicles />} />
        <Route path="/vehicles/:id" element={<VehicleDetail />} />
        <Route path="/drivers" element={<Drivers />} />
        <Route path="/cost-log" element={<CostLog />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
