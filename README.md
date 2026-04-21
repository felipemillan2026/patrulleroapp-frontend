# PatrulleroApp — Frontend

Aplicación web progressive (PWA-ready) para la gestión digitalizada de procedimientos operativos municipales en terreno.

## Stack tecnológico

| Componente | Tecnología |
|---|---|
| Framework | React 19 + Vite |
| Routing | React Router DOM |
| HTTP Client | Axios |
| Estilos | CSS propio (sin frameworks) |
| Imágenes | Cloudinary (upload directo desde navegador) |
| Mapas | Google Maps Embed API |

## Perfiles de usuario

| Perfil | Funcionalidades |
|---|---|
| **Supervisor** | Gestión de turnos (abrir/cerrar), CRUD de usuarios, descarga de reportes PDF |
| **Centralista** | Monitoreo en tiempo real, cambio de estado de solicitudes, refresco cada 30 seg |
| **Patrullero** | Registro de procedimientos, geolocalización GPS, carga de imágenes (máx. 10), notificación por email |

## Requisitos

- Node.js 18+
- Backend PatrulleroApp corriendo

## Instalación

```bash
npm install
```

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto: