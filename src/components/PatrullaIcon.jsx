function PatrullaIcon({ size = 40 }) {
  const w = size
  const h = size * 0.67
  return (
    <svg width={w} height={h} viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Carrocería */}
      <rect x="2" y="10" width="44" height="16" rx="4" fill="#2E7FC1"/>
      {/* Cabina */}
      <rect x="8" y="4" width="22" height="12" rx="3" fill="#4A9FE0"/>
      {/* Ventana cabina */}
      <rect x="10" y="6" width="18" height="8" rx="2" fill="#1a2b4a"/>
      {/* Rueda izquierda */}
      <circle cx="10" cy="26" r="4" fill="#1a2b4a" stroke="#ffffff" strokeWidth="1.5"/>
      <circle cx="10" cy="26" r="1.5" fill="#555"/>
      {/* Rueda derecha */}
      <circle cx="38" cy="26" r="4" fill="#1a2b4a" stroke="#ffffff" strokeWidth="1.5"/>
      <circle cx="38" cy="26" r="1.5" fill="#555"/>
      {/* Parrilla delantera */}
      <rect x="42" y="14" width="4" height="8" rx="2" fill="#2E7FC1"/>
      {/* Luz delantera amarilla */}
      <circle cx="44" cy="15" r="1.8" fill="#FFD700"/>
      {/* Barra de luces */}
      <rect x="14" y="2" width="12" height="3" rx="1.5" fill="#1a2b4a"/>
      <rect x="14" y="2" width="5" height="3" rx="1.5" fill="#FF4444"/>
      <rect x="21" y="2" width="5" height="3" rx="1.5" fill="#4488FF"/>
      {/* Letrero PATRULLA */}
      <rect x="28" y="14" width="10" height="5" rx="1" fill="#1a2b4a"/>
      <rect x="29" y="15" width="2" height="1.5" rx="0.4" fill="#fff" opacity="0.9"/>
      <rect x="32" y="15" width="2" height="1.5" rx="0.4" fill="#fff" opacity="0.9"/>
      <rect x="35" y="15" width="2" height="1.5" rx="0.4" fill="#fff" opacity="0.9"/>
    </svg>
  )
}

export default PatrullaIcon
