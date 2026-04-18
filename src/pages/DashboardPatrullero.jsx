import { useState, useEffect } from 'react'
import api from '../services/api'
import { subirMultiplesImagenes } from '../services/cloudinary'
import '../styles/dashboard.css'
import '../styles/patrullero.css'

function DashboardPatrullero() {
  const nombre = localStorage.getItem('nombre')
  const apellido = localStorage.getItem('apellido')

  const [solicitudes, setSolicitudes] = useState([])
  const [departamentos, setDepartamentos] = useState([])
  const [tiposCaso, setTiposCaso] = useState([])
  const [turnoActivo, setTurnoActivo] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState('')
  const [subiendoImagenes, setSubiendoImagenes] = useState(false)
  const [previews, setPreviews] = useState([])
  const [vistaActiva, setVistaActiva] = useState('solicitudes')
  const [solicitudEditando, setSolicitudEditando] = useState(null)
  const [tiposCasoEdicion, setTiposCasoEdicion] = useState([])

  const [form, setForm] = useState({
    descripcion: '',
    idDepartamento: '',
    idTiposCaso: [],
    direccion: '',
    latitud: '',
    longitud: '',
    imagenes: [],
    notificarEmail: false
  })

  const [formEdicion, setFormEdicion] = useState({
    descripcion: '',
    direccion: '',
    idTiposCaso: [],
    imagenes: []
  })

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    setCargando(true)
    try {
      const turnoRes = await api.get('/turnos/activo')
      setTurnoActivo(turnoRes.data)
    } catch { setTurnoActivo(null) }
    try {
      const solRes = await api.get('/solicitudes/mis-solicitudes')
      setSolicitudes(solRes.data)
    } catch { setSolicitudes([]) }
    try {
      const deptRes = await api.get('/departamentos')
      setDepartamentos(deptRes.data)
    } catch { setDepartamentos([]) }
    setCargando(false)
  }

  const handleDepartamentoChange = async (e) => {
    const idDepto = e.target.value
    setForm(prev => ({ ...prev, idDepartamento: idDepto, idTiposCaso: [] }))
    if (idDepto) {
      try {
        const res = await api.get(`/departamentos/${idDepto}/tipos-caso`)
        setTiposCaso(res.data)
      } catch { setTiposCaso([]) }
    } else {
      setTiposCaso([])
    }
  }

  const toggleTipoCaso = (id) => {
    setForm(prev => ({
      ...prev,
      idTiposCaso: prev.idTiposCaso.includes(id)
        ? prev.idTiposCaso.filter(t => t !== id)
        : [...prev.idTiposCaso, id]
    }))
  }

  const toggleTipoCasoEdicion = (id) => {
    setFormEdicion(prev => ({
      ...prev,
      idTiposCaso: prev.idTiposCaso.includes(id)
        ? prev.idTiposCaso.filter(t => t !== id)
        : [...prev.idTiposCaso, id]
    }))
  }

  const handleImagenes = (e) => {
    const archivos = Array.from(e.target.files)
    if (archivos.length > 10) {
      setMensaje('Máximo 10 imágenes por solicitud')
      return
    }
    setForm(prev => ({ ...prev, imagenes: archivos }))
    setPreviews(archivos.map(f => URL.createObjectURL(f)))
  }

  const handleImagenesEdicion = (e) => {
    const archivos = Array.from(e.target.files)
    setFormEdicion(prev => ({ ...prev, imagenes: archivos }))
  }

  const obtenerUbicacion = () => {
    if (!navigator.geolocation) {
      setMensaje('Geolocalización no disponible')
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(prev => ({
          ...prev,
          latitud: pos.coords.latitude.toString(),
          longitud: pos.coords.longitude.toString()
        }))
        setMensaje('Ubicación obtenida ✓')
      },
      () => setMensaje('No se pudo obtener la ubicación')
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.idDepartamento) { setMensaje('Debes seleccionar un departamento'); return }
    if (form.idTiposCaso.length === 0) { setMensaje('Debes seleccionar al menos un tipo de caso'); return }

    try {
      setSubiendoImagenes(true)
      setMensaje(form.imagenes.length > 0 ? 'Subiendo imágenes...' : 'Guardando solicitud...')

      let urlsImagenes = []
      if (form.imagenes.length > 0) {
        urlsImagenes = await subirMultiplesImagenes(form.imagenes)
      }

      setMensaje('Guardando solicitud...')
      await api.post('/solicitudes', {
        descripcion: form.descripcion,
        idDepartamento: parseInt(form.idDepartamento),
        idTiposCaso: form.idTiposCaso,
        direccion: form.direccion,
        latitud: form.latitud ? parseFloat(form.latitud) : null,
        longitud: form.longitud ? parseFloat(form.longitud) : null,
        urlsImagenes,
        notificarEmail: form.notificarEmail
      })

      setMensaje(form.notificarEmail
        ? 'Solicitud creada y email enviado al departamento ✓'
        : 'Solicitud creada correctamente ✓')

      setForm({
        descripcion: '', idDepartamento: '', idTiposCaso: [],
        direccion: '', latitud: '', longitud: '', imagenes: [], notificarEmail: false
      })
      setPreviews([])
      setTiposCaso([])
      setVistaActiva('solicitudes')
      cargarDatos()
    } catch (e) {
      setMensaje(e.response?.data || 'Error al crear solicitud')
    } finally {
      setSubiendoImagenes(false)
    }
  }

  const abrirEdicion = async (solicitud) => {
    setSolicitudEditando(solicitud)
    setFormEdicion({
      descripcion: solicitud.descripcion,
      direccion: solicitud.direccion || '',
      idTiposCaso: [],
      imagenes: []
    })
    setVistaActiva('editar')
    setTiposCasoEdicion([])
  }

  const handleSubmitEdicion = async (e) => {
    e.preventDefault()
    try {
      setSubiendoImagenes(true)
      setMensaje('Guardando cambios...')

      let urlsImagenes = []
      if (formEdicion.imagenes.length > 0) {
        setMensaje('Subiendo imágenes...')
        urlsImagenes = await subirMultiplesImagenes(formEdicion.imagenes)
      }

      await api.put(`/solicitudes/${solicitudEditando.idSolicitud}`, {
        descripcion: formEdicion.descripcion,
        direccion: formEdicion.direccion,
        idTiposCaso: formEdicion.idTiposCaso.length > 0
          ? formEdicion.idTiposCaso : [0],
        urlsImagenes,
        notificarEmail: false
      })

      setMensaje('Solicitud actualizada correctamente ✓')
      setSolicitudEditando(null)
      setVistaActiva('solicitudes')
      cargarDatos()
    } catch (e) {
      setMensaje(e.response?.data || 'Error al editar solicitud')
    } finally {
      setSubiendoImagenes(false)
    }
  }

  const cerrarSesion = () => {
    localStorage.clear()
    window.location.href = '/login'
  }

  const getEstadoBadge = (estado) => {
    const estilos = { pendiente: 'badge-pendiente', en_proceso: 'badge-proceso', cerrada: 'badge-cerrada' }
    return estilos[estado] || 'badge-pendiente'
  }

  if (cargando) return <div className="cargando">Cargando...</div>

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <span className="header-logo">🛡️</span>
          <div>
            <h1>PatrulleroApp</h1>
            <p>Panel Patrullero</p>
          </div>
        </div>
        <div className="header-right">
          <span className="header-usuario">👮 {nombre} {apellido}</span>
          <button className="btn-cerrar-sesion" onClick={cerrarSesion}>Cerrar sesión</button>
        </div>
      </header>

      {/* Navegación tipo plantilla */}
      <nav className="patrullero-nav">
        <button
          className={`patrullero-nav-btn ${vistaActiva === 'solicitudes' ? 'activo' : ''}`}
          onClick={() => setVistaActiva('solicitudes')}
        >
          📋 Mis Solicitudes
        </button>
        {turnoActivo && (
          <button
            className={`patrullero-nav-btn ${vistaActiva === 'nueva' ? 'activo' : ''}`}
            onClick={() => setVistaActiva('nueva')}
          >
            + Nueva Solicitud
          </button>
        )}
      </nav>

      <main className="dashboard-main">
        {mensaje && (
          <div className="mensaje-info" onClick={() => setMensaje('')}>
            {mensaje} ✕
          </div>
        )}

        {/* Estado turno */}
        <div className={`turno-status ${turnoActivo ? 'activo' : 'inactivo'}`}>
          {turnoActivo
            ? `● Turno activo — ${turnoActivo.tipo.toUpperCase()} | Inicio: ${new Date(turnoActivo.fechaInicio).toLocaleTimeString('es-CL')}`
            : '● Sin turno activo — No puedes crear solicitudes'}
        </div>

        {/* ── VISTA: NUEVA SOLICITUD ── */}
        {vistaActiva === 'nueva' && turnoActivo && (
          <section className="card">
            <h2>Nueva Solicitud de Procedimiento</h2>
            <form onSubmit={handleSubmit} className="solicitud-form">

              <div className="form-group">
                <label>Descripción del procedimiento *</label>
                <textarea
                  value={form.descripcion}
                  onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
                  placeholder="Describe detalladamente el procedimiento realizado..."
                  rows={4} required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Departamento responsable *</label>
                  <select value={form.idDepartamento} onChange={handleDepartamentoChange} required>
                    <option value="">Seleccionar departamento...</option>
                    {departamentos.map(d => (
                      <option key={d.idDepartamento} value={d.idDepartamento}>{d.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Dirección aproximada</label>
                  <input
                    type="text"
                    value={form.direccion}
                    onChange={e => setForm(p => ({ ...p, direccion: e.target.value }))}
                    placeholder="Ej: Av. Principal 123"
                  />
                </div>
              </div>

              {tiposCaso.length > 0 && (
                <div className="form-group">
                  <label>Tipo(s) de caso *</label>
                  <div className="tipos-caso-grid">
                    {tiposCaso.map(tc => (
                      <div
                        key={tc.idTipoCaso}
                        className={`tipo-caso-item ${form.idTiposCaso.includes(tc.idTipoCaso) ? 'seleccionado' : ''}`}
                        onClick={() => toggleTipoCaso(tc.idTipoCaso)}
                      >
                        {tc.descripcion}
                        {form.idTiposCaso.includes(tc.idTipoCaso) && <span> ✓</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Imágenes de evidencia (máx. 10)</label>
                <input type="file" accept="image/*" multiple onChange={handleImagenes} className="input-file" />
                {previews.length > 0 && (
                  <div className="previews-grid">
                    {previews.map((url, i) => (
                      <div key={i} className="preview-item">
                        <img src={url} alt={`preview-${i}`} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-row-acciones">
                <button type="button" className="btn-ubicacion" onClick={obtenerUbicacion}>
                  📍 Obtener ubicación GPS
                </button>
                {form.latitud && (
                  <span className="ubicacion-ok">
                    ✓ {parseFloat(form.latitud).toFixed(4)}, {parseFloat(form.longitud).toFixed(4)}
                  </span>
                )}
              </div>

              {/* Toggle email */}
              <div className="toggle-row">
                <div className="toggle-info">
                  <span className="toggle-label">📧 Notificar al departamento por email</span>
                  <span className="toggle-desc">Se enviará un email con los datos del procedimiento</span>
                </div>
                <div
                  className={`toggle-switch ${form.notificarEmail ? 'activo' : ''}`}
                  onClick={() => setForm(p => ({ ...p, notificarEmail: !p.notificarEmail }))}
                >
                  <div className="toggle-thumb" />
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={subiendoImagenes}>
                {subiendoImagenes ? 'Enviando...' : '📤 Registrar Procedimiento'}
              </button>
            </form>
          </section>
        )}

        {/* ── VISTA: EDITAR SOLICITUD ── */}
        {vistaActiva === 'editar' && solicitudEditando && (
          <section className="card">
            <div className="seccion-header">
              <h2>Editar Solicitud #{solicitudEditando.idSolicitud}</h2>
              <button className="btn-secondary" onClick={() => setVistaActiva('solicitudes')}>
                ← Volver
              </button>
            </div>

            <div className="solicitud-original">
              <p><strong>Departamento:</strong> {solicitudEditando.departamentoNombre}</p>
              <p><strong>Estado actual:</strong>
                <span className={`badge ${getEstadoBadge(solicitudEditando.estado)}`} style={{marginLeft: '8px'}}>
                  {solicitudEditando.estado.replace('_', ' ').toUpperCase()}
                </span>
              </p>
              <p><strong>Fecha:</strong> {new Date(solicitudEditando.fechaHora).toLocaleString('es-CL')}</p>
            </div>

            <form onSubmit={handleSubmitEdicion} className="solicitud-form">
              <div className="form-group">
                <label>Descripción *</label>
                <textarea
                  value={formEdicion.descripcion}
                  onChange={e => setFormEdicion(p => ({ ...p, descripcion: e.target.value }))}
                  rows={4} required
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
                <label>Agregar nuevas imágenes</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImagenesEdicion}
                  className="input-file"
                />
                {formEdicion.imagenes.length > 0 && (
                  <p className="ubicacion-ok">✓ {formEdicion.imagenes.length} imagen(es) seleccionada(s)</p>
                )}
              </div>

              <button type="submit" className="btn-primary" disabled={subiendoImagenes}>
                {subiendoImagenes ? 'Guardando...' : '💾 Guardar cambios'}
              </button>
            </form>
          </section>
        )}

        {/* ── VISTA: MIS SOLICITUDES ── */}
        {vistaActiva === 'solicitudes' && (
          <section className="card">
            <h2>Mis Solicitudes ({solicitudes.length})</h2>
            {solicitudes.length === 0 ? (
              <p className="sin-datos">No tienes solicitudes registradas aún.</p>
            ) : (
              <div className="solicitudes-lista">
                {solicitudes.map(s => (
                  <div key={s.idSolicitud} className="solicitud-item">
                    <div className="solicitud-header">
                      <span className="solicitud-id">#{s.idSolicitud}</span>
                      <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                        <span className={`badge ${getEstadoBadge(s.estado)}`}>
                          {s.estado.replace('_', ' ').toUpperCase()}
                        </span>
                        {s.estado !== 'cerrada' && (
                          <button className="btn-edit-sol" onClick={() => abrirEdicion(s)}>
                            ✏️ Editar
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="solicitud-descripcion">{s.descripcion}</p>
                    <div className="solicitud-meta">
                      <span>🏢 {s.departamentoNombre}</span>
                      <span>🕐 {new Date(s.fechaHora).toLocaleString('es-CL')}</span>
                      {s.direccion && <span>📍 {s.direccion}</span>}
                    </div>
                    {s.tiposCaso?.length > 0 && (
                      <div className="tipos-tags">
                        {s.tiposCaso.map((t, i) => (
                          <span key={i} className="tipo-tag">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}

export default DashboardPatrullero