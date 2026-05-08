# PatrulleroApp — Frontend

Aplicación web para la gestión digitalizada de procedimientos operativos municipales en terreno. Interfaz construida con React 19 y Vite, optimizada para uso en escritorio y dispositivos móviles.

Este repositorio contiene únicamente la capa de presentación. La API REST que consume vive en el repositorio independiente [`patrulleroapp-backend`](#repositorio-backend).

---

## Tabla de contenidos

1. [Descripción del proyecto](#descripción-del-proyecto)
2. [Stack tecnológico](#stack-tecnológico)
3. [Arquitectura del cliente](#arquitectura-del-cliente)
4. [Perfiles de usuario](#perfiles-de-usuario)
5. [Requisitos previos](#requisitos-previos)
6. [Instalación paso a paso](#instalación-paso-a-paso)
7. [Variables de entorno](#variables-de-entorno)
8. [Scripts disponibles](#scripts-disponibles)
9. [Servicios externos](#servicios-externos)
10. [Estructura del proyecto](#estructura-del-proyecto)
11. [Despliegue en producción](#despliegue-en-producción)
12. [Repositorio backend](#repositorio-backend)

---

## Descripción del proyecto

PatrulleroApp es la interfaz web del sistema municipal de gestión de patrullaje. Reemplaza la coordinación informal por radio, teléfono y WhatsApp con un entorno estructurado donde supervisores, centralistas y patrulleros operan sobre los mismos datos en tiempo real.

La aplicación es responsive y se adapta tanto al escritorio del centralista en la sala de monitoreo como al teléfono del patrullero en terreno. La carga de imágenes se realiza directamente desde el navegador a Cloudinary, sin pasar por el backend, lo que reduce la carga del servidor y mejora la velocidad de subida.

## Stack tecnológico

| Componente              | Tecnología                                  |
| ----------------------- | ------------------------------------------- |
| Framework               | React 19.2                                  |
| Build tool              | Vite 8                                      |
| Routing                 | React Router DOM 7                          |
| Cliente HTTP            | Axios 1.15                                  |
| Estilos                 | CSS propio modular (sin frameworks)         |
| Linter                  | ESLint 9                                    |
| Almacenamiento imágenes | Cloudinary (upload directo desde navegador) |
| Mapas                   | Google Maps Embed API                       |
| Autenticación           | JWT (almacenado en `localStorage`)          |

## Arquitectura del cliente

```
┌──────────────────────────────────────────────────────────────┐
│  pages/         →  Vistas por rol (Login, dashboards)        │
├──────────────────────────────────────────────────────────────┤
│  components/    →  Componentes reutilizables                 │
├──────────────────────────────────────────────────────────────┤
│  services/      →  Cliente API + integración Cloudinary      │
├──────────────────────────────────────────────────────────────┤
│  styles/        →  CSS modular por vista                     │
└──────────────────────────────────────────────────────────────┘
```

El componente `RutaProtegida` valida en cada navegación que el usuario tenga un token JWT válido y que su rol coincida con la ruta solicitada. El interceptor de Axios inyecta automáticamente el header `Authorization: Bearer <token>` en cada petición.

## Perfiles de usuario

| Perfil           | Funcionalidades                                                                                                  |
| ---------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Supervisor**   | Apertura y cierre de turnos, CRUD de usuarios, descarga de reportes PDF, consulta histórica de turnos cerrados   |
| **Centralista** | Monitoreo de solicitudes con refresco automático cada 30 segundos, cambio de estado, edición de notas y reasignación de patrulleros |
| **Patrullero**   | Registro de procedimientos con geolocalización GPS, carga de hasta 10 imágenes por solicitud, edición de solicitudes propias |

Cada perfil dispone de una vista propia (`DashboardSupervisor`, `DashboardCentralista`, `DashboardPatrullero`) y de la sección compartida `MiPerfil` para gestionar los datos personales y la contraseña.

## Requisitos previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js 20.19+** o superior — [descarga](https://nodejs.org/)
- **npm** (incluido con Node.js)
- **Git** — para clonar el repositorio
- **Backend de PatrulleroApp** corriendo (local en `http://localhost:8080` o desplegado en Railway)
- Una cuenta gratuita de **Cloudinary** ([registro](https://cloudinary.com/users/register/free)) para almacenamiento de imágenes
- **Visual Studio Code** (recomendado) con las extensiones *ES7+ React/Redux/React-Native snippets* y *ESLint*

Verifica las versiones:

```bash
node --version
npm --version
git --version
```

## Instalación paso a paso

### 1. Clonar el repositorio

```bash
git clone https://github.com/USUARIO/patrulleroapp-frontend.git
cd patrulleroapp-frontend
```

### 2. Instalar dependencias

```bash
npm install
```

Esto instalará las dependencias listadas en `package.json` (React, React Router, Axios, Vite, ESLint, etc).

### 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
# En Linux/macOS
touch .env

# En Windows
type nul > .env
```

Y agrega el contenido descrito en la sección [Variables de entorno](#variables-de-entorno).

### 4. Configurar Cloudinary

Edita el archivo `src/services/cloudinary.js` y reemplaza los valores:

```javascript
const CLOUD_NAME = 'tu_cloud_name'           // tu cloud name de Cloudinary
const UPLOAD_PRESET = 'tu_upload_preset'     // preset unsigned creado en el panel
```

Pasos para obtener estos valores:

1. Inicia sesión en [Cloudinary Dashboard](https://cloudinary.com/console).
2. Copia el **Cloud Name** que aparece en la sección "Account Details".
3. Ve a **Settings → Upload → Upload presets** y crea un preset con modo **Unsigned**.
4. Copia el nombre del preset y pégalo en `UPLOAD_PRESET`.

### 5. Levantar el servidor de desarrollo

```bash
npm run dev
```

Vite levanta el servidor en `http://localhost:5173`. El navegador se recarga automáticamente al guardar cambios.

### 6. Acceder a la aplicación

Abre `http://localhost:5173` en tu navegador. Serás redirigido a `/login`. Usa una cuenta válida del backend para ingresar (consulta el README del backend para crear usuarios iniciales).

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```env
# URL base del backend
# - En desarrollo local apunta a http://localhost:8080/api
# - En producción apunta al endpoint público de Railway
VITE_API_URL=http://localhost:8080/api
```

Para producción crea un archivo `.env.production` con:

```env
VITE_API_URL=https://tu-backend.up.railway.app/api
```

Vite carga automáticamente el archivo correspondiente según el comando ejecutado (`npm run dev` usa `.env`, `npm run build` usa `.env.production`).

> **Importante**: las variables de Vite deben tener el prefijo `VITE_` para que sean accesibles desde el código del navegador (`import.meta.env.VITE_API_URL`).

## Scripts disponibles

| Comando             | Descripción                                                |
| ------------------- | ---------------------------------------------------------- |
| `npm run dev`       | Levanta el servidor de desarrollo con HMR en `:5173`       |
| `npm run build`     | Genera el bundle optimizado en la carpeta `dist/`          |
| `npm run preview`   | Sirve localmente el bundle de producción para validación   |
| `npm run lint`      | Ejecuta ESLint sobre todo el proyecto                      |

## Servicios externos

La aplicación depende de tres servicios externos:

### 1. Backend de PatrulleroApp

Toda la lógica de negocio (autenticación, turnos, solicitudes, usuarios, reportes) vive en la API REST. Configurado mediante `VITE_API_URL`.

### 2. Cloudinary

Las imágenes de evidencia que carga el patrullero se suben directamente desde el navegador a Cloudinary mediante un preset unsigned. El backend solo recibe las URLs públicas resultantes y las almacena en la tabla `imagenes`. Configurado en `src/services/cloudinary.js`.

### 3. Google Maps (Embed API)

La vista previa de ubicación GPS se muestra mediante un `<iframe>` que apunta a `maps.google.com/maps?q=LAT,LNG&output=embed`. No requiere API key porque usa el modo embed público.

## Estructura del proyecto

```
patrulleroapp-frontend/
├── public/
│   └── favicon.svg
├── src/
│   ├── main.jsx                  # Punto de entrada (BrowserRouter)
│   ├── App.jsx                   # Definición de rutas y guards
│   ├── components/
│   │   ├── PatrullaIcon.jsx      # Icono SVG del logo
│   │   └── RutaProtegida.jsx     # HOC de validación por rol
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── DashboardSupervisor.jsx
│   │   ├── DashboardCentralista.jsx
│   │   ├── DashboardPatrullero.jsx
│   │   └── MiPerfil.jsx
│   ├── services/
│   │   ├── api.js                # Cliente Axios + interceptor JWT
│   │   └── cloudinary.js         # Upload de imágenes
│   └── styles/
│       ├── global.css            # Reset + tipografía
│       ├── login.css
│       ├── dashboard.css         # Estilos compartidos
│       ├── supervisor.css
│       ├── centralista.css
│       └── patrullero.css
├── .env                          # Variables locales (no se sube a git)
├── .env.production               # Variables de producción
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── vercel.json                   # Configuración SPA para Vercel
└── vite.config.js
```

## Despliegue en producción

El frontend está desplegado en **Vercel** y se rebuilds automáticamente con cada `push` a la rama `main`.

### Configuración del proyecto en Vercel

1. Importa el repositorio desde el panel de Vercel.
2. Vercel detectará automáticamente que es un proyecto Vite.
3. Configura las variables de entorno desde **Settings → Environment Variables**:

   | Variable        | Valor                                          |
   | --------------- | ---------------------------------------------- |
   | `VITE_API_URL`  | `https://tu-backend.up.railway.app/api`        |

4. El archivo `vercel.json` ya contiene la regla de rewrite para que React Router funcione correctamente con rutas profundas.

### Build manual

```bash
npm run build
```

Esto genera la carpeta `dist/` lista para servir desde Vercel. El archivo `vercel.json` en la raíz del proyecto contiene la regla de rewrite necesaria para que React Router funcione correctamente con rutas profundas:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Esta configuración redirige todas las rutas al `index.html` para que React Router maneje la navegación del lado del cliente, evitando errores 404 al recargar la página en rutas como `/supervisor` o `/centralista`.

## Repositorio backend

El servidor REST que consume esta aplicación está en un repositorio separado:

**[patrulleroapp-backend](https://github.com/USUARIO/patrulleroapp-backend)** — API REST con Spring Boot 3.5 + MySQL.

---

## Autor

**Felipe** — Proyecto de Título · Analista Programador · IPLACEX

## Licencia

Proyecto académico desarrollado para fines de titulación. Uso restringido al ámbito municipal.
