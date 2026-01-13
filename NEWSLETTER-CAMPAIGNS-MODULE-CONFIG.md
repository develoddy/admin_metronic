# 📧 Configuración Newsletter Campaigns Module

## Valores correctos para crear el módulo en Admin Panel

### 📋 Información Básica

```
Key (ID único): newsletter-campaigns
Nombre: Newsletter Campaigns
Descripción: Plataforma para crear, gestionar y analizar campañas de email marketing profesionales
Tagline: Automatiza tus campañas de email marketing
Descripción Detallada: 
Herramienta completa de email marketing que te permite crear campañas profesionales,
gestionar suscriptores, segmentar audiencias, realizar pruebas A/B y analizar resultados
en tiempo real. Ideal para negocios que buscan escalar su estrategia de email marketing.

Tipo: SaaS (Subscripción)
Estado: live
Icono: fa-envelope (o fa-paper-plane)
Color: primary
Precio Base: 0 € (usa planes)
```

### 🚀 Configuración SaaS (Subscripción)

```
Modo SaaS: ✓ Activado
Días de Trial: 14
Ruta Dashboard: newsletter-campaigns
(El sistema automáticamente redirige a: https://app.lujandev.com/newsletter-campaigns)

API Endpoint: newsletter-campaigns
(Opcional - Para documentación interna)
```

### � Contenido de Marketing

#### Tagline
```
Automatiza tus campañas de email marketing y aumenta tus conversiones
```
*Frase corta y atractiva (máx. 255 caracteres)*

#### Descripción Detallada (HTML)
```html
<div class="newsletter-description">
  <h3>🚀 Lleva tu Email Marketing al Siguiente Nivel</h3>
  <p>
    <strong>Newsletter Campaigns</strong> es la plataforma todo-en-uno que necesitas para 
    crear, gestionar y optimizar tus campañas de email marketing de forma profesional.
  </p>
  
  <h4>✨ ¿Qué incluye?</h4>
  <ul>
    <li><strong>Editor Visual Drag & Drop:</strong> Crea emails hermosos sin código</li>
    <li><strong>Gestión de Suscriptores:</strong> Importa, segmenta y organiza tus contactos</li>
    <li><strong>A/B Testing:</strong> Optimiza tus campañas con pruebas automáticas</li>
    <li><strong>Automatizaciones:</strong> Secuencias de emails basadas en comportamiento</li>
    <li><strong>Analytics en Tiempo Real:</strong> Métricas detalladas de open rate, CTR y conversiones</li>
    <li><strong>Plantillas Premium:</strong> Biblioteca de diseños profesionales listos para usar</li>
  </ul>
  
  <h4>💡 Perfecto para:</h4>
  <p>
    Emprendedores, startups, ecommerce, SaaS, coaches, consultores y cualquier negocio 
    que quiera escalar su comunicación con clientes a través de email marketing efectivo.
  </p>
  
  <h4>🎯 Resultados Medibles</h4>
  <p>
    Monitorea cada aspecto de tus campañas: tasas de apertura, clicks, conversiones, 
    ingresos generados y ROI. Toma decisiones basadas en datos reales.
  </p>
</div>
```
*Descripción larga para la landing page (soporta HTML)*

#### Screenshots
```
Recomendación: Subir al menos 4 imágenes de:
1. Dashboard principal con métricas
2. Editor de campañas (drag & drop)
3. Lista de suscriptores y segmentación
4. Vista de analytics/reportes
5. Panel de automatizaciones

Formatos: JPG, PNG, GIF, WebP
Tamaño máximo: 5MB por imagen
Máximo: 10 imágenes

URLs de ejemplo (reemplazar con screenshots reales):
- https://i.imgur.com/dashboard-newsletter.png
- https://i.imgur.com/editor-email.png
- https://i.imgur.com/subscribers-list.png
- https://i.imgur.com/analytics-reports.png
```

#### Características
```
✅ Editor visual drag & drop sin código
✅ Gestión completa de suscriptores
✅ Segmentación avanzada de audiencias
✅ A/B Testing automático
✅ Automatizaciones de email
✅ Plantillas profesionales responsive
✅ Analytics en tiempo real
✅ Integración con webhooks
✅ API REST completa
✅ Personalización dinámica
✅ Pruebas de spam score
✅ Programación de envíos
```
*Lista de beneficios o características clave (una por línea)*

#### Stack Tecnológico
```
Angular 16, Node.js 18, Express, MySQL, Sequelize, JWT, Nodemailer, SendGrid API, Chart.js, TailwindCSS
```
*Tecnologías usadas en el proyecto (separadas por comas)*

### 📊 Validación Levels-style

**Filosofía Levels:** Cada idea debe validarse rápidamente. Define X ventas en Y días. Si no alcanza el target → KILL y siguiente experimento.

```
Días para validar: 14
Ventas objetivo: 5

Target del módulo: 5 ventas en 14 días
```

