# 🧪 Guía de Pruebas - Motor de Decisiones MVP Analytics

**Versión**: 1.0  
**Fecha**: 9 de febrero de 2026  
**Autor**: Claude (GitHub Copilot)

---

## 📋 Tabla de Contenidos

1. [Prerequisitos](#prerequisitos)
2. [Vista General del Sistema](#vista-general-del-sistema)
3. [Escenarios de Prueba](#escenarios-de-prueba)
4. [Pruebas Paso a Paso](#pruebas-paso-a-paso)
5. [Checklist de Validación](#checklist-de-validación)
6. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisitos

### Base de Datos

Asegurar que la tabla `tracking_events` existe con la estructura:

```sql
-- Verificar estructura
DESCRIBE tracking_events;

-- Campos requeridos:
-- id, module, event, session_id, user_id, guest_id, properties, timestamp
```

### API Backend

```bash
# Verificar que el servidor API está corriendo
curl http://localhost:3000/api/health

# Verificar endpoint de analytics
curl http://localhost:3000/api/admin/saas/micro-saas/analytics?period=30d \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Admin Panel

```bash
# Compilar y ejecutar admin
cd admin
npm install
npm start

# El admin debe estar en http://localhost:4200
```

### App SaaS (Frontend Usuario)

```bash
# Ejecutar app donde los usuarios interactúan con MVPs
cd app-saas
npm install
npm start

# App debe estar en http://localhost:4201
```

---

## 🎯 Vista General del Sistema

### Flujo de Datos

```
Usuario en App SaaS
    ↓
Interactúa con MVP (Video Express, MailFlow, etc.)
    ↓
Eventos de tracking se registran en tracking_events
    ↓
Motor de Decisiones analiza eventos
    ↓
Dashboard MVP Analytics muestra KPIs + Recomendaciones
    ↓
Admin ejecuta acciones (Crear Módulo / Archivar / Continuar)
```

### Eventos de Tracking Clave

**⚠️ IMPORTANTE**: Para que las métricas funcionen correctamente, cada MVP debe cumplir el [Event Contract](./MVP-EVENT-CONTRACT.md).

| Evento | Descripción | Properties |
|--------|-------------|------------|
| `wizard_started` | Usuario inicia wizard | `{ step: 1, module: 'video-express' }` |
| `wizard_completed` | ✅ **CRÍTICO**: Wizard completado | `{ step: 4, completed: true, module: 'video-express' }` |
| `download` | Usuario descarga resultado | `{ jobId, module: 'video-express' }` |
| `video_generated` | Video generado (informativo) | `{ jobId }` |
| `feedback` | Usuario da feedback | `{ helpful: true/false }` |

**Criterios de Completado por MVP**:
- **Video Express**: ✅ Video generado = Wizard completado
- **MailFlow**: ✅ Campaña guardada = Wizard completado  
- **Product Finder**: ✅ Resultados mostrados = Wizard completado

**Separación Clara**:
- 🎬 `video_generated` → NO cuenta como descarga (informativo)
- 📥 `video_downloaded` → SÍ cuenta como descarga

---

## 🔬 Escenarios de Prueba

### Escenario 1: MVP con Datos Insuficientes (Low Data)

**Objetivo**: Validar que el sistema detecta y maneja correctamente MVPs con poca data.

**Criterios**:
- Menos de 5 sesiones únicas
- Menos de 3 wizard starts
- Menos de 3 feedbacks

**Resultado Esperado**:
- Badge "⚠️ Low Data" visible en card del dashboard
- Health Score penalizado (máximo 50)
- Banner de warning en vista detallada
- Alertas de "Datos Insuficientes"
- Recomendación: "Continuar" con mensaje de poca data
- Tasas muestran "N/A (poca data)" cuando aplica

---

### Escenario 2: MVP con Métricas Inconsistentes

**Objetivo**: Detectar problemas de tracking (wizard_starts > sesiones).

**Criterios**:
- `wizard_starts` > `totalSessions` × 3
- Eventos sin `session_id` consistente

**Resultado Esperado**:
- Alerta de "⚠️ Métrica Inconsistente"
- Metadata `_meta` en respuesta API para debugging
- Mensaje: "Revisar tracking de session_id"

---

### Escenario 3: MVP Listo para Módulo Formal (Success)

**Objetivo**: Validar criterios para crear módulo oficial.

**Criterios**:
- Health Score ≥ 70
- Downloads ≥ 50
- Helpful Rate ≥ 80%
- `insufficient_data` = false

**Resultado Esperado**:
- Badge "🚀 Crear Módulo" verde
- Alerta "🎉 MVP Validado"
- Recomendación: "create_module" con confianza "high"
- Botón "Crear Módulo Oficial" habilitado
- Al ejecutar: módulo se crea en tabla `modules`

---

### Escenario 4: MVP con Performance Bajo (Archive)

**Objetivo**: Validar criterios para archivar MVP que no valida.

**Criterios**:
- Health Score < 40
- Sesiones ≥ 20
- Feedback negativo alto (helpful_rate < 60%)

**Resultado Esperado**:
- Badge "🗄️ Archivar" rojo
- Alerta de "😞 Feedback Negativo Alto"
- Recomendación: "archive" con razón clara
- Botón "Archivar MVP" habilitado
- Al ejecutar: eventos marcados como archived

---

### Escenario 5: MVP en Validación (Continue)

**Objetivo**: MVP con datos suficientes pero necesita mejoras.

**Criterios**:
- Health Score entre 40-69
- Sesiones ≥ 10
- Conversion rate < 50% o helpful_rate < 80%

**Resultado Esperado**:
- Badge "⏸️ Continuar" amarillo
- Alertas específicas de mejoras (ej: "⚠️ Baja Conversión")
- Recomendación: "continue" con próximos pasos claros
- Botón "Continuar Validación" habilitado

---

## 🧪 Pruebas Paso a Paso

### PRUEBA 1: Escenario de Datos Insuficientes

#### Paso 1: Limpiar Datos de Prueba

```sql
-- Eliminar eventos previos del MVP de prueba
DELETE FROM tracking_events WHERE module = 'video-express-test';
```

#### Paso 2: Generar Eventos Mínimos (< 5 sesiones)

Desde la app SaaS (o manualmente via SQL):

```sql
-- Insertar 2 sesiones con eventos mínimos
INSERT INTO tracking_events (module, event, session_id, properties, timestamp) VALUES
('video-express-test', 'wizard_started', 'session-001', '{"step": 1}', NOW()),
('video-express-test', 'wizard_completed', 'session-001', '{"step": 4, "completed": true}', NOW()),
('video-express-test', 'wizard_started', 'session-002', '{"step": 1}', NOW());
```

#### Paso 3: Acceder al Dashboard MVP Analytics

1. Login en admin panel: `http://localhost:4200`
2. Navegar a: **Gestión SaaS → 🧠 MVP Analytics**
3. Verificar que aparece el MVP `video-express-test`

#### Paso 4: Validar Visualización

**En Dashboard (lista de MVPs)**:

✅ **Verificar**:
- Card muestra "video-express-test"
- Badge "⚠️ Low Data" visible debajo del nombre
- Health Score bajo (probablemente 5-15)
- Color del score: rojo (danger)
- Badge de recomendación: "⏸️ Continuar" (primary)

**Click en el card → Vista Detallada**:

✅ **Verificar**:
- Banner amarillo de warning: "⚠️ Datos Insuficientes para Análisis Confiable"
- Mensaje detalla: "2 sesiones (mínimo: 5)", "1 wizard starts (mínimo: 3)", etc.
- Health Score con badge: "Penalizado por poca data"
- Gauge visual muestra score bajo
- **KPIs Detallados**:
  - Sesiones Totales: 2
  - Wizard Iniciados: 2
  - Wizard Completados: 1
  - Descargas: 0
- **Tasas de Conversión**:
  - Conversión Wizard: 50% (o "N/A (sin starts)" si 0)
  - Tasa de Descarga: N/A (sin completions)
  - Feedback Positivo: N/A (sin feedback)
- **Recomendación**:
  - Acción: "CONTINUAR"
  - Confianza: "low"
  - Razón: "Datos insuficientes para decidir..."
  - Próximos pasos: lista con 4 items
- **Alertas**:
  - Alerta prioritaria: "📊 Datos Insuficientes" (warning, high priority)

#### Paso 5: Intentar Crear Módulo

Click en botón **"Crear Módulo Oficial"**:

✅ **Verificar**:
- SweetAlert solicita confirmación
- Al confirmar, backend responde con error (lógica debería prevenir creación con datos insuficientes)
- O módulo se crea pero con warnings

---

### PRUEBA 2: MVP con Métricas Suficientes para Módulo

#### Paso 1: Generar Datos Completos

```sql
-- Limpiar datos previos
DELETE FROM tracking_events WHERE module = 'video-express';

-- Script para generar 100 sesiones completas (ajustar según necesidad)
-- Simulación de 100 usuarios diferentes
```

**Ejecutar desde Terminal**:

```bash
# Script de seed de datos
node api/scripts/seed-mvp-tracking-data.js --module=video-express --sessions=100 --success-rate=0.85
```

O manualmente insertar datos representativos:

```sql
-- 100 sesiones, 85 completions, 60 downloads, 50 feedbacks (45 helpful)
-- Ver script de ejemplo en: /api/scripts/seed-tracking-events.sql
```

#### Paso 2: Verificar Datos en DB

```sql
-- Contar eventos por tipo
SELECT 
  event,
  COUNT(*) as total,
  COUNT(DISTINCT session_id) as unique_sessions
FROM tracking_events
WHERE module = 'video-express'
GROUP BY event;

-- Resultado esperado:
-- wizard_started: 100 eventos, 100 sesiones
-- wizard_completed: 85 eventos, 85 sesiones
-- download: 60 eventos, 60 sesiones
-- feedback: 50 eventos, 50 sesiones
```

#### Paso 3: Revisar Analytics en Dashboard

1. Refrescar dashboard: **Botón "Refrescar"**
2. Filtrar período: **30 días**
3. Buscar MVP: `video-express`

✅ **Verificar**:
- Card muestra datos correctos
- **NO** tiene badge "Low Data"
- Health Score alto (esperado: 70-85)
- Color verde (success)
- Badge: "🚀 Crear Módulo" (badge-success)

#### Paso 4: Vista Detallada Completa

Click en card → Vista Detallada:

✅ **Verificar KPIs**:
- Sesiones Totales: 100
- Usuarios Únicos: 100 (si cada sesión tiene user_id diferente)
- Wizard Iniciados: 100
- Wizard Completados: 85
- Descargas: 60
- Usuarios Recurrentes: ~10-15 (usuarios con múltiples sesiones)

✅ **Verificar Tasas**:
- Conversión Wizard: 85% ✅
- Tasa de Descarga: 70% (60/85) ✅
- Retención: ~10-15%
- Feedback Positivo: 90% (45/50) ✅

✅ **Verificar Health Score**:
- Score calculado: ~75-85
- Gauge visual: verde
- Sin badge de penalización
- Sin banner de warning

✅ **Verificar Recomendación**:
- Acción: "create_module" ✅
- Confianza: "high" ✅
- Razón: "Excelente performance: Score 78, 60 descargas, 90% feedback positivo"
- Próximos pasos:
  1. Crear módulo formal en Gestión de Módulos
  2. Configurar pricing y planes
  3. Preparar documentación
  4. Lanzar público

✅ **Verificar Alertas**:
- Alerta: "🎉 MVP Validado" (success, high priority)
- Mensaje: "¡Listo para crear módulo formal! Score 78, 60 descargas."

#### Paso 5: Crear Módulo Oficial

1. Click en botón **"Crear Módulo Oficial"**
2. SweetAlert solicita confirmación
3. Confirmar creación

✅ **Verificar Respuesta**:
- Modal success: "✅ Módulo Creado"
- Mensaje: "El módulo Video Express ha sido creado exitosamente"
- Opciones: "Ver Módulo" o "Continuar aquí"

4. Click en **"Ver Módulo"**

✅ **Verificar Navegación**:
- Redirige a: `/modules-management/edit/video-express`
- Módulo aparece en Gestión de Módulos
- Status: "testing"
- Campos prellenados:
  - Name: "Video Express"
  - Description: "Validated MVP - 100 sessions, 78 score"
  - Tagline: "Validated with 90% positive feedback"
  - Icon: "fa-rocket"
  - Color: "primary"
  - Preview Config: JSON con configuración copiada

#### Paso 6: Validar en Base de Datos

```sql
-- Verificar módulo creado
SELECT * FROM modules WHERE key = 'video-express';

-- Resultado esperado:
-- id, key='video-express', name='Video Express', status='testing', is_active=0 (false)
```

---

### PRUEBA 3: MVP con Performance Bajo (Archivar)

#### Paso 1: Generar Datos Negativos

```sql
-- Limpiar datos previos
DELETE FROM tracking_events WHERE module = 'mailflow-test';

-- Insertar 25 sesiones con bajo performance
-- 25 starts, 8 completions, 2 downloads, 15 feedbacks (3 helpful, 12 no helpful)
```

Ejemplo de script manual:

```sql
-- 25 wizard starts
INSERT INTO tracking_events (module, event, session_id, properties, timestamp)
SELECT 
  'mailflow-test',
  'wizard_started',
  CONCAT('session-', LPAD(n, 3, '0')),
  '{"step": 1}',
  DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 30) DAY)
FROM (
  SELECT @row := @row + 1 as n
  FROM (SELECT 0 UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3) t1,
       (SELECT 0 UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3) t2,
       (SELECT @row := 0) t3
  LIMIT 25
) numbers;

-- 8 completions (baja conversión: 32%)
INSERT INTO tracking_events (module, event, session_id, properties, timestamp)
SELECT 
  'mailflow-test',
  'wizard_completed',
  CONCAT('session-', LPAD(n, 3, '0')),
  '{"step": 4, "completed": true}',
  DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 30) DAY)
FROM (
  SELECT @row := @row + 1 as n FROM (SELECT 0 UNION ALL SELECT 1) t1, (SELECT 0 UNION ALL SELECT 1 UNION ALL SELECT 2) t2, (SELECT @row := 0) t3 LIMIT 8
) numbers;

-- 15 feedbacks (solo 3 helpful: 20% helpful rate)
INSERT INTO tracking_events (module, event, session_id, properties, timestamp)
VALUES
('mailflow-test', 'feedback', 'session-001', '{"helpful": true}', NOW()),
('mailflow-test', 'feedback', 'session-002', '{"helpful": true}', NOW()),
('mailflow-test', 'feedback', 'session-003', '{"helpful": true}', NOW()),
('mailflow-test', 'feedback', 'session-004', '{"helpful": false}', NOW()),
('mailflow-test', 'feedback', 'session-005', '{"helpful": false}', NOW()),
-- ... hasta 15 feedbacks
```

#### Paso 2: Verificar Cálculo de KPIs

```bash
# Llamar API directamente para verificar
curl http://localhost:3000/api/admin/saas/micro-saas/analytics/mailflow-test?period=30d \
  -H "Authorization: Bearer YOUR_TOKEN" | jq
```

✅ **Verificar Response**:
```json
{
  "success": true,
  "analytics": {
    "moduleKey": "mailflow-test",
    "totalSessions": 25,
    "wizard_starts": 25,
    "wizard_completions": 8,
    "conversion_rate": 32,
    "helpful_rate": 20,
    "healthScore": 25,
    "insufficient_data": false,
    "recommendation": {
      "action": "archive",
      "confidence": "medium",
      "reason": "Score bajo (25) después de 25 sesiones..."
    }
  }
}
```

#### Paso 3: Revisar en Dashboard

Navegar a: **Gestión SaaS → 🧠 MVP Analytics**

✅ **Verificar Card**:
- Card muestra "mailflow-test"
- Health Score muy bajo: ~20-30
- Color rojo (danger)
- Badge: "🗄️ Archivar" (badge-danger)
- Sin badge "Low Data" (tiene >20 sesiones)

#### Paso 4: Vista Detallada

Click en card:

✅ **Verificar**:
- Health Score: 25
- Gauge visual: totalmente rojo
- **NO** banner de datos insuficientes (tiene suficientes sesiones)
- **Recomendación**:
  - Acción: "archive"
  - Confianza: "medium"
  - Razón: "Score bajo (25) después de 25 sesiones. No validó el dolor de usuario."
  - Próximos pasos:
    1. Archivar MVP
    2. Analizar feedback negativo
    3. Considerar pivot o nuevo MVP
- **Alertas**:
  - "😞 Feedback Negativo Alto" (warning, high)
  - "⚠️ Baja Conversión" (warning, medium)

#### Paso 5: Archivar MVP

1. Click en botón **"Archivar MVP"**
2. SweetAlert solicita confirmación + motivo (textarea)
3. Escribir motivo: "Performance crítico, feedback muy negativo"
4. Confirmar

✅ **Verificar**:
- Modal success: "✅ MVP Archivado"
- Redirige al dashboard
- Card del MVP ya no aparece (o aparece con tag "Archived")

#### Paso 6: Validar en Base de Datos

```sql
-- Verificar que eventos tienen flag archived
SELECT 
  COUNT(*) as total,
  JSON_EXTRACT(properties, '$.archived') as archived_flag
FROM tracking_events
WHERE module = 'mailflow-test'
GROUP BY archived_flag;

-- Resultado esperado:
-- total: 48, archived_flag: true
```

---

### PRUEBA 4: MVP en Validación (Continuar)

#### Paso 1: Generar Datos Intermedios

```sql
-- Limpiar datos previos
DELETE FROM tracking_events WHERE module = 'product-finder';

-- Insertar 50 sesiones con performance medio
-- 50 starts, 20 completions (40% conversion), 10 downloads, 15 feedbacks (10 helpful: 66%)
```

#### Paso 2: Expectativas

✅ **Métricas Esperadas**:
- Sesiones: 50
- Conversion: 40%
- Helpful: 66%
- Health Score: ~45-55
- Recomendación: "continue"
- Badge: "⏸️ Continuar"

✅ **Alertas Esperadas**:
- "⚠️ Baja Conversión" (solo 40%)
- Posiblemente "Necesita Más Datos" si no cumple mínimos

#### Paso 3: Revisar en Dashboard y Detalle

Similar a pruebas anteriores, validar que:
- Score medio (amarillo)
- Recomendación de continuar con próximos pasos específicos
- Botón "Continuar Validación" disponible

---

### PRUEBA 5: Métricas Inconsistentes (Tracking Issue)

#### Paso 1: Simular Problema de Tracking

```sql
-- Insertar 100 wizard_starts con solo 5 sesiones únicas (muchos eventos sin session_id)
DELETE FROM tracking_events WHERE module = 'broken-tracking';

INSERT INTO tracking_events (module, event, session_id, properties, timestamp)
VALUES
-- 5 sesiones únicas
('broken-tracking', 'wizard_started', 'session-001', '{"step": 1}', NOW()),
('broken-tracking', 'wizard_started', 'session-002', '{"step": 1}', NOW()),
('broken-tracking', 'wizard_started', 'session-003', '{"step": 1}', NOW()),
('broken-tracking', 'wizard_started', 'session-004', '{"step": 1}', NOW()),
('broken-tracking', 'wizard_started', 'session-005', '{"step": 1}', NOW());

-- 95 eventos sin session_id o con session_id null
INSERT INTO tracking_events (module, event, session_id, properties, timestamp)
SELECT 
  'broken-tracking',
  'wizard_started',
  NULL,
  '{"step": 1}',
  NOW()
FROM (
  SELECT @row := @row + 1 as n FROM information_schema.tables, (SELECT @row := 0) t LIMIT 95
) numbers;
```

#### Paso 2: Revisar Analytics

✅ **Verificar**:
- totalSessions: 5 (correctamente filtra nulls)
- wizard_starts: 100 (cuenta todos los eventos)
- **Alerta**: "⚠️ Métrica Inconsistente"
- Mensaje: "100 wizard starts vs 5 sesiones. Revisar tracking de session_id."
- Metadata `_meta` disponible en response:
  ```json
  "_meta": {
    "total_events": 100,
    "events_with_session_id": 5,
    "events_with_user_id": 0,
    "unique_identifiers": 5
  }
  ```

---

## ✅ Checklist de Validación

### Backend API

- [ ] Endpoint `/admin/saas/micro-saas/analytics` responde correctamente
- [ ] Endpoint `/admin/saas/micro-saas/analytics/:moduleKey` responde
- [ ] Endpoint `/admin/saas/micro-saas/:moduleKey/create-module` funciona
- [ ] Endpoint `/admin/saas/micro-saas/:moduleKey/decision` funciona
- [ ] Filtrado de `session_id` nulos funciona
- [ ] Flag `insufficient_data` se calcula correctamente
- [ ] Health Score se calcula con pesos correctos
- [ ] Penalización por poca data (cap 50) funciona
- [ ] Recomendaciones automáticas son coherentes
- [ ] Alertas se generan según thresholds

### Frontend Dashboard

- [ ] Navegación desde menú funciona (`/saas/mvp-analytics`)
- [ ] Dashboard carga lista de MVPs correctamente
- [ ] Summary cards muestran totales correctos
- [ ] Filtros de período funcionan (7d, 30d, 90d, all)
- [ ] Filtros de score funcionan (alto, medio, bajo)
- [ ] Búsqueda por nombre/key funciona
- [ ] Badge "Low Data" aparece cuando corresponde
- [ ] Cards muestran Health Score con color correcto
- [ ] Cards muestran badge de recomendación correcto
- [ ] Click en card navega a vista detallada

### Frontend Vista Detallada

- [ ] Navegación funciona (`/saas/mvp-analytics/:moduleKey`)
- [ ] Botón "Volver" regresa al dashboard
- [ ] Selector de período funciona
- [ ] Banner de warning aparece con datos insuficientes
- [ ] Health Score gauge se renderiza correctamente
- [ ] Badge de penalización aparece cuando aplica
- [ ] KPIs detallados muestran valores correctos
- [ ] Tasas de conversión con contexto ("N/A (sin X)")
- [ ] Tendencias muestran % cambio con iconos
- [ ] Recomendación se muestra completa con próximos pasos
- [ ] Alertas se listan con colores correctos
- [ ] Feedback stats son precisos

### Acciones del Motor

- [ ] Botón "Crear Módulo" funciona
- [ ] Modal de confirmación aparece
- [ ] Backend crea módulo en tabla `modules`
- [ ] Navegación a Gestión de Módulos funciona
- [ ] Preview config se copia correctamente
- [ ] Botón "Continuar Validación" registra decisión
- [ ] Botón "Archivar MVP" solicita motivo
- [ ] Eventos se marcan como archived
- [ ] Redirección al dashboard después de archivar

### Casos Edge

- [ ] MVP sin datos no rompe la app
- [ ] MVP con 0 sesiones retorna correctamente
- [ ] Eventos sin `session_id` se filtran correctamente
- [ ] Eventos sin `properties` no rompen parsing
- [ ] División por cero no causa NaN en tasas
- [ ] Módulo duplicado muestra error 409
- [ ] Token inválido retorna 401

---

## 🐛 Troubleshooting

### Problema: Rate Limiting en Desarrollo (Error 429)

**Causa**:
El sistema tiene protección contra abuso con rate limiting. En desarrollo local, al hacer pruebas repetidas desde la misma IP, puedes alcanzar el límite.

**Síntomas**:
```
Status 429: Too Many Requests
Error: "Demasiadas generaciones. Intenta en una hora."
```

**Solución**:
Los límites se ajustan automáticamente según `NODE_ENV`:

```javascript
// En videoExpressPreview.routes.js (ya configurado)
// Producción: 10 uploads/hora, 5 generaciones/hora
// Desarrollo: 100 uploads/hora, 50 generaciones/hora

uploadLimiter.max = process.env.NODE_ENV === 'production' ? 10 : 100;
generateLimiter.max = process.env.NODE_ENV === 'production' ? 5 : 50;
```

**Verificar NODE_ENV**:
```bash
# En api/.env debe estar:
NODE_ENV=development

# O ejecutar API con:
NODE_ENV=development npm start
```

**Limpiar rate limit cache temporalmente**:
```bash
# Reiniciar servidor API (limpia caché en memoria)
cd api
npm run dev:restart

# O cambiar IP temporalmente (WiFi → Ethernet)
```

**Para desactivar completamente en desarrollo** (opcional, no recomendado):
```javascript
// Solo si es absolutamente necesario para debugging
const generateLimiter = rateLimit({
    skip: (req) => process.env.NODE_ENV !== 'production',
    // ... resto de config
});
```

---

### Problema: Wizard Completados = 0 (aunque usuarios terminan el flujo)

**Causa**:
No se está emitiendo el evento `wizard_completed` correctamente.

**Síntomas**:
```sql
-- wizard_starts > 0 pero wizard_completions = 0
SELECT 
  SUM(CASE WHEN event LIKE '%wizard_started%' THEN 1 ELSE 0 END) as starts,
  SUM(CASE WHEN event = 'wizard_completed' THEN 1 ELSE 0 END) as completions
FROM tracking_events
WHERE module = 'video-express';

-- Resultado: starts = 50, completions = 0 ❌
```

**Resultado en Admin Panel**:
- Conversión Wizard: 0% ❌
- Health Score: muy bajo o 0
- Recomendación incorrecta

**Solución**:
Cada MVP debe emitir `wizard_completed` según su criterio específico. Ver [Event Contract](./MVP-EVENT-CONTRACT.md).

Para **Video Express**:
```typescript
// Cuando el video se genera exitosamente
this.trackEvent('video_express_video_generated', { jobId });

// ✅ Inmediatamente después, emitir completion
this.trackEvent('wizard_completed', {
  step: 4,
  completed: true,
  module: 'video-express',
  jobId: this.state.jobId
});
```

**Verificar evento en DB**:
```sql
-- Debe aparecer wizard_completed
SELECT event, COUNT(*) 
FROM tracking_events 
WHERE module = 'video-express' 
  AND event = 'wizard_completed';
```

**Troubleshooting adicional**:
```typescript
// En consola navegador (modo desarrollo) debe aparecer:
// 📊 [Tracking] wizard_completed { step: 4, completed: true, ... }

// Si no aparece, verificar que TrackingService se inyectó correctamente
```

---

### Problema: Descargas infladas (cuenta generated + download)

**Causa**:
El motor contaba tanto `video_generated` como `video_downloaded`, duplicando el conteo.

**Síntomas**:
```sql
-- Eventos:
-- video_generated: 50
-- video_downloaded: 30
-- Total contado: 80 ❌ (debería ser 30)
```

**Solución aplicada**:
En `microSaasAnalytics.controller.js`, se separó claramente:

```javascript
// ❌ ANTES (incorrecto)
const downloads = events.filter(e => 
  e.event.includes('download') || e.event.includes('generated')
).length;

// ✅ DESPUÉS (correcto)
const downloads = events.filter(e => 
  e.event.includes('download') && !e.event.includes('generated')
).length;
```

**Semántica Clara**:
- 🎬 `video_generated` → Evento informativo (no cuenta como descarga)
- 📥 `video_downloaded` → Descarga real (cuenta para KPI)

**Verificar en Admin Panel**:
- Descargas debe ser ≤ Wizard Completados
- Download Rate = (downloads / completions) * 100 debe ser lógico (0-100%)

---

### Problema: Dashboard vacío / No aparecen MVPs

**Causas posibles**:
1. No hay eventos en `tracking_events` con campo `module`
2. Período seleccionado no tiene datos
3. Error en API backend

**Solución**:
```sql
-- Verificar eventos
SELECT DISTINCT module FROM tracking_events WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Insertar evento de prueba
INSERT INTO tracking_events (module, event, session_id, properties, timestamp)
VALUES ('test-mvp', 'wizard_started', 'test-session', '{"step": 1}', NOW());
```

```bash
# Verificar logs del backend
tail -f api/logs/app.log

# Verificar response de API
curl http://localhost:3000/api/admin/saas/micro-saas/analytics?period=30d \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Problema: Health Score siempre 0

**Causas posibles**:
1. Todas las métricas son 0
2. No hay eventos de completions/downloads/feedback
3. Pesos `SCORE_WEIGHTS` incorrectos

**Solución**:
```javascript
// Verificar pesos en microSaasAnalytics.controller.js
const SCORE_WEIGHTS = {
  conversion_rate: 0.25,
  helpful_rate: 0.35,
  download_rate: 0.20,
  volume_score: 0.10,
  retention_score: 0.10
};

// Total debe sumar 1.00
```

Insertar datos balanceados:
```sql
-- Ejemplo: 10 starts, 8 completions, 5 downloads, 6 feedbacks (5 helpful)
-- Esto da: conversion 80%, download 62%, helpful 83% → Score ~60-70
```

---

### Problema: Badge "Low Data" no aparece cuando debería

**Causas posibles**:
1. MVP tiene más de 5 sesiones (threshold mínimo)
2. Flag `insufficient_data` no se calcula correctamente

**Solución**:
```javascript
// Verificar en microSaasAnalytics.controller.js línea ~520
const insufficient_data = (
  uniqueSessions < 5 || 
  wizardStarts < 3 || 
  feedbackEvents.length < 3
);
```

Verificar en response API:
```bash
curl http://localhost:3000/api/admin/saas/micro-saas/analytics/video-express | jq '.analytics.insufficient_data'
```

---

### Problema: Tasas muestran "0%" en lugar de "N/A"

**Causas posibles**:
1. Método `formatRate()` no se está usando en el template
2. Lógica de formateo no cubre todos los casos

**Solución**:
Verificar que en `mvp-decision-engine.component.html` se usa:
```html
<div class="rate-value">{{ formatRate(analytics.conversion_rate, 'conversion') }}</div>
```

Y no:
```html
<div class="rate-value">{{ analytics.conversion_rate }}%</div>
```

---

### Problema: Error al crear módulo (409 Conflict)

**Causa**:
Ya existe un módulo con ese `key` en la tabla `modules`.

**Solución**:
```sql
-- Verificar módulo existente
SELECT * FROM modules WHERE key = 'video-express';

-- Eliminar si es de prueba
DELETE FROM modules WHERE key = 'video-express';
```

---

### Problema: Navegación no funciona al click en card

**Causa**:
Rutas de Angular no configuradas correctamente.

**Solución**:
Verificar en `saas-management-routing.module.ts`:
```typescript
{
  path: 'mvp-analytics',
  component: MvpAnalyticsComponent
},
{
  path: 'mvp-analytics/:moduleKey',
  component: MvpDecisionEngineComponent
}
```

Verificar que la navegación usa la ruta correcta:
```typescript
// En mvp-analytics.component.ts
viewDetails(moduleKey: string): void {
  this.router.navigate(['/saas/mvp-analytics', moduleKey]); // ✅ Correcto
}
```

---

## 📊 Scripts de Seed Útiles

### Script SQL: Seed MVP con Datos Completos

```sql
-- Crear stored procedure para seed
DELIMITER $$

CREATE PROCEDURE seed_mvp_tracking(
  IN p_module VARCHAR(100),
  IN p_sessions INT,
  IN p_conversion_rate DECIMAL(3,2),
  IN p_helpful_rate DECIMAL(3,2)
)
BEGIN
  DECLARE i INT DEFAULT 1;
  DECLARE completions INT;
  DECLARE helpful_count INT;
  
  SET completions = FLOOR(p_sessions * p_conversion_rate);
  SET helpful_count = FLOOR(completions * p_helpful_rate);
  
  -- Wizard starts
  WHILE i <= p_sessions DO
    INSERT INTO tracking_events (module, event, session_id, properties, timestamp)
    VALUES (
      p_module,
      'wizard_started',
      CONCAT('session-', LPAD(i, 5, '0')),
      '{"step": 1}',
      DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 30) DAY)
    );
    SET i = i + 1;
  END WHILE;
  
  -- Wizard completions
  SET i = 1;
  WHILE i <= completions DO
    INSERT INTO tracking_events (module, event, session_id, properties, timestamp)
    VALUES (
      p_module,
      'wizard_completed',
      CONCAT('session-', LPAD(i, 5, '0')),
      '{"step": 4, "completed": true}',
      DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 30) DAY)
    );
    SET i = i + 1;
  END WHILE;
  
  -- Downloads (80% de completions)
  SET i = 1;
  WHILE i <= FLOOR(completions * 0.8) DO
    INSERT INTO tracking_events (module, event, session_id, properties, timestamp)
    VALUES (
      p_module,
      'download',
      CONCAT('session-', LPAD(i, 5, '0')),
      '{}',
      DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 30) DAY)
    );
    SET i = i + 1;
  END WHILE;
  
  -- Feedback helpful
  SET i = 1;
  WHILE i <= helpful_count DO
    INSERT INTO tracking_events (module, event, session_id, properties, timestamp)
    VALUES (
      p_module,
      'feedback',
      CONCAT('session-', LPAD(i, 5, '0')),
      '{"helpful": true}',
      DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 30) DAY)
    );
    SET i = i + 1;
  END WHILE;
  
  -- Feedback no helpful
  SET i = helpful_count + 1;
  WHILE i <= completions DO
    INSERT INTO tracking_events (module, event, session_id, properties, timestamp)
    VALUES (
      p_module,
      'feedback',
      CONCAT('session-', LPAD(i, 5, '0')),
      '{"helpful": false}',
      DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 30) DAY)
    );
    SET i = i + 1;
  END WHILE;
  
