# Construcción de Kontenda — Paso a Paso

> Documento técnico que describe cómo fue construida la plataforma Kontenda para Liu Creativo.

---

## ¿Qué es Kontenda?

Kontenda es una plataforma web de gestión de contenido creativo construida para la agencia **Liu Creativo**. Permite a la agencia gestionar clientes, producir piezas de contenido, programar entregas y llevar un seguimiento completo del ciclo de producción. Los clientes tienen su propio portal donde pueden revisar su contenido, aprobar piezas, gestionar su marca y consultar su suscripción.

---

## Stack tecnológico

| Tecnología | Rol |
|---|---|
| **React 18** | Framework de interfaz de usuario |
| **Vite** | Build tool y servidor de desarrollo |
| **Firebase Auth** | Autenticación de usuarios (email/contraseña) |
| **Cloud Firestore** | Base de datos en tiempo real |
| **React Router v7** | Navegación y rutas protegidas |
| **Tailwind CSS** | Estilos con sistema de diseño personalizado |
| **React Icons** | Íconos (Feather Icons + Si) |

---

## Paso 1 — Configuración del proyecto

**Herramientas:**
- Node.js + npm
- Vite como scaffolding

**Comandos iniciales:**
```bash
npm create vite@latest kontenda -- --template react
cd kontenda
npm install
npm install firebase react-router-dom react-icons
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**Estructura de carpetas definida:**
```
src/
  components/
    shared/         # Componentes reutilizables
  hooks/            # Custom hooks de Firebase
  pages/
    admin/          # Portal del administrador
    auth/           # Pantalla de login
    client/         # Portal del cliente
  firebase/         # Configuración de Firebase
  utils/            # Funciones utilitarias
```

---

## Paso 2 — Configuración de Firebase

Se creó un proyecto en Firebase Console con:
- **Authentication**: habilitado con proveedor de Email/Contraseña
- **Firestore Database**: modo producción

**Archivo `src/firebase/config.js`:**
```js
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  // Credenciales del proyecto desde .env.local
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  // ...resto de config
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
```

**Estructura de datos en Firestore:**
```
clients/{clientId}
  → name, email, logoUrl, quickLinks[]
  → plan/current
      → planName, planPrice, currency, status
      → startDate, nextBilling, minMonths, monthsActive
      → totalPieces, producedPieces
      → includes[], planTitle
      → payments[]
  → brand/kit
      → briefStatus, logoStatus, photosStatus, referencesStatus
      → briefDriveLink, logoDriveLink, photosDriveLink, referencesDriveLink
      → brandKitReady, brandKitFolderUrl
  → pieces/{pieceId}
      → title, format, status, publishDate
      → description, copy, hashtags, objective, tag
      → driveUrl, frameUrl
      → reviewRounds, maxReviewRounds
      → messages[] (chat)
  → deliveries/{deliveryId}
      → title, pieces, status, deliveryNumber
      → scheduledDate, driveLink, frameLink
      → reviewRounds, maxReviewRounds
```

---

## Paso 3 — Sistema de diseño con Tailwind

Se creó un sistema de tokens de color personalizados en `tailwind.config.js`:

```js
theme: {
  extend: {
    colors: {
      'k-bg':       '#0f0f0f',  // Fondo principal oscuro
      'k-surface':  '#1a1a1a',  // Superficie de tarjetas
      'k-surface2': '#242424',  // Superficie secundaria
      'k-border':   '#2e2e2e',  // Bordes
      'k-text':     '#f0f0f0',  // Texto principal
      'k-muted':    '#6b6b6b',  // Texto secundario
      'k-orange':   '#E86A1A',  // Color primario (acción)
      'k-lila':     '#a292c5',  // Color secundario
      'k-yellow':   '#d4a017',  // Alerta / revisión
    },
    borderRadius: {
      'card':    '8px',
      'card-lg': '12px',
    }
  }
}
```

Todos los componentes usan estas variables para mantener coherencia visual en modo oscuro.

---

## Paso 4 — Autenticación y rutas protegidas

**Hook `useAuth`:**
Se creó un Context de React que escucha cambios en el estado de autenticación de Firebase y expone el usuario actual, su `clientId` y su `role` (admin / client).

**Configuración de rutas (`App.jsx`):**
```
/login                  → pantalla de inicio de sesión

/admin/...              → solo rol "admin"
  /admin/gestor         → gestor de contenido
  /admin/crear          → crear nueva pieza
  /admin/calendario     → calendario global
  /admin/clientes       → gestión de clientes
  /admin/panel          → admin panel (planes y pagos)
  /admin/guiones        → gestión de guiones

/portal/...             → solo rol "client"
  /portal/dashboard     → inicio del cliente
  /portal/contenido     → calendario de contenido
  /portal/plan          → detalle del plan
  /portal/marca         → brand kit
  /portal/suscripcion   → suscripción
  /portal/formulario-marca → formulario de marca
