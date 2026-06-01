# Kontenda — Roadmap de Fases

> Estado al 1 de Junio 2026 · Liu Creativo

---

## Vista general

```
FASE 1          FASE 2          FASE 3           FASE 4
Base            Admin Core      Portal Cliente   Avanzado
  ✅              ✅            🔄 En curso       ⏳ Pendiente
```

---

## Fase 1 — Base ✅ Completada

**Objetivo:** Infraestructura técnica funcional con autenticación y rutas protegidas.

### Entregables completados
- [x] Configuración del proyecto (React + Vite + Tailwind CSS + Firebase)
- [x] Sistema de diseño personalizado (tokens de color `k-*`, tipografía Inter)
- [x] Firebase Auth con email/contraseña
- [x] AuthContext: gestión de sesión, rol y clientId
- [x] Rutas protegidas por rol (AdminRoutes / ClientRoutes)
- [x] Layout admin (sidebar, navegación)
- [x] Layout cliente (sidebar, navegación)
- [x] Pantalla de Login con manejo de errores
- [x] LoadingScreen durante verificación de sesión
- [x] Estructura de Firestore definida

### Archivos clave creados
```
src/firebase/config.js
src/context/AuthContext.jsx
src/hooks/useAuth.js
src/router/AdminRoutes.jsx
src/router/ClientRoutes.jsx
src/components/admin/AdminLayout.jsx
src/components/client/ClientLayout.jsx
src/pages/auth/Login.jsx
```

---

## Fase 2 — Admin Core ✅ Completada

**Objetivo:** Herramientas completas para el equipo interno de Liu Creativo.

### Entregables completados
- [x] Gestor de Contenido (ContentManager.jsx) con filtros por estado, cliente y formato
- [x] Crear Pieza (CreatePiece.jsx) con formulario completo
- [x] Calendario Admin (Calendar.jsx) — vista mensual global
- [x] Gestión de Clientes (ClientManager.jsx) — CRUD completo
- [x] AdminPanel.jsx — gestión de planes, entregas y pagos
- [x] Scripts.jsx — gestión de guiones
- [x] ClientBrandView.jsx — vista admin del brief de marca del cliente
- [x] ChatPanel.jsx — chat en tiempo real por pieza
- [x] StatusBadge, FormatBadge, RoundIndicator — componentes compartidos
- [x] Custom hooks: useClients, usePieces, useScripts
- [x] ToastContext — notificaciones de éxito/error

### Archivos clave creados
```
src/pages/admin/ContentManager.jsx
src/pages/admin/CreatePiece.jsx
src/pages/admin/Calendar.jsx
src/pages/admin/ClientManager.jsx
src/pages/admin/AdminPanel.jsx
src/pages/admin/Scripts.jsx
src/pages/admin/ClientBrandView.jsx
src/components/shared/ChatPanel.jsx
src/components/shared/StatusBadge.jsx
src/components/shared/FormatBadge.jsx
src/components/shared/RoundIndicator.jsx
src/hooks/useClients.js
src/hooks/usePieces.js
src/hooks/useScripts.js
src/context/ToastContext.jsx
```

---

## Fase 3 — Portal Cliente 🔄 En curso

**Objetivo:** Portal de autoservicio completo para que los clientes gestionen su contenido, marca y suscripción.

### Módulos completados
- [x] Dashboard.jsx — resumen del mes con métricas y ProgressTracker
- [x] MyContent.jsx — calendario con vistas día/semana/mes
- [x] MyPlan.jsx — detalle de plan y entregas
- [x] MyBrand.jsx — onboarding de brand kit en 3 pasos
- [x] Subscription.jsx — info de plan, historial de pagos, flujo de cancelación
- [x] BrandForm.jsx — formulario web de brief de marca (con auto-guardado y navegación libre)
- [x] ProgressTracker.jsx — barra de 5 pasos del ciclo mensual
- [x] Custom hooks: useMyPlan, useMyBrand

