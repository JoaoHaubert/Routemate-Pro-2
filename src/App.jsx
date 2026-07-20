import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import MobileLayout from './components/MobileLayout.jsx'
import RequireAuth from './components/RequireAuth.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Vehicles from './pages/Vehicles.jsx'
import VehicleDetail from './pages/VehicleDetail.jsx'
import Drivers from './pages/Drivers.jsx'
import CostLog from './pages/CostLog.jsx'
import Settings from './pages/Settings.jsx'
import DriveLogin from './pages/drive/DriveLogin.jsx'
import DriveHome from './pages/drive/DriveHome.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/drive/login" element={<DriveLogin />} />
      <Route
        element={
          <RequireAuth role="admin">
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/vehicles" element={<Vehicles />} />
        <Route path="/vehicles/:id" element={<VehicleDetail />} />
        <Route path="/drivers" element={<Drivers />} />
        <Route path="/cost-log" element={<CostLog />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route
        element={
          <RequireAuth role="driver">
            <MobileLayout />
          </RequireAuth>
        }
      >
        <Route path="/drive" element={<DriveHome />} />
      </Route>
    </Routes>
  )
}