```

Las rutas están protegidas: si no hay sesión activa, redirige a `/login`. Si el rol no coincide, redirige al portal correcto.

---

## Paso 5 — Custom Hooks de Firebase

Cada sección de datos tiene su propio hook que abstrae la lógica de Firestore:

| Hook | Datos que maneja |
|---|---|
| `useAuth` | Usuario autenticado, clientId, role |
| `useMyPlan` | Plan activo y entregas del cliente |
| `usePieces` | Piezas de contenido en tiempo real |
| `useMyBrand` | Estado del brand kit |
| `useClients` | Lista de todos los clientes (admin) |
| `useScripts` | Guiones (admin) |

Todos usan `onSnapshot` de Firestore para escuchar cambios en tiempo real, de manera que cualquier actualización del admin se refleja inmediatamente en el portal del cliente.

---

## Paso 6 — Portal del cliente

Se construyeron 5 páginas principales para el portal cliente:

### Dashboard (`Dashboard.jsx`)
- Saludo personalizado con nombre del cliente
- Alerta dinámica si hay entregas disponibles
- Métricas del mes (piezas, rondas, próximo cobro)
- `ProgressTracker` de 5 pasos con lógica automática
- Grid de accesos rápidos (Mi contenido, WhatsApp, Suscripción)
- Vista previa de entregas y contenido reciente

### Mi Contenido (`MyContent.jsx`)
- Calendario con 3 vistas: día, semana y mes
- Drag & drop para mover piezas de fecha (vista mes)
- Cambio de estado con un clic (En revisión → Aprobado → Publicado)
- Panel de detalle full-screen con toda la información de la pieza
- Chat integrado por pieza para comentarios y aprobaciones
- Quick links de redes sociales del cliente

### Mi Plan (`MyPlan.jsx`)
- Métricas del plan con barras de progreso
- `ProgressTracker` de estado del mes
- Listado completo de entregas con sus links a Drive y Frame.io

### Mi Marca (`MyBrand.jsx`)
- Flujo guiado de 3 pasos con indicadores visuales
- Estado de cada archivo de marca (manual, logo, buyer persona, referencias)
- Links directos a carpetas de Drive para subir archivos
- Botón de confirmación vía WhatsApp
- Banner de "Brand Kit listo" cuando todo está revisado

### Suscripción (`Subscription.jsx`)
- Información completa del plan y precio
- Cálculo automático de fecha posible de cancelación
- Lista de beneficios incluidos
- Acciones: mejorar plan, cancelar (con flujo guiado)
- Historial de pagos en tabla

---

## Paso 7 — Portal del administrador

Se construyeron 6 páginas para el equipo de Liu Creativo:

### Gestor de Contenido (`ContentManager.jsx`)
Vista global de todas las piezas de todos los clientes, con filtros por estado, cliente y formato.

### Crear Pieza (`CreatePiece.jsx`)
Formulario para registrar una nueva pieza: título, cliente, formato, fecha, copy, hashtags, links de Drive/Frame.io y rondas de revisión.

### Calendario (`Calendar.jsx`)
Vista de calendario mensual con todas las piezas de todos los clientes.

### Gestión de Clientes (`ClientManager.jsx`)
CRUD de clientes: crear, editar, ver estado del brand kit, configurar links rápidos.

### AdminPanel (`AdminPanel.jsx`)
Gestión de planes por cliente: asignar plan, configurar incluidos, agregar entregas del mes, registrar pagos en el historial.

### Guiones (`Scripts.jsx`)
Gestión de guiones de contenido con estados y asignación a cliente.

---

## Paso 8 — Componentes compartidos

Se construyeron componentes reutilizables para mantener consistencia:

| Componente | Función |
|---|---|
| `StatusBadge` | Badge de color para estados de piezas |
| `FormatBadge` | Badge con color por formato (Reels, Post, etc.) |
| `RoundIndicator` | Indicador visual de rondas de revisión usadas |
| `ChatPanel` | Panel de mensajes por pieza (cliente y admin) |
| `ProgressTracker` | Barra de 5 pasos del ciclo de producción mensual |
| `LoadingScreen` | Pantalla de carga inicial |

---

## Paso 9 — Funcionalidades avanzadas implementadas

### Chat por pieza
Cada pieza tiene un canal de mensajes en Firestore (`messages[]`). El chat muestra mensajes con diferenciación visual entre cliente y admin, y un contador de rondas de revisión.

### Drag & drop en calendario
En la vista de mes, las piezas son arrastrables. Al soltarlas en otro día, se actualiza la `publishDate` en Firestore directamente.

### ProgressTracker automático
La lógica del tracker calcula el paso activo automáticamente según el estado del plan y las piezas, sin que el admin deba actualizar manualmente.

### Cálculo de fecha de cancelación
La plataforma calcula automáticamente la fecha desde la que el cliente puede cancelar sin penalidad, sumando los meses de permanencia mínima a la fecha de inicio.

### Historial de pagos
Los pagos se almacenan como array en el documento del plan. El admin puede agregar registros de pago desde AdminPanel y el cliente los ve en Suscripción.

---

## Paso 10 — Despliegue

El proyecto se compila y despliega en **GitHub Pages**:

```bash
npm run build        # Genera la carpeta dist/
git add dist/
git push origin gh-pages
```

La rama `gh-pages` sirve la carpeta `dist/` como sitio estático. Las variables de entorno de Firebase están en `.env.local` (no versionado).

---

## Resumen del tiempo de desarrollo

| Fase | Descripción |
|---|---|
| Fase 1 | Scaffold, Firebase, autenticación, rutas protegidas |
| Fase 2 | Portal cliente: Dashboard, Mi Contenido (calendario), Mi Plan |
| Fase 3 | Portal admin: ContentManager, CreatePiece, Calendar, ClientManager |
| Fase 4 | Mi Marca (flujo Drive), Suscripción (cancelación, historial de pagos) |
| Fase 5 | AdminPanel (gestión de planes, pagos, incluidos), Chat por pieza |
| Fase 6 | Drag & drop, ProgressTracker automático, formulario de marca |

---

*Kontenda — construido con React + Firebase para Liu Creativo*
