import { useState, useEffect } from 'react'
import api from '../services/api'
import '../styles/dashboard.css'
import '../styles/supervisor.css'
import MiPerfil from './MiPerfil'

function DashboardSupervisor() {
  const nombre = localStorage.getItem('nombre')
  const apellido = localStorage.getItem('apellido')

  const [turnoActivo, setTurnoActivo] = useState(null)
  const [historial, setHistorial] = useState([])
  const [patrulleros, setPatrulleros] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [seleccionados, setSeleccionados] = useState([])
  const [tipoTurno, setTipoTurno] = useState('mañana')
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState('')
  const [seccion, setSeccion] = useState('turno')
  const [verPerfil, setVerPerfil] = useState(false)

  const [mostrarModal, setMostrarModal] = useState(false)
  const [usuarioEditando, setUsuarioEditando] = useState(null)
  const [formUsuario, setFormUsuario] = useState({
    nombre: '', apellido: '', email: '', password: '', idRol: 3
  })

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    setCargando(true)
    try {
      const turnoRes = await api.get('/turnos/activo')
      setTurnoActivo(turnoRes.data)
    } catch { setTurnoActivo(null) }
    try {
      const res = await api.get('/turnos/historial')
      setHistorial(res.data)
    } catch { setHistorial([]) }
    try {
      const patrRes = await api.get('/turnos/patrulleros')
      setPatrulleros(patrRes.data)
    } catch { setPatrulleros([]) }
    try {
      const usuRes = await api.get('/usuarios')
      setUsuarios(usuRes.data)
    } catch { setUsuarios([]) }
    setCargando(false)
  }

  const togglePatrullero = (id) => {
    setSeleccionados(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const abrirTurno = async () => {
    if (seleccionados.length === 0) {
      setMensaje('Debes seleccionar al menos un patrullero')
      return
    }
    try {
      await api.post('/turnos/abrir', { tipo: tipoTurno, idPatrulleros: seleccionados })
      setMensaje('Turno abierto correctamente ✓')
      setSeleccionados([])
      cargarDatos()
    } catch (e) {
      setMensaje(e.response?.data || 'Error al abrir turno')
    }
  }

  const cerrarTurno = async () => {
    if (!window.confirm('¿Confirmas el cierre del turno?')) return
    try {
      await api.put('/turnos/cerrar')
      setMensaje('Turno cerrado correctamente ✓')
      cargarDatos()
    } catch (e) {
      setMensaje(e.response?.data || 'Error al cerrar turno')
    }
  }

  const descargarReporte = async (idTurno) => {
    try {
      const token = localStorage.getItem('token')
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'
      const res = await fetch(
        `${BASE_URL}/turnos/${idTurno}/reporte`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) throw new Error('Error al descargar')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte_turno_${idTurno}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      setMensaje('Error al descargar el reporte')
    }
  }

  const abrirModalNuevo = () => {
    setUsuarioEditando(null)
    setFormUsuario({ nombre: '', apellido: '', email: '', password: '', idRol: 3 })
    setMostrarModal(true)
  }

  const abrirModalEditar = (u) => {
    setUsuarioEditando(u)
    setFormUsuario({
      nombre: u.nombre, apellido: u.apellido, email: u.email, password: '',
      idRol: u.rol === 'supervisor' ? 1 : u.rol === 'centralista' ? 2 : 3
    })
    setMostrarModal(true)
  }

  const guardarUsuario = async () => {
    try {
      if (usuarioEditando) {
        await api.put(`/usuarios/${usuarioEditando.idUsuario}`, formUsuario)
        setMensaje('Usuario actualizado ✓')
      } else {
        await api.post('/usuarios', formUsuario)
        setMensaje('Usuario creado ✓')
      }
      setMostrarModal(false)
      cargarDatos()
    } catch (e) {
      setMensaje(e.response?.data || 'Error al guardar usuario')
    }
  }

  const toggleActivo = async (id) => {
    try {
      await api.put(`/usuarios/${id}/toggle-activo`)
      cargarDatos()
    } catch { setMensaje('Error al cambiar estado') }
  }

  const cerrarSesion = () => {
    localStorage.clear()
    window.location.href = '/login'
  }

  if (cargando) return <div className="cargando">Cargando...</div>
  if (verPerfil) return <MiPerfil onVolver={() => setVerPerfil(false)} />

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <span className="header-logo">🛡️</span>
          <div>
            <h1>PatrulleroApp</h1>
            <p>Panel Supervisor</p>
          </div>
        </div>
        <div className="header-right">
          <span className="header-usuario">👤 {nombre} {apellido}</span>
          <button className="btn-perfil" onClick={() => setVerPerfil(true)}>
            👤 Mi perfil
          </button>
          <button className="btn-cerrar-sesion" onClick={cerrarSesion}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <nav className="supervisor-nav">
        <button className={`nav-btn ${seccion === 'turno' ? 'activo' : ''}`} onClick={() => setSeccion('turno')}>
          🕐 Gestión de Turno
        </button>
        <button className={`nav-btn ${seccion === 'historial' ? 'activo' : ''}`} onClick={() => setSeccion('historial')}>
          📋 Historial de Turnos
        </button>
        <button className={`nav-btn ${seccion === 'usuarios' ? 'activo' : ''}`} onClick={() => setSeccion('usuarios')}>
          👥 Gestión de Usuarios
        </button>
      </nav>

      <main className="dashboard-main">
        {mensaje && (
          <div className="mensaje-info" onClick={() => setMensaje('')}>{mensaje} ✕</div>
        )}

        {/* SECCIÓN TURNO */}
        {seccion === 'turno' && (
          <section className="card">
            <h2>Estado del Turno</h2>
            {turnoActivo ? (
              <div className="turno-activo">
                <div className="turno-badge activo">● TURNO ACTIVO</div>
                <div className="turno-info">
                  <p><strong>Tipo:</strong> {turnoActivo.tipo.toUpperCase()}</p>
                  <p><strong>Inicio:</strong> {new Date(turnoActivo.fechaInicio).toLocaleString('es-CL')}</p>
                  <p><strong>Supervisor:</strong> {turnoActivo.supervisorNombre}</p>
                </div>
                <h3>Patrulleros en turno</h3>
                <ul className="lista-patrulleros">
                  {turnoActivo.patrulleros.map(p => (
                    <li key={p.idUsuario}>👮 {p.nombre} {p.apellido}</li>
                  ))}
                </ul>
                <button className="btn-danger" onClick={cerrarTurno}>Cerrar Turno</button>
              </div>
            ) : (
              <div className="sin-turno">
                <div className="turno-badge inactivo">● SIN TURNO ACTIVO</div>
                <h3>Abrir nuevo turno</h3>
                <div className="form-group">
                  <label>Tipo de turno</label>
                  <select value={tipoTurno} onChange={e => setTipoTurno(e.target.value)}>
                    <option value="mañana">Mañana</option>
                    <option value="tarde">Tarde</option>
                    <option value="noche">Noche</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Seleccionar patrulleros</label>
                  <div className="lista-seleccion">
                    {patrulleros.length === 0
                      ? <p className="sin-datos">No hay patrulleros activos</p>
                      : patrulleros.map(p => (
                        <div
                          key={p.idUsuario}
                          className={`patrullero-item ${seleccionados.includes(p.idUsuario) ? 'seleccionado' : ''}`}
                          onClick={() => togglePatrullero(p.idUsuario)}
                        >
                          👮 {p.nombre} {p.apellido}
                          {seleccionados.includes(p.idUsuario) && <span> ✓</span>}
                        </div>
                      ))
                    }
                  </div>
                </div>
                <button className="btn-primary" onClick={abrirTurno}>Abrir Turno</button>
              </div>
            )}
          </section>
        )}

        {/* SECCIÓN HISTORIAL */}
        {seccion === 'historial' && (
          <section className="card">
            <h2>Historial de Turnos ({historial.length})</h2>
            {historial.length === 0 ? (
              <p className="sin-datos">No hay turnos cerrados aún.</p>
            ) : (
              <div className="historial-lista">
                {historial.map(t => (
                  <div key={t.idTurno} className="historial-item">
                    <div className="historial-item-info">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span className="id-badge">#{t.idTurno}</span>
                        <span style={{ fontWeight: 700, color: '#1a2b4a', fontSize: '15px' }}>
                          Turno {t.tipo.toUpperCase()}
                        </span>
                        <span className="badge badge-cerrada">CERRADO</span>
                      </div>
                      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '13px', color: '#6b7280' }}>
                        <span>🕐 Inicio: {new Date(t.fechaInicio).toLocaleString('es-CL')}</span>
                        <span>🔒 Cierre: {new Date(t.fechaCierre).toLocaleString('es-CL')}</span>
                        <span>👤 {t.supervisorNombre}</span>
                      </div>
                    </div>
                    <button
                      className="btn-primary"
                      style={{ width: 'auto', padding: '8px 18px', fontSize: '13px', whiteSpace: 'nowrap' }}
                      onClick={() => descargarReporte(t.idTurno)}
                    >
                      📄 Reporte PDF
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* SECCIÓN USUARIOS */}
        {seccion === 'usuarios' && (
          <section className="card">
            <div className="seccion-header">
              <h2>Gestión de Usuarios</h2>
              <button className="btn-primary btn-sm" onClick={abrirModalNuevo}>+ Nuevo Usuario</button>
            </div>
            <div className="usuarios-tabla">
              <div className="tabla-header">
                <span>Nombre</span><span>Email</span><span>Rol</span>
                <span>Estado</span><span>Acciones</span>
              </div>
              {usuarios.map(u => (
                <div key={u.idUsuario} className="tabla-fila">
                  <span>{u.nombre} {u.apellido}</span>
                  <span className="email-cell">{u.email}</span>
                  <span><span className={`rol-badge ${u.rol}`}>{u.rol}</span></span>
                  <span>
                    <span className={`estado-badge ${u.activo ? 'activo' : 'inactivo'}`}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </span>
                  <span className="acciones-cell">
                    <button className="btn-edit" onClick={() => abrirModalEditar(u)}>✏️</button>
                    <button
                      className={`btn-toggle ${u.activo ? 'desactivar' : 'activar'}`}
                      onClick={() => toggleActivo(u.idUsuario)}
                    >
                      {u.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* MODAL USUARIO */}
      {mostrarModal && (
        <div className="modal-overlay" onClick={() => setMostrarModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3>{usuarioEditando ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
            <div className="form-group">
              <label>Nombre</label>
              <input type="text" value={formUsuario.nombre}
                onChange={e => setFormUsuario(p => ({ ...p, nombre: e.target.value }))} placeholder="Nombre" />
            </div>
            <div className="form-group">
              <label>Apellido</label>
              <input type="text" value={formUsuario.apellido}
                onChange={e => setFormUsuario(p => ({ ...p, apellido: e.target.value }))} placeholder="Apellido" />
            </div>
            {!usuarioEditando && (
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={formUsuario.email}
                  onChange={e => setFormUsuario(p => ({ ...p, email: e.target.value }))} placeholder="correo@municipio.cl" />
              </div>
            )}
            <div className="form-group">
              <label>{usuarioEditando ? 'Nueva contraseña (opcional)' : 'Contraseña'}</label>
              <input type="password" value={formUsuario.password}
                onChange={e => setFormUsuario(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" />
            </div>
            <div className="form-group">
              <label>Rol</label>
              <select value={formUsuario.idRol}
                onChange={e => setFormUsuario(p => ({ ...p, idRol: parseInt(e.target.value) }))}>
                <option value={1}>Supervisor</option>
                <option value={2}>Centralista</option>
                <option value={3}>Patrullero</option>
              </select>
            </div>
            <div className="modal-acciones">
              <button className="btn-secondary" onClick={() => setMostrarModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={guardarUsuario}>
                {usuarioEditando ? 'Guardar cambios' : 'Crear usuario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardSupervisor