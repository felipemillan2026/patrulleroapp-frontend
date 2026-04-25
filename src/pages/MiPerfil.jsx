import { useState, useEffect } from 'react'
import api from '../services/api'

function MiPerfil({ onVolver }) {
  const [datos, setDatos] = useState(null)
  const [form, setForm] = useState({ nombre: '', apellido: '', password: '', confirmar: '' })
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => { cargarPerfil() }, [])

  const cargarPerfil = async () => {
    try {
      const res = await api.get('/usuarios/mi-perfil')
      setDatos(res.data)
      setForm({ nombre: res.data.nombre, apellido: res.data.apellido, password: '', confirmar: '' })
    } catch {
      setError('Error al cargar el perfil')
    } finally {
      setCargando(false)
    }
  }

  const guardar = async (e) => {
    e.preventDefault()
    setMensaje('')
    setError('')

    if (form.password && form.password !== form.confirmar) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (form.password && form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    try {
      setGuardando(true)
      const body = { nombre: form.nombre, apellido: form.apellido }
      if (form.password) body.password = form.password

      const res = await api.put('/usuarios/mi-perfil', body)

      localStorage.setItem('nombre', res.data.nombre)
      localStorage.setItem('apellido', res.data.apellido)

      setMensaje('Perfil actualizado correctamente ✓')
      setForm(prev => ({ ...prev, password: '', confirmar: '' }))
      setDatos(res.data)
    } catch (e) {
      setError(e.response?.data || 'Error al actualizar el perfil')
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) return <div className="cargando">Cargando...</div>

  const rolBadge = { supervisor: '🛡️', centralista: '🎧', patrullero: '👮' }

  return (
    <div className="dashboard-main" style={{ maxWidth: '520px', margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button className="btn-secondary" onClick={onVolver}>← Volver</button>
        <h2 style={{ margin: 0, fontSize: '20px', color: '#1a2b4a' }}>Mi perfil</h2>
      </div>

      {/* Info actual */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '50%',
            background: '#1a2b4a', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px', fontWeight: 700, flexShrink: 0
          }}>
            {datos?.nombre?.[0]}{datos?.apellido?.[0]}
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '16px', color: '#1a2b4a' }}>
              {datos?.nombre} {datos?.apellido}
            </p>
            <p style={{ margin: '2px 0', fontSize: '13px', color: '#6b7280' }}>{datos?.email}</p>
            <span style={{
              display: 'inline-block', marginTop: '4px', padding: '2px 10px',
              borderRadius: '12px', fontSize: '12px', fontWeight: 600,
              background: '#e6f1fb', color: '#185fa5'
            }}>
              {rolBadge[datos?.rol]} {datos?.rol}
            </span>
          </div>
        </div>
      </div>

      {/* Formulario edición */}
      <div className="card" style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '15px', color: '#1a2b4a' }}>Editar datos</h3>

        {mensaje && (
          <div className="mensaje-info" style={{ marginBottom: '16px' }} onClick={() => setMensaje('')}>
            {mensaje} ✕
          </div>
        )}
        {error && (
          <div className="login-error" style={{ marginBottom: '16px' }}>{error}</div>
        )}

        <form onSubmit={guardar} className="solicitud-form">
          <div className="form-row">
            <div className="form-group">
              <label>Nombre</label>
              <input
                type="text"
                value={form.nombre}
                onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Apellido</label>
              <input
                type="text"
                value={form.apellido}
                onChange={e => setForm(p => ({ ...p, apellido: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Nueva contraseña <span style={{ color: '#9ca3af', fontWeight: 400 }}>(dejar vacío para no cambiar)</span></label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              placeholder="••••••••"
            />
          </div>

          <div className="form-group">
            <label>Confirmar nueva contraseña</label>
            <input
              type="password"
              value={form.confirmar}
              onChange={e => setForm(p => ({ ...p, confirmar: e.target.value }))}
              placeholder="••••••••"
              disabled={!form.password}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={guardando}>
            {guardando ? 'Guardando...' : '💾 Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default MiPerfil