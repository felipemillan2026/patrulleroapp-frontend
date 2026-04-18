const CLOUD_NAME = 'dxdd5gfe2'
const UPLOAD_PRESET = 'patrulleroapp_preset'

export const subirImagen = async (archivo) => {
  const formData = new FormData()
  formData.append('file', archivo)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', 'solicitudes')

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  )

  if (!res.ok) throw new Error('Error al subir imagen')
  const data = await res.json()
  return data.secure_url
}

export const subirMultiplesImagenes = async (archivos) => {
  const urls = await Promise.all(
    Array.from(archivos).map(archivo => subirImagen(archivo))
  )
  return urls
}