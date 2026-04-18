import { Navigate } from 'react-router-dom'

function RutaProtegida({ children, rol }) {
  const token = localStorage.getItem('token')
  const rolGuardado = localStorage.getItem('rol')

  if (!token) return <Navigate to="/login" />
  if (rol && rolGuardado !== rol) return <Navigate to="/login" />

  return children
}

export default RutaProtegida