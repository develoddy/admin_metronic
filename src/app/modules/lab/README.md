# 🧪 Lab Module

## Arquitectura Unificada: Module = MVP

Este módulo representa el **SaaS Lab** donde se gestionan todos los micro-SaaS en cualquier etapa de su ciclo de vida.

### 🎯 Concepto Principal

**No existe separación entre "MVP" y "Module".**

- Un `Module` con `status = 'testing'` **ES** un MVP en validación
- Un `Module` con `status = 'live'` es un producto validado y activo
- Un `Module` con `status = 'archived'` fue descartado

### 📦 Estructura

```
lab/
├── modules/              # 📦 Gestión de Modules (CRUD)
│   ├── modules-list/     # Lista de todos los modules
│   ├── module-form/      # Crear/Editar module
│   └── module-detail/    # Detalle de module
├── mvp-analytics/        # 📊 Analytics agregados de todos los modules
├── mvp-decision-engine/  # ⚖️ Motor de decisiones (validar/archivar)
├── tracking-events/      # 📡 Eventos de tracking
├── tenants/              # 👥 Gestión de tenants por module
├── email-testing-saas/   # 📬 Testing de emails
└── dashboard/            # 📊 Dashboard general del Lab

```

### 🔄 Flujo de Trabajo

1. **Crear Module** con `status = 'testing'`
2. **Wizard** usa `modules.key` como identificador
3. **Tracking events** asocian eventos con `module = modules.key`
4. **Analytics** agrega métricas por module
5. **Decisión**:
   - ✅ Validado → `status = 'live'`
   - 🗄️ Archivado → `status = 'archived'`
   - ⏸️ Continuar → sigue en `status = 'testing'`

### 🚫 Conceptos Eliminados

- ❌ "Crear módulo desde MVP"
- ❌ Conversión posterior MVP → Module
- ❌ Entidad separada para MVP
- ❌ `ModuleCreationService`

### 📊 Base de Datos

**Tabla: `modules`**
- Campo `status` maneja todo el ciclo de vida
- `tracking_events.module` referencia `modules.key` (string)
- `tenants.module_key` referencia `modules.key`

### 🔗 Navegación

- **Gestión de Modules**: `/lab/modules`
- **Analytics**: `/lab/analytics`
- **Tracking**: `/lab/tracking`
- **Tenants**: `/lab/tenants`
- **Emails**: `/lab/email-testing`

### 🔄 Redirects Retrocompatibles

- `/saas/*` → `/lab/*`
- `/modules-management/*` → `/lab/modules/*`

---

**Última actualización**: 13 de febrero de 2026  
**Refactor**: Unificación conceptual Module = MVP