END$$

DELIMITER ;

-- Usar el procedure
-- MVP con buen performance
CALL seed_mvp_tracking('video-express', 100, 0.85, 0.90);

-- MVP con performance medio
CALL seed_mvp_tracking('mailflow', 50, 0.50, 0.70);

-- MVP con bajo performance
CALL seed_mvp_tracking('product-finder', 30, 0.30, 0.40);

-- MVP con datos insuficientes
CALL seed_mvp_tracking('test-low-data', 3, 0.66, 0.50);
```

---

## 🎯 Casos de Uso Reales

### Video Express (MVP Exitoso)

**Expectativa**:
- 100+ sesiones
- Conversion rate: 80-85%
- Helpful rate: 85-90%
- Health Score: 75-85
- Recomendación: "Crear Módulo"

**Validación**:
- ✅ Badge verde "🚀 Crear Módulo"
- ✅ Alerta "🎉 MVP Validado"
- ✅ Botón "Crear Módulo Oficial" habilitado
- ✅ Al crear: módulo aparece en Gestión de Módulos

---

### MailFlow (MVP en Validación)

**Expectativa**:
- 40-60 sesiones
- Conversion rate: 50-60%
- Helpful rate: 65-75%
- Health Score: 50-60
- Recomendación: "Continuar"

**Validación**:
- ✅ Badge amarillo "⏸️ Continuar"
- ✅ Alertas específicas de mejora
- ✅ Próximos pasos claros
- ✅ Botón "Continuar Validación" disponible

---

## 📈 Métricas de Éxito del Sistema

Para considerar el Motor de Decisiones como funcional, validar:

- [ ] **100% de MVPs se calculan correctamente** (sin errores 500)
- [ ] **Flags de datos insuficientes son precisos** (< 5 sesiones)
- [ ] **Health Scores son coherentes** (correlación con métricas)
- [ ] **Recomendaciones automáticas son útiles** (admin puede confiar en ellas)
- [ ] **Alertas son accionables** (no genéricas)
- [ ] **Creación de módulos funciona** (sin duplicados, con preview_config)
- [ ] **Archivo de MVPs funciona** (eventos marcados, MVP desaparece)
- [ ] **Performance es aceptable** (< 2s para cargar dashboard)

---

## 📝 Notas Finales

### Ajustar Thresholds en Producción

Después de probar con datos reales, ajustar en `microSaasAnalytics.controller.js`:

```javascript
const DECISION_THRESHOLDS = {
  min_sessions_to_analyze: 10,        // Ajustar según volumen esperado
  create_module_score: 70,             // Ajustar según criterio de negocio
  create_module_downloads: 50,         // Ajustar según objetivos
  create_module_feedback_rate: 80,     // Ajustar según feedback real
  archive_score: 40,                   // Ajustar con cuidado
  archive_min_sessions: 20             // Mínimo antes de archivar
};

