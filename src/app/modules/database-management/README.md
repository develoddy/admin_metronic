# 🚨 Database Management Module

## Descripción

Módulo de gestión avanzada de base de datos que permite realizar operaciones críticas de manera segura desde el panel de administración.

## ✅ Características Implementadas

### 🔒 **Seguridad Multi-Capa**
- ✅ **Super Admin exclusivo**: Solo usuarios con rol `SUPER_ADMIN`
- ✅ **Confirmación múltiple**: Requiere checkboxes y texto específico
- ✅ **Variables de entorno**: `ALLOW_DB_MANAGEMENT=true` requerida
- ✅ **Logging detallado**: Audit trail completo de todas las operaciones
- ✅ **Backup automático**: Integración con sistema de backups existente

### 🛠️ **Operaciones Disponibles**

#### 1. 🚨 **Reset Completo de Base de Datos**
- **Función**: `sequelize.sync({ force: true })`
- **Efecto**: Borra TODOS los datos y recrea estructura
- **Seguridad**: 
  - Texto de confirmación exacto: `"DELETE ALL DATA"`
  - Backup automático opcional (recomendado)
  - Razón obligatoria para audit trail

#### 2. 🏃‍♂️ **Ejecutar Migraciones**
- **Función**: `npx sequelize-cli db:migrate`
- **Efecto**: Aplica cambios de estructura pendientes
- **Seguridad**: Confirmación simple

#### 3. ↩️ **Rollback de Migración**
- **Función**: `npx sequelize-cli db:migrate:undo`
- **Efecto**: Revierte última migración
- **Seguridad**: Confirmación con advertencia

#### 4. 📊 **Estado del Sistema**
- Información completa de la base de datos
- Lista de tablas y migraciones
- Estado de permisos y configuración

### 🔗 **Integración con Módulo de Backups**
- ✅ Reutiliza `BackupsService` existente
- ✅ Crea backup automático antes de reset
- ✅ Muestra backups recientes en dashboard
- ✅ Permite crear backups manuales
- ✅ Enlaza al módulo de backups completo

## 🚀 **Uso del Sistema**

### **Backend API**

```bash
# Endpoints disponibles (requieren Super Admin)
GET    /api/database-management/status
POST   /api/database-management/reset
POST   /api/database-management/migrate
POST   /api/database-management/rollback
```

### **Variables de Entorno Requeridas**

```env
# Seguridad principal
ALLOW_DB_MANAGEMENT=true

# Opcional: permitir en producción (¡PELIGROSO!)
ALLOW_PROD_DB_RESET=true
```

### **Frontend Admin**

```typescript
// Acceso al módulo
/database-management

// Integración con backups
this.databaseService.resetWithAutomaticBackup()
this.databaseService.createBackupBeforeOperation()
```

## 🔧 **Configuración e Instalación**

### **1. Backend**
```bash
# Los archivos ya están creados:
# - api/src/controllers/database-management.controller.js
# - api/src/routes/database-management.routes.js
# - Ruta agregada en api/src/routes/index.js
```

### **2. Frontend**
```bash
# Estructura del módulo:
admin/src/app/modules/database-management/
├── components/
│   ├── database-management-dashboard.component.ts
│   ├── database-management-dashboard.component.html
│   └── database-management-dashboard.component.scss
├── services/
│   └── database-management.service.ts
├── models/
│   └── database-management.models.ts
├── database-management.module.ts
└── database-management-routing.module.ts
```

### **3. Agregar al Routing Principal**

En `admin/src/app/pages/pages-routing.module.ts`:

```typescript
{
  path: 'database-management',
  loadChildren: () => import('../modules/database-management/database-management.module').then(m => m.DatabaseManagementModule),
  data: { requireSuperAdmin: true }
}
```

### **4. Agregar al Menú de Navegación**

En el archivo de menú del admin:

```typescript
{
  title: 'Database Management',
  root: true,
  icon: 'fas fa-database',
  page: '/database-management',
  bullet: 'dot',
  permission: 'super_admin'
}
```

## ⚠️ **Consideraciones de Seguridad**

### **Producción**
- ❌ **Por defecto DESHABILITADO** en producción
- ✅ Requiere `ALLOW_PROD_DB_RESET=true` explícito
- ✅ Backup automático obligatorio en producción

### **Desarrollo**
- ✅ Habilitado si `ALLOW_DB_MANAGEMENT=true`
- ✅ Backup opcional (pero recomendado)

### **Logging y Audit Trail**
```json
{
  "operation": "DATABASE_RESET",
  "user": "admin@example.com",
  "timestamp": "2025-12-12T10:30:00Z",
  "environment": "development",
  "reason": "Testing new features",
  "backupCreated": true,
  "backupFilename": "ecommercedb_AUTO_RESET_2025-12-12_10-30-00.sql.gz"
}
```

## 🎯 **Flujo de Trabajo Recomendado**

### **Para Reset de DB:**
1. **Verificar acceso**: Solo Super Admin puede acceder
2. **Crear backup**: Sistema sugiere backup automático
3. **Confirmar operación**: Múltiples confirmaciones requeridas
4. **Ejecutar reset**: `sync({ force: true })` con logging
5. **Verificar resultado**: Estado actualizado automáticamente

### **Para Migraciones:**
1. **Verificar estado**: Ver migraciones pendientes
2. **Ejecutar**: `db:migrate` con confirmación
3. **Verificar**: Estado actualizado automáticamente

## 🔧 **Mantenimiento y Monitoreo**

### **Logs Importantes**
- Todas las operaciones quedan registradas
- Usuarios, timestamps, y razones documentadas
- Errores capturados y reportados

### **Integración con Sentry**
- Errores automáticamente reportados
- Contexto completo de operaciones fallidas

## 📋 **Próximas Mejoras**

- [ ] **Programación de resets**: Ejecutar en horarios específicos
- [ ] **Múltiples entornos**: Diferentes configuraciones por ambiente
- [ ] **Notificaciones**: Emails/Slack cuando se ejecutan operaciones
- [ ] **Historial**: Dashboard de operaciones ejecutadas
- [ ] **Templates**: Configuraciones predefinidas de reset

## 🆘 **Troubleshooting**

### **Error: "Acceso Denegado"**
- Verificar rol de Super Admin del usuario
- Confirmar variable `ALLOW_DB_MANAGEMENT=true`

### **Error: "Operación no permitida en producción"**
- Agregar `ALLOW_PROD_DB_RESET=true` en producción
- ⚠️ Solo usar si realmente necesario

### **Error en Backup Automático**
- Verificar módulo de backups funcionando
- Confirmar permisos de escritura en directorio backups/

---

## 🎉 **Resultado Final**

✅ **Sistema seguro** para operaciones críticas de DB  
✅ **Integración perfecta** con backups existentes  
✅ **Interfaz intuitiva** con múltiples confirmaciones  
✅ **Logging completo** para auditoría  
✅ **Flexible** para desarrollo y producción  

**El módulo está listo para usar de forma segura! 🚀**