import { useState, useEffect } from 'react'
import api from '../services/api'
import '../styles/dashboard.css'
import '../styles/centralista.css'

function DashboardCentralista() {
  const nombre = localStorage.getItem('nombre')
  const apellido = localStorage.getItem('apellido')

  const [solicitudes, setSolicitudes] = useState([])
  const [turnoActivo, setTurnoActivo] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')

  useEffect(() => {
    cargarDatos()
    // Refresco automático cada 30 segundos
    const intervalo = setInterval(cargarDatos, 30000)
    return () => clearInterval(intervalo)
  }, [])

  const cargarDatos = async () => {
    try {
      const turnoRes = await api.get('/turnos/activo')
      setTurnoActivo(turnoRes.data)
    } catch {
      setTurnoActivo(null)
    }
    try {
      const solRes = await api.get('/solicitudes/turno-activo')
      setSolicitudes(solRes.data)
    } catch {
      setSolicitudes([])
    }
    setCargando(false)
  }

  const cambiarEstado = async (idSolicitud, nuevoEstado) => {
    try {
      await api.put(`/solicitudes/${idSolicitud}/estado?estado=${nuevoEstado}`)
      setMensaje(`Solicitud #${idSolicitud} actualizada a "${nuevoEstado.replace('_', ' ')}"`)
      cargarDatos()
    } catch {
      setMensaje('Error al actualizar estado')
    }
  }

  const cerrarSesion = () => {
    localStorage.clear()
    window.location.href = '/login'
  }

  const solicitudesFiltradas = filtroEstado === 'todos'
    ? solicitudes
    : solicitudes.filter(s => s.estado === filtroEstado)

  const contarPor = (estado) => solicitudes.filter(s => s.estado === estado).length

  const getBadgeClass = (estado) => {
    const clases = {
      pendiente: 'badge-pendiente',
      en_proceso: 'badge-proceso',
      cerrada: 'badge-cerrada'
    }
    return clases[estado] || 'badge-pendiente'
  }

  if (cargando) return <div className="cargando">Cargando...</div>

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <span className="header-logo">🛡️</span>
          <div>
            <h1>PatrulleroApp</h1>
            <p>Panel Centralista</p>
          </div>
        </div>
        <div className="header-right">
          <span className="header-usuario">🎧 {nombre} {apellido}</span>
          <button className="btn-cerrar-sesion" onClick={cerrarSesion}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        {mensaje && (
          <div className="mensaje-info" onClick={() => setMensaje('')}>
            {mensaje} ✕
          </div>
        )}

        {/* Info turno activo */}
        {turnoActivo ? (
          <div className="turno-status activo">
            ● Turno activo — {turnoActivo.tipo.toUpperCase()} |
            Supervisor: {turnoActivo.supervisorNombre} |
            Inicio: {new Date(turnoActivo.fechaInicio).toLocaleTimeString('es-CL')}
          </div>
        ) : (
          <div className="turno-status inactivo">
            ● Sin turno activo
          </div>
        )}

        {/* Indicadores */}
        <div className="indicadores-grid">
          <div className="indicador">
            <span className="indicador-numero">{solicitudes.length}</span>
            <span className="indicador-label">Total</span>
          </div>
          <div className="indicador amarillo">
            <span className="indicador-numero">{contarPor('pendiente')}</span>
            <span className="indicador-label">Pendientes</span>
          </div>
          <div className="indicador azul">
            <span className="indicador-numero">{contarPor('en_proceso')}</span>
            <span className="indicador-label">En proceso</span>
          </div>
          <div className="indicador gris">
            <span className="indicador-numero">{contarPor('cerrada')}</span>
            <span className="indicador-label">Cerradas</span>
          </div>
        </div>

        {/* Filtros */}
        <div className="filtros-bar">
          <span className="filtros-label">Filtrar:</span>
          {['todos', 'pendiente', 'en_proceso', 'cerrada'].map(f => (
            <button
              key={f}
              className={`filtro-btn ${filtroEstado === f ? 'activo' : ''}`}
              onClick={() => setFiltroEstado(f)}
            >
              {f === 'todos' ? 'Todos' :
               f === 'pendiente' ? 'Pendientes' :
               f === 'en_proceso' ? 'En proceso' : 'Cerradas'}
            </button>
          ))}
          <button className="btn-refrescar" onClick={cargarDatos}>
            🔄 Refrescar
          </button>
        </div>

        {/* Lista de solicitudes */}
        <section className="card">
          <h2>
            Solicitudes del turno
            {turnoActivo && ` — ${solicitudesFiltradas.length} resultado(s)`}
          </h2>

          {!turnoActivo ? (
            <p className="sin-datos">No hay turno activo en este momento.</p>
          ) : solicitudesFiltradas.length === 0 ? (
            <p className="sin-datos">No hay solicitudes con ese filtro.</p>
          ) : (
            <div className="solicitudes-tabla">
              {solicitudesFiltradas.map(s => (
                <div key={s.idSolicitud} className="solicitud-card">
                  <div className="solicitud-card-header">
                    <div className="solicitud-card-id">
                      <span className="id-badge">#{s.idSolicitud}</span>
                      <span className={`badge ${getBadgeClass(s.estado)}`}>
                        {s.estado.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <span className="solicitud-fecha">
                      {new Date(s.fechaHora).toLocaleString('es-CL')}
                    </span>
                  </div>

                  <p className="solicitud-desc">{s.descripcion}</p>

                  <div className="solicitud-detalles">
                    <span>👮 {s.patrulleroNombre}</span>
                    <span>🏢 {s.departamentoNombre}</span>
                    {s.direccion && <span>📍 {s.direccion}</span>}
                  </div>

                  {s.tiposCaso?.length > 0 && (
                    <div className="tipos-tags">
                      {s.tiposCaso.map((t, i) => (
                        <span key={i} className="tipo-tag">{t}</span>
                      ))}
                    </div>
                  )}

                  {/* Acciones de cambio de estado */}
                  <div className="solicitud-acciones">
                    <span className="acciones-label">Cambiar estado:</span>
                    <div className="acciones-btns">
                      {s.estado !== 'pendiente' && (
                        <button
                          className="btn-estado pendiente"
                          onClick={() => cambiarEstado(s.idSolicitud, 'pendiente')}
                        >
                          Pendiente
                        </button>
                      )}
                      {s.estado !== 'en_proceso' && (
                        <button
                          className="btn-estado proceso"
                          onClick={() => cambiarEstado(s.idSolicitud, 'en_proceso')}
                        >
                          En proceso
                        </button>
                      )}
                      {s.estado !== 'cerrada' && (
                        <button
                          className="btn-estado cerrar"
                          onClick={() => cambiarEstado(s.idSolicitud, 'cerrada')}
                        >
                          Cerrar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default DashboardCentralista