const SCORE_WEIGHTS = {
  conversion_rate: 0.25,    // Ajustar importancia relativa
  helpful_rate: 0.35,       // Peso más alto = más importante
  download_rate: 0.20,
  volume_score: 0.10,
  retention_score: 0.10
};
```

### Logs y Debugging

Activar logs en backend para debugging:

```javascript
// En calculateModuleAnalytics()
console.log(`📊 Analytics for ${moduleKey}:`, {
  events: events.length,
  sessions: kpis.totalSessions,
  score: healthScore,
  recommendation: recommendation.action,
  insufficient_data: kpis.insufficient_data
});
```

Ver logs en tiempo real:
```bash
tail -f api/logs/app.log | grep "📊"
```

---

## 🙌 Conclusión

Este documento cubre todos los escenarios de prueba para validar el Motor de Decisiones MVP Analytics. Siguiendo estos pasos, podrás:

1. ✅ Probar diferentes escenarios (baja data, suficiente data, inconsistencias)
2. ✅ Validar que el motor toma decisiones inteligentes
3. ✅ Asegurar que la visualización es clara y útil
4. ✅ Confirmar que las acciones automáticas funcionan correctamente
5. ✅ Identificar problemas de tracking antes de producción

**Próximos Pasos**:
1. Ejecutar todas las pruebas en local
2. Ajustar thresholds según resultados
3. Validar con datos de producción (staging)
4. Desplegar a producción con confianza

¡Suerte con las pruebas! 🚀

---

**Autor**: Claude (GitHub Copilot)  
**Versión**: 1.0  
**Fecha**: 9 de febrero de 2026  
**Contacto**: Para reportar issues o sugerencias de mejora del motor de decisiones
