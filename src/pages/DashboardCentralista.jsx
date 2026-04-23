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
  const [filtro, setFiltro] = useState('todos')
  const [solicitudEditando, setSolicitudEditando] = useState(null)
  const [patrullerosActivos, setPatrullerosActivos] = useState([])
  const [tiposCasoEdicion, setTiposCasoEdicion] = useState([])

  const [formEdicion, setFormEdicion] = useState({
    descripcion: '',
    direccion: '',
    notas: '',
    idTiposCaso: [],
    idPatrullero: ''
  })

  useEffect(() => {
    cargarDatos()
    const intervalo = setInterval(cargarDatos, 30000)
    return () => clearInterval(intervalo)
  }, [])

  const cargarDatos = async () => {
    try {
      const turnoRes = await api.get('/turnos/activo')
      setTurnoActivo(turnoRes.data)
    } catch { setTurnoActivo(null) }
    try {
      const solRes = await api.get('/solicitudes/turno-activo')
      setSolicitudes(solRes.data)
    } catch { setSolicitudes([]) }
    setCargando(false)
  }

  const cargarPatrullerosActivos = async () => {
    try {
      const res = await api.get('/turnos/patrulleros-activos')
      setPatrullerosActivos(res.data)
    } catch { setPatrullerosActivos([]) }
  }

  const cargarTiposCasoEdicion = async (idDepartamento) => {
    try {
      const res = await api.get(`/departamentos/${idDepartamento}/tipos-caso`)
      setTiposCasoEdicion(res.data)
    } catch { setTiposCasoEdicion([]) }
  }

  const abrirEdicion = async (solicitud) => {
    setSolicitudEditando(solicitud)
    setFormEdicion({
      descripcion: solicitud.descripcion,
      direccion: solicitud.direccion || '',
      notas: solicitud.notas || '',
      idTiposCaso: [],
      idPatrullero: solicitud.patrulleroId || ''
    })
    await cargarPatrullerosActivos()
    if (solicitud.departamentoId) {
      await cargarTiposCasoEdicion(solicitud.departamentoId)
    }
  }

  const cerrarEdicion = () => {
    setSolicitudEditando(null)
    setFormEdicion({
      descripcion: '',
      direccion: '',
      notas: '',
      idTiposCaso: [],
      idPatrullero: ''
    })
    setTiposCasoEdicion([])
    setPatrullerosActivos([])
  }

  const toggleTipoCasoEdicion = (id) => {
    setFormEdicion(prev => ({
      ...prev,
      idTiposCaso: prev.idTiposCaso.includes(id)
        ? prev.idTiposCaso.filter(t => t !== id)
        : [...prev.idTiposCaso, id]
    }))
  }

  const guardarEdicion = async () => {
    try {
      await api.put(`/solicitudes/${solicitudEditando.idSolicitud}/centralista`, {
        descripcion: formEdicion.descripcion,
        direccion: formEdicion.direccion,
        notas: formEdicion.notas,
        idTiposCaso: formEdicion.idTiposCaso,
        idPatrullero: formEdicion.idPatrullero ? parseInt(formEdicion.idPatrullero) : null
      })
      setMensaje('Solicitud actualizada correctamente ✓')
      cerrarEdicion()
      cargarDatos()
    } catch (e) {
      setMensaje(e.response?.data || 'Error al actualizar solicitud')
    }
  }

  const cambiarEstado = async (id, estado) => {
    try {
      await api.put(`/solicitudes/${id}/estado?estado=${estado}`)
      setMensaje(`Solicitud #${id} actualizada a "${estado.replace('_', ' ')}"`)
      cargarDatos()
    } catch { setMensaje('Error al actualizar estado') }
  }

  const cerrarSesion = () => {
    localStorage.clear()
    window.location.href = '/login'
  }

  const solicitudesFiltradas = filtro === 'todos'
    ? solicitudes
    : solicitudes.filter(s => s.estado === filtro)

  const contarEstado = (estado) => solicitudes.filter(s => s.estado === estado).length

  const getEstadoBadge = (estado) => ({
    pendiente: 'badge-pendiente',
    en_proceso: 'badge-proceso',
    cerrada: 'badge-cerrada'
  })[estado] || 'badge-pendiente'

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

        {/* Estado turno */}
        {turnoActivo ? (
          <div className="turno-status activo">
            ● Turno activo — {turnoActivo.tipo.toUpperCase()} | Supervisor: {turnoActivo.supervisorNombre} | Inicio: {new Date(turnoActivo.fechaInicio).toLocaleTimeString('es-CL')}
          </div>
        ) : (
          <div className="turno-status inactivo">● Sin turno activo</div>
        )}

        {/* Indicadores */}
        <div className="indicadores-grid">
          <div className="indicador">
            <span className="indicador-numero">{solicitudes.length}</span>
            <span className="indicador-label">Total</span>
          </div>
          <div className="indicador amarillo">
            <span className="indicador-numero">{contarEstado('pendiente')}</span>
            <span className="indicador-label">Pendientes</span>
          </div>
          <div className="indicador azul">
            <span className="indicador-numero">{contarEstado('en_proceso')}</span>
            <span className="indicador-label">En proceso</span>
          </div>
          <div className="indicador gris">
            <span className="indicador-numero">{contarEstado('cerrada')}</span>
            <span className="indicador-label">Cerradas</span>
          </div>
        </div>

        {/* Filtros */}
        <div className="filtros-bar">
          <span className="filtros-label">Filtrar:</span>
          {['todos', 'pendiente', 'en_proceso', 'cerrada'].map(f => (
            <button
              key={f}
              className={`filtro-btn ${filtro === f ? 'activo' : ''}`}
              onClick={() => setFiltro(f)}
            >
              {f === 'todos' ? 'Todos' : f === 'pendiente' ? 'Pendientes' : f === 'en_proceso' ? 'En proceso' : 'Cerradas'}
            </button>
          ))}
          <button className="btn-refrescar" onClick={cargarDatos}>🔄 Refrescar</button>
        </div>

        {/* Lista de solicitudes */}
        <section className="card">
          <h2>
            Solicitudes del turno{turnoActivo && ` — ${solicitudesFiltradas.length} resultado(s)`}
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
                      <span className={`badge ${getEstadoBadge(s.estado)}`}>
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

                  {/* Notas */}
                  {s.notas && (
                    <div className="notas-box">
                      <strong>📝 Notas:</strong> {s.notas}
                    </div>
                  )}

                  {/* Imágenes */}
                  {s.urlsImagenes?.length > 0 && (
                    <div className="imagenes-mini" style={{ marginTop: '8px' }}>
                      {s.urlsImagenes.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer">
                          <img src={url} alt={`img-${i}`} className="imagen-mini" />
                        </a>
                      ))}
                      <span className="imagenes-count">📷 {s.urlsImagenes.length} imagen(es)</span>
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="solicitud-acciones">
                    <span className="acciones-label">Cambiar estado:</span>
                    <div className="acciones-btns">
                      {s.estado !== 'pendiente' && (
                        <button className="btn-estado pendiente" onClick={() => cambiarEstado(s.idSolicitud, 'pendiente')}>
                          Pendiente
                        </button>
                      )}
                      {s.estado !== 'en_proceso' && (
                        <button className="btn-estado proceso" onClick={() => cambiarEstado(s.idSolicitud, 'en_proceso')}>
                          En proceso
                        </button>
                      )}
                      {s.estado !== 'cerrada' && (
                        <button className="btn-estado cerrar" onClick={() => cambiarEstado(s.idSolicitud, 'cerrada')}>
                          Cerrar
                        </button>
                      )}
                      <button className="btn-editar-central" onClick={() => abrirEdicion(s)}>
                        ✏️ Editar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Modal edición */}
      {solicitudEditando && (
        <div className="modal-overlay" onClick={cerrarEdicion}>
          <div className="modal-card modal-grande" onClick={e => e.stopPropagation()}>
            <div className="seccion-header">
              <h3>Editar Solicitud #{solicitudEditando.idSolicitud}</h3>
              <button className="btn-secondary" onClick={cerrarEdicion}>✕ Cerrar</button>
            </div>

            <div className="form-group">
              <label>Descripción</label>
              <textarea
                value={formEdicion.descripcion}
                onChange={e => setFormEdicion(p => ({ ...p, descripcion: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>Dirección</label>
              <input
                type="text"
                value={formEdicion.direccion}
                onChange={e => setFormEdicion(p => ({ ...p, direccion: e.target.value }))}
                placeholder="Dirección aproximada"
              />
            </div>

            <div className="form-group">
              <label>📝 Notas del centralista</label>
              <textarea
                value={formEdicion.notas}
                onChange={e => setFormEdicion(p => ({ ...p, notas: e.target.value }))}
                rows={3}
                placeholder="Agrega notas o instrucciones para el patrullero..."
              />
            </div>

            {tiposCasoEdicion.length > 0 && (
              <div className="form-group">
                <label>Tipo(s) de caso</label>
                <div className="tipos-caso-grid">
                  {tiposCasoEdicion.map(tc => (
                    <div
                      key={tc.idTipoCaso}
                      className={`tipo-caso-item ${formEdicion.idTiposCaso.includes(tc.idTipoCaso) ? 'seleccionado' : ''}`}
                      onClick={() => toggleTipoCasoEdicion(tc.idTipoCaso)}
                    >
                      {tc.descripcion}
                      {formEdicion.idTiposCaso.includes(tc.idTipoCaso) && <span> ✓</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="form-group">
              <label>👮 Reasignar patrullero</label>
              <select
                value={formEdicion.idPatrullero}
                onChange={e => setFormEdicion(p => ({ ...p, idPatrullero: e.target.value }))}
              >
                <option value="">Mantener patrullero actual ({solicitudEditando.patrulleroNombre})</option>
                {patrullerosActivos.map(p => (
                  <option key={p.idUsuario} value={p.idUsuario}>
                    {p.nombre} {p.apellido}
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-acciones">
              <button className="btn-secondary" onClick={cerrarEdicion}>Cancelar</button>
              <button className="btn-primary" onClick={guardarEdicion}>💾 Guardar cambios</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardCentralista