# Kontenda — Product Requirements Document (PRD)

> Versión 1.0 · Mayo 2026 · Liu Creativo

---

## 1. Resumen ejecutivo

**Kontenda** es una plataforma web de gestión de contenido creativo diseñada exclusivamente para la agencia **Liu Creativo**. Reemplaza la gestión manual dispersa (hojas de cálculo, carpetas de Drive, mensajes de WhatsApp) con un portal centralizado que conecta al equipo interno con sus clientes, automatizando el seguimiento del ciclo de producción de principio a fin.

**Estado actual:** Fases 1 y 2 completadas y en producción. Fases 3 y 4 en desarrollo.

---

## 2. Problema que resuelve

### Situación anterior (sin Kontenda)
- El seguimiento del estado de cada pieza se hacía manualmente en hojas de cálculo
- Los clientes recibían actualizaciones por WhatsApp o email, sin visibilidad directa
- No había trazabilidad de rondas de revisión ni historial de aprobaciones
- La información de marca de cada cliente estaba dispersa en múltiples carpetas de Drive
- El historial de pagos y planes se gestionaba en documentos separados
- No existía una fuente única de verdad sobre el estado de producción

### Impacto del problema
- Tiempo del equipo desperdiciado en comunicación de estado
- Clientes sin visibilidad sobre su contenido
- Riesgo de perder información clave de clientes
- Dificultad para escalar la operación sin aumentar la carga administrativa

---

## 3. Usuarios del sistema

### 3.1 Admin — Equipo de Liu Creativo
**Descripción:** Los integrantes del equipo interno de la agencia que gestionan clientes, producen contenido y administran la plataforma.

**Necesidades:**
- Ver el estado de todas las piezas de todos los clientes en un solo lugar
- Crear y actualizar piezas de contenido con toda la información relevante
- Gestionar planes, pagos y configuración por cliente
- Comunicarse con el cliente por pieza (chat)
- Ver el calendario de publicaciones global
- Gestionar guiones de contenido

### 3.2 Cliente — Marcas gestionadas por Liu Creativo
**Descripción:** Las empresas o personas que contratan los servicios de Liu Creativo y acceden a su portal personal.

**Necesidades:**
- Ver el estado de su contenido en producción
- Revisar y aprobar piezas antes de su publicación
- Dejar feedback específico por pieza
- Monitorear el avance de su plan mensual
- Gestionar sus archivos de marca (brief, logo, referencias)
- Consultar su suscripción e historial de pagos

---

## 4. Alcance del producto

### 4.1 En alcance (in scope)
- Portal web para dos roles: admin y cliente
- Autenticación por email y contraseña
- Gestión completa del ciclo de vida de piezas de contenido
- Calendario de publicaciones con drag & drop
- Chat por pieza entre admin y cliente
- Sistema de rondas de revisión con contador
- Gestión de planes, entregas y pagos por cliente
- Onboarding de marca con checklist de archivos
- Formulario web de brief de marca
- Guiones de contenido (admin)
- Panel interno de administración de planes
- Despliegue en GitHub Pages

### 4.2 Fuera de alcance (out of scope)
- Almacenamiento de archivos (se usan URLs de Google Drive / Frame.io)
- Publicación directa en redes sociales
- Sistema de facturación automatizada
- App móvil nativa
- Editor de contenido visual
- Integración con Canva, Meta, Instagram API

---

## 5. Funcionalidades por fase

### Fase 1 — Base ✅ Completada
**Objetivo:** Infraestructura técnica y autenticación funcional.

| Funcionalidad | Descripción |
|---|---|
| Configuración del proyecto | React + Vite + Tailwind + Firebase |
| Firebase Auth | Login por email/contraseña |
| AuthContext | Gestión de estado de sesión y rol |
| Rutas protegidas | Admin Routes / Client Routes |
| Layouts | Sidebar y navegación para admin y cliente |
| Login page | Pantalla de acceso con manejo de errores |

**Criterio de éxito:** Un usuario admin y un usuario cliente pueden iniciar sesión y ver sus respectivos paneles vacíos.

---

### Fase 2 — Admin Core ✅ Completada
**Objetivo:** Herramientas principales para el equipo interno.

