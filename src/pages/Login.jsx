import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import PatrullaIcon from '../components/PatrullaIcon'
import '../styles/login.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setCargando(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      const { token, nombre, apellido, rol } = res.data
      localStorage.setItem('token', token)
      localStorage.setItem('rol', rol)
      localStorage.setItem('nombre', nombre)
      localStorage.setItem('apellido', apellido)
      if (rol === 'supervisor') navigate('/supervisor')
      else if (rol === 'centralista') navigate('/centralista')
      else if (rol === 'patrullero') navigate('/patrullero')
    } catch (err) {
      setError('Correo o contraseña incorrectos')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <PatrullaIcon size={64} />
          </div>
          <h1>PatrulleroApp</h1>
          <p>Sistema de Gestión Municipal</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Correo institucional</label>
            <input id="email" type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="correo@municipio.cl" required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input id="password" type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required />
          </div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="login-btn" disabled={cargando}>
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
        <div className="login-footer">
          <p>Municipalidad · Acceso restringido</p>
        </div>
      </div>
    </div>
  )
}

export default Login
