import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import DashboardSupervisor from './pages/DashboardSupervisor'
import DashboardCentralista from './pages/DashboardCentralista'
import DashboardPatrullero from './pages/DashboardPatrullero'
import RutaProtegida from './components/RutaProtegida'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/supervisor" element={
        <RutaProtegida rol="supervisor">
          <DashboardSupervisor />
        </RutaProtegida>
      } />
      <Route path="/centralista" element={
        <RutaProtegida rol="centralista">
          <DashboardCentralista />
        </RutaProtegida>
      } />
      <Route path="/patrullero" element={
        <RutaProtegida rol="patrullero">
          <DashboardPatrullero />
        </RutaProtegida>
      } />
    </Routes>
  )
}

export default App