### Refinamientos completados (Junio 2026)
- [x] BrandForm: Q5 adjetivos negativos con límite independiente (3 positivos + 2 negativos)
- [x] BrandForm: preguntas 9 y 29 eliminadas de ambas versiones (small y large)
- [x] BrandForm: auto-guardado con debounce de 1.5s en Firestore (`clients/{id}/brandForm/latest`)
- [x] BrandForm: navegación libre entre pasos 1–4; validación solo al enviar
- [x] BrandForm: barra de progreso clickeable para saltar entre pasos
- [x] ClientManager: campos RUT y Dirección reemplazados por Región y Comuna
- [x] CreatePiece: pilares de contenido se cargan desde `client.contentPillars` (dinámicos)
- [x] ContentManager: indicador de correcciones disponibles por tarjeta (barras + texto)
- [x] ContentManager: badge de mensajes no leídos por admin en tarjetas
- [x] ChatPanel: contador `unreadByAdmin` se incrementa al enviar mensaje (cliente) y se resetea al abrir pieza (admin)

### Módulos pendientes en Fase 3
- [ ] Drag & drop en calendario (mover piezas de fecha)
- [ ] ProgressTracker con lógica automática completa
- [ ] Mejoras de UX en el flujo de revisión de piezas

### Archivos clave en progreso
```
src/pages/client/Dashboard.jsx
src/pages/client/MyContent.jsx
src/pages/client/MyPlan.jsx
src/pages/client/MyBrand.jsx
src/pages/client/Subscription.jsx
src/pages/client/BrandForm.jsx
src/components/shared/ProgressTracker.jsx
src/hooks/useMyPlan.js
src/hooks/useMyBrand.js
```

---

## Fase 4 — Funcionalidades Avanzadas ⏳ Pendiente

**Objetivo:** Panel interno de métricas, automatizaciones y mejoras de experiencia.

### Funcionalidades planificadas

#### Alta prioridad
- [ ] Panel Interno (admin) — métricas globales: clientes activos, piezas del mes, facturación
- [ ] Sistema de notificaciones — alertas cuando un cliente aprueba o comenta una pieza
- [ ] Vista de estadísticas por cliente — desempeño histórico

#### Media prioridad
- [ ] Drag & drop completo en calendario (admin y cliente)
- [ ] Exportación de reportes — resumen mensual por cliente en PDF
- [ ] Mejoras de búsqueda en gestor de contenido (búsqueda por texto)

#### Baja prioridad
- [ ] Multi-idioma (español/inglés) para clientes internacionales
- [ ] Modo de vista previa de calendario público (para compartir con clientes sin login)
- [ ] Integración de métricas de redes sociales

---

## Dependencias entre fases

```
Fase 1 (Auth + Rutas)
    └─→ Fase 2 (Admin Core requiere auth y Firestore)
            └─→ Fase 3 (Portal Cliente usa datos creados por admin)
                    └─→ Fase 4 (Avanzado mejora lo existente)
```

**Nota crítica:** La Fase 3 (portal cliente) depende de que el admin haya configurado el cliente en Firestore con su plan y piezas. El portal cliente muestra datos, no los crea.

---

## Stack tecnológico vigente

| Tecnología | Versión | Rol |
|---|---|---|
| React | 19.x | Framework UI |
| Vite | Latest | Build tool |
| Firebase Auth | 12.x | Autenticación |
| Cloud Firestore | 12.x | Base de datos en tiempo real |
| React Router | v7.x | Navegación y rutas |
| Tailwind CSS | v3.x | Sistema de estilos |
| React Icons | 5.x | Librería de íconos |

---

## Historial de entregables

| Fecha | Hito |
|---|---|
| Inicio | Fase 1: configuración base y autenticación |
| Semana 2 | Fase 2: admin core (gestor, crear pieza, clientes) |
| Semana 3 | Fase 2: calendario, AdminPanel, guiones, chat |
| Semana 4–5 | Fase 3: portal cliente (dashboard, contenido, plan, marca) |
| Mayo 2026 | Fase 3 en refinamiento; Fase 4 pendiente |
| Junio 2026 | Refinamiento Fase 3: BrandForm pulido, pilares dinámicos, mensajes no leídos, indicador de correcciones |

---

## Próximos pasos inmediatos

1. **Completar Fase 3:** Drag & drop en calendario, lógica de ProgressTracker automática, pulido de UX
2. **QA de flujo end-to-end:** Un cliente completo desde onboarding hasta aprobación de primera entrega
3. **Iniciar Fase 4:** Panel Interno como primera funcionalidad

---

*Kontenda — Roadmap de Fases · Liu Creativo · Mayo 2026*
