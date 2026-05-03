import { Navigate } from 'react-router-dom'

function RutaProtegida({ children, rol }) {
  const token = localStorage.getItem('token')
  const rolGuardado = localStorage.getItem('rol')

  if (rol && rolGuardado !== rol) {
    if (rolGuardado === 'patrullero')  return <Navigate to="/patrullero" />
    if (rolGuardado === 'centralista') return <Navigate to="/centralista" />
    if (rolGuardado === 'supervisor')  return <Navigate to="/supervisor" />
  return <Navigate to="/login" />
  }
  
}

export default RutaProtegida