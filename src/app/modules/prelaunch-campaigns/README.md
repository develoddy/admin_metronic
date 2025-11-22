# 🚀 Módulo de Campañas de Pre-lanzamiento - Admin

## 📋 Descripción

Módulo completo de administración para gestionar campañas de pre-lanzamiento, suscriptores y envío masivo de emails de lanzamiento. Reemplaza la necesidad de ejecutar scripts manualmente en el servidor.

## 🏗️ Estructura del Módulo

```
prelaunch-campaigns/
├── prelaunch-campaigns.module.ts          # Módulo principal
├── prelaunch-campaigns-routing.module.ts  # Configuración de rutas
├── services/
│   └── prelaunch-campaigns.service.ts     # Servicio HTTP
├── dashboard/                             # Dashboard principal con métricas
│   ├── dashboard.component.ts
│   ├── dashboard.component.html
│   └── dashboard.component.scss
├── subscribers-list/                      # Lista y gestión de suscriptores
│   ├── subscribers-list.component.ts
│   ├── subscribers-list.component.html
│   └── subscribers-list.component.scss
├── launch-campaign/                       # Envío de campaña masiva
│   ├── launch-campaign.component.ts
│   ├── launch-campaign.component.html
│   └── launch-campaign.component.scss
└── campaign-stats/                        # Estadísticas avanzadas
    ├── campaign-stats.component.ts
    ├── campaign-stats.component.html
    └── campaign-stats.component.scss
```

## 🎯 Funcionalidades Principales

### 1. Dashboard (`/prelaunch/dashboard`)
- **Métricas en tiempo real:**
  - Total de suscriptores
  - Suscriptores verificados
  - Suscriptores pendientes de verificación
  - Suscriptores notificados
- **Gráficos y estadísticas:**
  - Distribución por fuente (main_form, footer_form, etc.)
  - Tasa de conversión
- **Acciones rápidas:**
  - Botón directo para enviar campaña
  - Acceso rápido a lista de suscriptores

### 2. Lista de Suscriptores (`/prelaunch/subscribers`)
- **Tabla completa** con todos los suscriptores
- **Filtros avanzados:**
  - Por estado (pending, subscribed, unsubscribed)
  - Por verificación (verificado / no verificado)
  - Por notificación (notificado / pendiente)
  - Búsqueda por email
- **Información detallada:**
  - Email, fuente, estado, verificación
  - Fecha de registro
  - UTM parameters (source, medium, campaign)
- **Exportación a CSV** para análisis externo

### 3. Envío de Campaña (`/prelaunch/launch`)
**⚠️ FUNCIONALIDAD PRINCIPAL - Reemplaza el script manual**

- **Configuración del cupón:**
  - Descuento (porcentaje o monto fijo)
  - Días de validez (1-30 días)
- **Productos destacados:**
  - Hasta 6 productos configurables
  - Nombre, precio, imagen
- **Vista previa del email** antes de enviar
- **Envío seguro con confirmación:**
  - Modal de confirmación crítica
  - Resumen de configuración
  - Advertencia de acción irreversible
- **Progreso en tiempo real:**
  - Barra de progreso durante el envío
  - Contador de emails procesados
- **Resultados detallados:**
  - Emails enviados con éxito
  - Errores encontrados
  - Tasa de éxito

### 4. Estadísticas (`/prelaunch/stats`)
- Módulo preparado para estadísticas avanzadas futuras
- Placeholder para integraciones con analytics

## 🔌 Endpoints del Backend

### Endpoints Públicos
```typescript
POST   /api/prelaunch/subscribe              // Registro de usuarios
GET    /api/prelaunch/verify                 // Verificación de email
POST   /api/prelaunch/unsubscribe            // Desuscripción
```

### Endpoints Administrativos
```typescript
GET    /api/prelaunch/stats                  // Estadísticas generales
GET    /api/prelaunch/admin/subscribers      // Lista completa con filtros
GET    /api/prelaunch/admin/subscribers/:id  // Detalle de suscriptor
POST   /api/prelaunch/admin/campaigns/launch // 🚀 Enviar campaña masiva
POST   /api/prelaunch/admin/campaigns/preview// Vista previa del email
GET    /api/prelaunch/admin/export           // Exportar a CSV
POST   /api/prelaunch/admin/resend-verification // Reenviar verificación
```

## 🚀 Cómo Usar

### 1. Acceder al Módulo
- Desde el menú lateral: **Marketing → Pre-lanzamiento**
- URL directa: `http://localhost:4200/prelaunch/dashboard`

### 2. Enviar Campaña de Lanzamiento

**Pasos:**

1. Ir a **Marketing → Pre-lanzamiento → Enviar Campaña**
2. Configurar el cupón:
   - Descuento: `15%` o `€10`
   - Validez: `7` días
