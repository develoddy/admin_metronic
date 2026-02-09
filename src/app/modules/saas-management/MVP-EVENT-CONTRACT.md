# 📋 MVP Event Contract - Contrato de Eventos por Módulo

**Versión**: 1.0  
**Fecha**: 9 de febrero de 2026  
**Autor**: Claude (GitHub Copilot)

---

## 🎯 Objetivo

Este documento define el **contrato de eventos** que cada MVP debe emitir para que el Motor de Decisiones analítico funcione correctamente.

---

## 📐 Principios Generales

### 1. **Definición de "Wizard Completado"**

Cada MVP debe definir **explícitamente** qué significa "completar el wizard":

- ✅ **Generadores** (Video Express, Image Tools): Asset generado con éxito
- ✅ **Configuradores** (MailFlow, Settings): Configuración guardada exitosamente  
- ✅ **Wizards Multi-Paso**: Último paso obligatorio completado

### 2. **Separación Clara de Eventos**

- **Eventos de progression** (wizard_started, wizard_completed) → Miden conversión
- **Eventos de engagement** (download, feedback) → Miden satisfacción
- **Eventos informativos** (image_uploaded, settings_changed) → Contexto adicional

### 3. **Nomenclatura Consistente**

```
{module}_{entity}_{action}
Ejemplos:
- video_express_image_uploaded
- mailflow_campaign_created
- product_finder_result_generated
```

---

## 📊 Video Express - Event Contract

### ✅ Eventos Requeridos (Core KPIs)

| # | Evento | Cuándo | Properties | Impacto |
|---|--------|--------|------------|---------|
| 1 | `wizard_started` | Usuario inicia wizard (paso 1) | `{ step: 1, module: 'video-express' }` | +1 wizard_starts |
| 2 | `wizard_completed` | ✅ Video generado exitosamente | `{ step: 4, completed: true, objective, jobId }` | +1 wizard_completions |
| 3 | `video_express_video_downloaded` | Usuario descarga MP4 | `{ jobId }` | +1 downloads |
| 4 | `feedback` | Usuario da feedback | `{ helpful: true/false, jobId }` | +1 feedback ± helpful |

### 📌 Eventos Informativos (No afectan KPIs)

| Evento | Cuándo | Properties |
|--------|--------|------------|
| `video_express_image_uploaded` | Imagen subida | `{ imageId, size }` |
| `video_express_objective_selected` | Selecciona organic/ads | `{ objective }` |
| `video_express_animation_selected` | Selecciona estilo | `{ animation }` |
| `video_express_video_generated` | Video completado (backend) | `{ jobId, duration }` |

### 🔑 Criterios Críticos

**✅ Wizard Completado = Video Generado con Éxito**

```typescript
// Cuando el video se genera exitosamente:
trackingService.track('video_express_video_generated', { jobId, objective });
trackingService.track('wizard_completed', { 
  step: 4, 
  completed: true, 
  module: 'video-express',
  jobId 
});
```

**📥 Descarga ≠ Generación**

```javascript
// ❌ INCORRECTO: video_generated NO debe contar como descarga
downloads = events.filter(e => e.includes('download') || e.includes('generated'));

// ✅ CORRECTO: Solo eventos explícitos de descarga
downloads = events.filter(e => e.includes('download') && !e.includes('generated'));
```

### 📈 Métricas Calculadas

```javascript
// Conversión del Wizard
conversion_rate = (wizard_completions / wizard_starts) * 100

// Tasa de Descarga (post-generation)
download_rate = (downloads / wizard_completions) * 100

// Feedback Positivo
helpful_rate = (helpful_feedback / total_feedback) * 100
```

---

## 🧩 MailFlow - Event Contract (Template)

### ✅ Eventos Requeridos

| # | Evento | Cuándo | Properties | Impacto |
|---|--------|--------|------------|---------|
| 1 | `wizard_started` | Usuario inicia configuración | `{ step: 1, module: 'mailflow' }` | +1 wizard_starts |
| 2 | `wizard_completed` | ✅ Campaña guardada | `{ step: 4, completed: true, campaignId }` | +1 wizard_completions |
| 3 | `mailflow_campaign_downloaded` | Exporta configuración | `{ campaignId, format }` | +1 downloads |
| 4 | `feedback` | Usuario da feedback | `{ helpful: true/false }` | +1 feedback |

### 🔑 Criterio de Completado

**✅ Wizard Completado = Campaña guardada con nombre y contenido válido**

---

## 🛠️ Template General para Nuevos MVPs

### Checklist de Implementación

```typescript
// 1️⃣ Definir criterio de "completado" específico del MVP
const COMPLETION_CRITERIA = {
  'video-express': 'Video generado',
  'mailflow': 'Campaña guardada',
  'product-finder': 'Resultados generados y mostrados'
};

// 2️⃣ Implementar eventos mínimos

// INICIO
track('wizard_started', { 
  step: 1, 
  module: MODULE_KEY 
});

// PROGRESSION (opcional)
track('wizard_step_completed', { 
  step: 2, 
  module: MODULE_KEY 
});

// COMPLETION ⚠️ CRÍTICO
track('wizard_completed', { 
  step: FINAL_STEP,
  completed: true,
  module: MODULE_KEY,
  // ... datos específicos del MVP
});

// ENGAGEMENT
track('download', { 
  module: MODULE_KEY 
});

track('feedback', { 
  helpful: true/false,
  module: MODULE_KEY 
});
```

### 3️⃣ Validar con Motor de Decisiones