| Funcionalidad | Descripción |
|---|---|
| Gestor de Contenido | Vista global de piezas con filtros por estado, cliente y formato |
| Crear Pieza | Formulario completo para registrar nueva pieza |
| Calendario Admin | Vista mensual de todas las piezas de todos los clientes |
| Gestión de Clientes | CRUD de clientes con brand kit y quick links |
| Chat por pieza | Mensajería integrada por pieza entre admin y cliente |
| AdminPanel | Gestión de planes, entregas y pagos por cliente |
| Guiones | Módulo de gestión de ideas y guiones |

**Criterio de éxito:** El equipo puede gestionar el ciclo completo de producción de una pieza desde el panel admin.

---

### Fase 3 — Portal Cliente (En desarrollo)
**Objetivo:** Portal de autoservicio completo para los clientes.

| Funcionalidad | Descripción |
|---|---|
| Dashboard | Resumen del mes: métricas, estado, accesos rápidos |
| Mi Contenido | Calendario de piezas con vistas día/semana/mes y drag & drop |
| Mi Plan | Detalle del plan, métricas y listado de entregas |
| Mi Marca | Flujo de onboarding de brand kit en 3 pasos |
| Suscripción | Info del plan, historial de pagos, flujo de cancelación |
| Formulario de Marca | Cuestionario web sobre identidad de marca |

**Criterio de éxito:** Un cliente puede ingresar al portal, ver su contenido, dejar feedback y aprobar piezas sin necesidad de comunicarse por WhatsApp.

---

### Fase 4 — Funcionalidades Avanzadas (Pendiente)
**Objetivo:** Automatizaciones, panel interno y mejoras de UX.

| Funcionalidad | Descripción | Prioridad |
|---|---|---|
| Panel Interno | Vista interna del equipo con métricas globales | Alta |
| Notificaciones | Alertas cuando hay piezas pendientes de revisión | Alta |
| Drag & drop en calendario | Mover piezas de fecha (cliente y admin) | Media |
| ProgressTracker automático | Cálculo de paso activo sin intervención manual | Media |
| Vista de marca del cliente (admin) | Admin puede ver el brief del cliente | Baja |
| Mejoras de onboarding | Flujos más guiados para nuevos clientes | Baja |

---

## 6. Requisitos no funcionales

| Requisito | Descripción |
|---|---|
| **Rendimiento** | Las páginas deben cargar en menos de 2 segundos con conexión estándar |
| **Tiempo real** | Los cambios de estado se reflejan instantáneamente sin recargar la página |
| **Seguridad** | Las rutas están protegidas por rol; un cliente nunca puede ver datos de otro cliente |
| **Responsividad** | La interfaz debe funcionar correctamente en tablets y desktop |
| **Disponibilidad** | El servicio depende de Firebase (SLA de Google Cloud) |
| **Mantenibilidad** | El código sigue una arquitectura de hooks + contextos + páginas |

---

## 7. Restricciones técnicas y decisiones de diseño

| Decisión | Motivo |
|---|---|
| Sin Firebase Storage | Costo del servicio; los archivos se manejan por URL de Drive |
| GitHub Pages como hosting | Cero costo de infraestructura para el MVP |
| Un documento único para plan y brandAssets | Simplifica queries; se usa doc ID "current" |
| Email/contraseña como único método de auth | Suficiente para el volumen de usuarios actuales |
| No hay sistema de notificaciones push | Fuera del alcance del MVP |

---

## 8. Criterios de éxito globales

| Métrica | Objetivo |
|---|---|
| Reducción de consultas por WhatsApp | El cliente puede responder el 80% de sus preguntas desde el portal |
| Adopción por clientes | El 100% de los clientes activos usa el portal para aprobar contenido |
| Tiempo de onboarding | Un nuevo cliente está operativo en menos de 30 minutos |
| Trazabilidad | Toda pieza tiene historial de estados y mensajes accesible |

---

## 9. Supuestos y dependencias

- Los clientes tienen acceso a Google Drive para subir archivos de marca
- Frame.io es utilizado por el equipo para compartir videos
- WhatsApp es el canal de soporte fuera del portal (+56 9 68280822)
- El equipo de Liu Creativo gestiona la creación de cuentas de usuario manualmente

---

*Kontenda — Product Requirements Document · Liu Creativo · Mayo 2026*
