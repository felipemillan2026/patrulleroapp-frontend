import { Navigate } from 'react-router-dom'

function RutaProtegida({ children, rol }) {
  const token = localStorage.getItem('token')
  const rolGuardado = localStorage.getItem('rol')

  // Sin token → login
  if (!token) return <Navigate to="/login" />

  // Tiene token pero el rol no coincide → redirige a su propio dashboard
  if (rol && rolGuardado !== rol) {
    if (rolGuardado === 'patrullero')  return <Navigate to="/patrullero" />
    if (rolGuardado === 'centralista') return <Navigate to="/centralista" />
    if (rolGuardado === 'supervisor')  return <Navigate to="/supervisor" />
    return <Navigate to="/login" />
  }

  return children
}

export default RutaProtegida
