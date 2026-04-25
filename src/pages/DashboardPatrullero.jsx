import { useState, useEffect } from 'react'
import api from '../services/api'
import { subirMultiplesImagenes } from '../services/cloudinary'
import '../styles/dashboard.css'
import '../styles/patrullero.css'
import MiPerfil from './MiPerfil'

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
  const [verPerfil, setVerPerfil] = useState(false)

  const [form, setForm] = useState({
    descripcion: '',
    idDepartamento: '',
    idTiposCaso: [],
    direccion: '',
    latitud: '',
    longitud: '',
    imagenes: [],
    notificarEmail: false,
    emailDestino: ''
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
    if (!form.idDepartamento) {
      setMensaje('Debes seleccionar un departamento')
      return
    }
    if (form.idTiposCaso.length === 0) {
      setMensaje('Debes seleccionar al menos un tipo de caso')
      return
    }
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
        notificarEmail: form.notificarEmail,
        emailDestino: form.emailDestino || ''
      })

      setMensaje(form.notificarEmail
        ? `Solicitud creada y email enviado ${form.emailDestino ? 'a ' + form.emailDestino : 'al departamento'} ✓`
        : 'Solicitud creada correctamente ✓')

      setForm({
        descripcion: '', idDepartamento: '', idTiposCaso: [],
        direccion: '', latitud: '', longitud: '', imagenes: [],
        notificarEmail: false, emailDestino: ''
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

  const abrirEdicion = (solicitud) => {
    setSolicitudEditando(solicitud)
    setFormEdicion({
      descripcion: solicitud.descripcion,
      direccion: solicitud.direccion || '',
      idTiposCaso: [],
      imagenes: []
    })
    setVistaActiva('editar')
  }

  const handleSubmitEdicion = async (e) => {
    e.preventDefault()
    try {
      setSubiendoImagenes(true)

      let urlsImagenes = []
      if (formEdicion.imagenes.length > 0) {
        setMensaje('Subiendo imágenes...')
        urlsImagenes = await subirMultiplesImagenes(formEdicion.imagenes)
      }

      setMensaje('Guardando cambios...')
      await api.put(`/solicitudes/${solicitudEditando.idSolicitud}`, {
        descripcion: formEdicion.descripcion,
        direccion: formEdicion.direccion,
        idTiposCaso: formEdicion.idTiposCaso,
        urlsImagenes,
        notificarEmail: false,
        emailDestino: ''
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
    const estilos = {
      pendiente: 'badge-pendiente',
      en_proceso: 'badge-proceso',
      cerrada: 'badge-cerrada'
    }
    return estilos[estado] || 'badge-pendiente'
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
            <p>Panel Patrullero</p>
          </div>
        </div>
        <div className="header-right">
          <span className="header-usuario">👮 {nombre} {apellido}</span>
          <button className="btn-perfil" onClick={() => setVerPerfil(true)}>
            👤 Mi perfil
          </button>
          <button className="btn-cerrar-sesion" onClick={cerrarSesion}>
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Navegación */}
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

        {/* ── NUEVA SOLICITUD ── */}
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
                <input
                  type="file" accept="image/*" multiple
                  onChange={handleImagenes} className="input-file"
                />
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

              {/* Mapa preview nueva solicitud */}
              {form.latitud && form.longitud && (
                <div className="mapa-preview">
                  <label>📍 Vista previa de ubicación</label>
                  <iframe
                    title="mapa-ubicacion"
                    width="100%"
                    height="220"
                    style={{ border: 0, borderRadius: '10px' }}
                    loading="lazy"
                    allowFullScreen
                    src={`https://maps.google.com/maps?q=${form.latitud},${form.longitud}&z=16&output=embed`}
                  />
                </div>
              )}

              {/* Toggle email */}
              <div className="toggle-row">
                <div className="toggle-info">
                  <span className="toggle-label">📧 Notificar al departamento por email</span>
                  <span className="toggle-desc">
                    Se enviará un email con los datos del procedimiento
                  </span>
                </div>
                <div
                  className={`toggle-switch ${form.notificarEmail ? 'activo' : ''}`}
                  onClick={() => setForm(p => ({ ...p, notificarEmail: !p.notificarEmail }))}
                >
                  <div className="toggle-thumb" />
                </div>
              </div>

              {/* Campo email destino */}
              {form.notificarEmail && (
                <div className="email-destino-box">
                  <label>Correo de destino</label>
                  <div className="email-destino-row">
                    <input
                      type="email"
                      value={form.emailDestino}
                      onChange={e => setForm(p => ({ ...p, emailDestino: e.target.value }))}
                      placeholder="correo@destino.cl"
                    />
                    <span className="email-hint">
                      Déjalo vacío para enviar al correo del departamento
                    </span>
                  </div>
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={subiendoImagenes}>
                {subiendoImagenes ? 'Enviando...' : '📤 Registrar Procedimiento'}
              </button>
            </form>
          </section>
        )}

        {/* ── EDITAR SOLICITUD ── */}
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
              <p>
                <strong>Estado actual:</strong>
                <span
                  className={`badge ${getEstadoBadge(solicitudEditando.estado)}`}
                  style={{ marginLeft: '8px' }}
                >
                  {solicitudEditando.estado.replace('_', ' ').toUpperCase()}
                </span>
              </p>
              <p><strong>Fecha:</strong> {new Date(solicitudEditando.fechaHora).toLocaleString('es-CL')}</p>
            </div>

            {/* Mapa ubicación original */}
            {solicitudEditando.latitud && solicitudEditando.longitud && (
              <div className="mapa-preview" style={{ marginBottom: '20px' }}>
                <label>📍 Ubicación del procedimiento</label>
                <iframe
                  title="mapa-edicion"
                  width="100%"
                  height="220"
                  style={{ border: 0, borderRadius: '10px' }}
                  loading="lazy"
                  allowFullScreen
                  src={`https://maps.google.com/maps?q=${solicitudEditando.latitud},${solicitudEditando.longitud}&z=16&output=embed`}
                />
              </div>
            )}

            {/* Imágenes existentes */}
            {solicitudEditando.urlsImagenes?.length > 0 && (
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label>Imágenes actuales ({solicitudEditando.urlsImagenes.length})</label>
                <div className="previews-grid">
                  {solicitudEditando.urlsImagenes.map((url, i) => (
                    <div key={i} className="preview-item">
                      <a href={url} target="_blank" rel="noreferrer">
                        <img src={url} alt={`imagen-${i}`} />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                  type="file" accept="image/*" multiple
                  onChange={handleImagenesEdicion} className="input-file"
                />
                {formEdicion.imagenes.length > 0 && (
                  <p className="ubicacion-ok">
                    ✓ {formEdicion.imagenes.length} imagen(es) seleccionada(s)
                  </p>
                )}
              </div>

              <button type="submit" className="btn-primary" disabled={subiendoImagenes}>
                {subiendoImagenes ? 'Guardando...' : '💾 Guardar cambios'}
              </button>
            </form>
          </section>
        )}

        {/* ── MIS SOLICITUDES ── */}
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
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                    {/* Miniaturas de imágenes */}
                    {s.urlsImagenes?.length > 0 && (
                      <div className="imagenes-mini">
                        {s.urlsImagenes.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noreferrer">
                            <img src={url} alt={`img-${i}`} className="imagen-mini" />
                          </a>
                        ))}
                        <span className="imagenes-count">
                          📷 {s.urlsImagenes.length} imagen(es)
                        </span>
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