```bash
# Después de implementar eventos, verificar en Admin Panel:
# 1. Wizard Iniciados > 0
# 2. Wizard Completados > 0
# 3. Conversión > 0%
# 4. Health Score > 0
```

---

## 🚨 Errores Comunes a Evitar

### ❌ Error 1: No emitir `wizard_completed`

```typescript
// ❌ MAL: Solo evento informativo
track('video_generated', { jobId });
// Resultado: Conversión = 0%, Score = 0

// ✅ BIEN: Evento + completion
track('video_generated', { jobId });
track('wizard_completed', { step: 4, completed: true, jobId });
// Resultado: Conversión correcta, Score calculado
```

### ❌ Error 2: Contar "generated" como "download"

```javascript
// ❌ MAL: Infla descargas
const downloads = events.filter(e => 
  e.event.includes('download') || e.event.includes('generated')
);

// ✅ BIEN: Solo descargas explícitas
const downloads = events.filter(e => 
  e.event.includes('download') && !e.event.includes('generated')
);
```

### ❌ Error 3: Properties sin `module`

```typescript
// ❌ MAL: No se puede filtrar por MVP
track('wizard_started', { step: 1 });

// ✅ BIEN: Incluir module key
track('wizard_started', { 
  step: 1, 
  module: 'video-express' 
});
```

### ❌ Error 4: Session ID inconsistente

```typescript
// ❌ MAL: Session ID cambia en cada evento
trackingService.track('event1', { sessionId: uuid() });
trackingService.track('event2', { sessionId: uuid() }); // Diferente!

// ✅ BIEN: Session ID persistente
const sessionId = sessionStorage.getItem('session_id') || uuid();
trackingService.track('event1', { sessionId });
trackingService.track('event2', { sessionId }); // Mismo ID
```

---

## 🧪 Testing del Contrato

### Script de Validación

```sql
-- 1. Verificar eventos por MVP
SELECT 
  module,
  event,
  COUNT(*) as total,
  COUNT(DISTINCT session_id) as unique_sessions
FROM tracking_events
WHERE module = 'video-express'
  AND timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY module, event
ORDER BY total DESC;

-- 2. Verificar conversión
SELECT 
  module,
  SUM(CASE WHEN event LIKE '%wizard_started%' THEN 1 ELSE 0 END) as starts,
  SUM(CASE WHEN event = 'wizard_completed' THEN 1 ELSE 0 END) as completions,
  ROUND(
    (SUM(CASE WHEN event = 'wizard_completed' THEN 1 ELSE 0 END) * 100.0) / 
    NULLIF(SUM(CASE WHEN event LIKE '%wizard_started%' THEN 1 ELSE 0 END), 0),
    2
  ) as conversion_rate_pct
FROM tracking_events
WHERE module = 'video-express'
  AND timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY module;

-- 3. Verificar descargas separadas de generated
SELECT 
  event,
  COUNT(*) as total
FROM tracking_events
WHERE module = 'video-express'
  AND (event LIKE '%download%' OR event LIKE '%generated%')
  AND timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY event;
```

### Resultado Esperado

```
module          event                starts completions conversion
video-express   wizard_started       100    85          85.00%
                wizard_completed     85     -           -
                download             60     -           -
                feedback             50     -           -
```

---

## 📚 Referencias Técnicas

### Tracking Service (Frontend)

```typescript
// app-saas/src/app/services/tracking.service.ts
track(event: string, properties: any): void {
  const trackingEvent = {
    event,
    properties,
    timestamp: new Date().toISOString(),
    sessionId: this.sessionId,  // Persistente
    userId: this.userId || null,
    module: properties.module || null
  };
  
  this.http.post('/api/tracking', trackingEvent).subscribe();
}
```

### Motor de Decisiones (Backend)

```javascript
// api/src/controllers/microSaasAnalytics.controller.js
function calculateKPIs(events, moduleKey) {
  const wizardStarts = events.filter(e => 
    e.event.includes('wizard_started') || e.event.includes('preview_started')
  ).length;
  
  const wizardCompletions = events.filter(e => {
    const props = JSON.parse(e.properties || '{}');
    return e.event.includes('completed') && 
           (props.step === 4 || props.completed === true);
  }).length;
  
  const downloads = events.filter(e => 
    e.event.includes('download') && !e.event.includes('generated')
  ).length;
  
  const conversion_rate = wizardStarts > 0 
    ? Math.round((wizardCompletions / wizardStarts) * 100) 
    : 0;
  
  return { wizardStarts, wizardCompletions, downloads, conversion_rate };
}
```

---

## ✅ Checklist de Nuevo MVP

Antes de lanzar un MVP nuevo, verificar:

- [ ] Definido criterio de "wizard completado"
- [ ] Implementado evento `wizard_started`
- [ ] Implementado evento `wizard_completed` con `completed: true`
- [ ] Separados eventos de engagement (download, feedback)
- [ ] Todos los eventos incluyen `module` key
- [ ] Session ID persistente durante toda la sesión
- [ ] Testeado con script SQL de validación
- [ ] Verificado en Admin Panel: conversión > 0%
- [ ] Health Score calculado correctamente
- [ ] Documentado en este archivo

---

## 🔄 Changelog

### v1.0 - 9 feb 2026
- ✅ Documentado contrato de Video Express
- ✅ Separación clara: generated ≠ download
- ✅ Template general para nuevos MVPs
- ✅ Scripts de testing SQL
- ✅ Errores comunes documentados

---

**Próxima Actualización**: MailFlow Event Contract (próximo MVP a instrumentar)

**Autor**: Claude (GitHub Copilot)  
**Revisado por**: LujanDev (validado en pruebas reales con Video Express)