3. Configurar productos destacados (4-6 productos)
4. Click en **"Vista Previa"** para revisar el email
5. Click en **"Enviar Campaña"**
6. Confirmar en el modal de advertencia
7. Esperar resultados (progreso en tiempo real)

**🎉 ¡Listo! La campaña se envía automáticamente a todos los suscriptores verificados.**

### 3. Monitorear Resultados
- Ver dashboard para métricas actualizadas
- Revisar lista de suscriptores para confirmar notificaciones
- Exportar datos para análisis externo

## 🔐 Seguridad (Recomendado para Producción)

### Agregar Autenticación
Para proteger los endpoints administrativos, agregar middleware de autenticación:

```typescript
// En: api/src/routes/prelaunch.routes.js
import { authenticateAdmin } from '../middlewares/auth.middleware.js';

// Proteger rutas admin
router.post('/admin/campaigns/launch', authenticateAdmin, sendLaunchEmailsCampaign);
router.get('/admin/subscribers', authenticateAdmin, getAllSubscribers);
// ... etc
```

### Permisos por Rol
```typescript
// Ejemplo de middleware de roles
const requireRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Acceso denegado' });
  }
  next();
};

// Aplicar
router.post('/admin/campaigns/launch', 
  authenticateAdmin, 
  requireRole(['admin', 'marketing']), 
  sendLaunchEmailsCampaign
);
```

## 📊 Ventajas vs Script Manual

| Aspecto | Script Manual | Módulo Admin |
|---------|--------------|--------------|
| **Interfaz** | Terminal | Dashboard visual |
| **Seguridad** | Sin autenticación | Con autenticación |
| **Auditoría** | Logs dispersos | Historial centralizado |
| **Preview** | No disponible | Sí, con vista previa |
| **Accesibilidad** | Solo devs con SSH | Cualquier admin autorizado |
| **Escalabilidad** | Manual | Automatizado |
| **UX** | Línea de comandos | Interfaz amigable |

## 🛠️ Configuración

### Variables de Entorno
Asegúrate de tener configuradas en el servicio:

```typescript
// admin/src/app/modules/prelaunch-campaigns/services/prelaunch-campaigns.service.ts
private API_URL = environment.API_URL || 'http://localhost:3500/api';
```

### Actualizar URL de Backend
```typescript
// Cambiar en: prelaunch-campaigns.service.ts línea 63
private API_URL = 'http://localhost:3500/api'; // Desarrollo
// private API_URL = 'https://api.tudominio.com/api'; // Producción
```

## 🎨 Personalización

### Cambiar Colores de Métricas
Editar en `dashboard.component.html`:
```html
<!-- Total: bg-primary -->
<div class="card bg-primary">

<!-- Verificados: bg-success -->
<div class="card bg-success">

<!-- Pendientes: bg-warning -->
<div class="card bg-warning">

<!-- Notificados: bg-info -->
<div class="card bg-info">
```

### Agregar Más Filtros
En `subscribers-list.component.ts`:
```typescript
// Agregar nuevo filtro
filterSource: string = 'all';

// Agregar en filteredSubscribers()
const matchesSource = this.filterSource === 'all' || sub.source === this.filterSource;
```

## 🐛 Troubleshooting

### Error: "No se pudo conectar con el servidor"
**Solución:** Verificar que el backend esté corriendo en el puerto correcto.
```bash
cd api && npm run dev
```

### Error: "Forbidden" al enviar campaña
**Solución:** Verificar autenticación y permisos del usuario.

### Suscriptores no aparecen
**Solución:** Verificar que la migración de la tabla se haya ejecutado:
```bash
NODE_ENV=production npx sequelize-cli db:migrate:status
```

## 📈 Próximas Mejoras

- [ ] WebSockets para progreso en tiempo real
- [ ] A/B Testing de templates de email
- [ ] Segmentación avanzada de audiencias
- [ ] Programación de envíos (scheduling)
- [ ] Integración con Google Analytics
- [ ] Templates visuales editables
- [ ] Historial completo de campañas
- [ ] Métricas de apertura y clicks

## 📝 Notas Importantes

1. **Backup antes de enviar:** Siempre hacer backup de la BD antes de campañas masivas
2. **Pruebas primero:** Usar el preview antes de enviar
3. **Horarios óptimos:** Enviar en horarios con mayor engagement
4. **Límites de SMTP:** Verificar límites de tu proveedor de email
5. **Monitoreo post-envío:** Revisar logs y errores después de cada campaña

---

**Desarrollado por:** LujanDev Team
**Fecha:** 22 de noviembre de 2025
**Versión:** 1.0.0