*Si después de 14 días no se alcanzan 5 ventas, considerar pivotar o archivar el módulo*

### �💰 Planes de Pricing

#### Plan 1: Starter
```
Nombre: Starter
Precio: 9.99 €
Descripción: Hasta 1,000 suscriptores, 5,000 emails/mes, plantillas básicas
Destacar: No
```

#### Plan 2: Professional ⭐
```
Nombre: Professional
Precio: 29.99 €
Descripción: Hasta 10,000 suscriptores, 50,000 emails/mes, plantillas premium, A/B testing
Destacar: ✓ Recomendado (se mostrará con borde azul)
```

#### Plan 3: Business
```
Nombre: Business
Precio: 79.99 €
Descripción: Suscriptores ilimitados, emails ilimitados, automatizaciones avanzadas, soporte prioritario
Destacar: No
```

### 📊 Validación Levels-style

```
Días de Validación: 14
Target de Ventas: 5
```

---

## ✅ Cambios Realizados en el Formulario

### 1. Placeholder Corregido
- **Antes:** `tienda.lujandev.com/app/`
- **Ahora:** `app.lujandev.com/`

### 2. Validaciones Añadidas
- ✓ **Días de Trial**: Campo requerido, mínimo 1 día
- ✓ **Ruta Dashboard**: Campo requerido, solo letras minúsculas, números y guiones

### 3. Comportamiento del Botón "Volver"
- Ahora detecta cambios en la sección de "Configuración SaaS"
- Muestra modal de confirmación con lista de cambios detectados
- Previene pérdida accidental de datos

---

## 🔗 Rutas Importantes

### Frontend (Tienda)
- Landing: `https://tienda.lujandev.com/labs/newsletter-campaigns`
- Registro Trial: `https://tienda.lujandev.com/trial-register?module=newsletter-campaigns`

### Frontend (App SaaS)
- Login: `https://app.lujandev.com/login`
- Dashboard: `https://app.lujandev.com/newsletter-campaigns`

### Backend (API)
- Trial Start: `POST /api/saas/trial/start`
- Login: `POST /api/saas/login`
- Check Access: `GET /api/saas/check-access`
- User Profile: `GET /api/saas/me`
- Subscribe: `POST /api/saas/subscribe`
- Cancel: `POST /api/saas/cancel`

---

## 📝 Notas Importantes

### Sobre el API Endpoint
- **Es opcional**: No afecta la funcionalidad actual
- **Uso futuro**: Para documentación cuando se creen endpoints específicos del módulo
- **Ejemplos de endpoints futuros**:
  - `GET /api/newsletter-campaigns/campaigns`
  - `POST /api/newsletter-campaigns/subscribers`
  - `PUT /api/newsletter-campaigns/campaigns/:id`
  - `GET /api/newsletter-campaigns/analytics`

### Sobre la Ruta Dashboard
- **Solo el path**: Escribe `newsletter-campaigns` (sin dominio)
- **Redirección completa**: El sistema construye `https://app.lujandev.com/newsletter-campaigns`
- **Importante**: Debe coincidir con la ruta definida en [app-routing.module.ts](../app-saas/src/app/app-routing.module.ts)

---

## 🎯 Próximos Pasos Después de Crear el Módulo

1. **Testear el flujo completo**:
   ```
   tienda.lujandev.com/labs/newsletter-campaigns
   → Click "Iniciar Trial Gratis"
   → Completar formulario
   → Redirige a app.lujandev.com/newsletter-campaigns
   → Login
   → Ver dashboard
   ```

2. **Verificar en base de datos**:
   ```sql
   SELECT * FROM modules WHERE module_key = 'newsletter-campaigns';
   SELECT * FROM tenants WHERE module_key = 'newsletter-campaigns';
   ```

3. **Monitorear logs**:
   ```bash
   # Backend API
   ssh -i ~/.ssh/id_rsa_do root@64.226.123.91 "tail -f /var/www/api_sequelize/logs/api.log"
   
   # Nginx
   ssh -i ~/.ssh/id_rsa_do root@64.226.123.91 "tail -f /var/log/nginx/app_saas_access.log"
   ```

---

## 🚨 Troubleshooting

### Error: "Module not found"
- Verificar que `module_key` en DB sea `newsletter-campaigns`
- Revisar campo `saas_dashboard_route` en tabla `modules`

### Error: "Invalid credentials"
- Verificar que el email/contraseña coincidan
- Comprobar que `module_key` sea correcto en la petición

### Error: "Trial expired"
- Verificar campo `trial_ends_at` en tabla `tenants`
- Extender trial: `UPDATE tenants SET trial_ends_at = DATE_ADD(NOW(), INTERVAL 14 DAY) WHERE email = '...'`

---

Creado: 12 de enero de 2026
Última actualización: 12 de enero de 2026
