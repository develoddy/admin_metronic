# 🚀 CÓMO PROBAR EL MÓDULO VIDEO EXPRESS

## ✅ Pre-requisitos

- ✅ Backend corriendo en `localhost:3500`
- ✅ Admin Panel compilando sin errores
- ✅ Sesión iniciada como admin

## 🎯 Flujo de Prueba Completo (5 minutos)

### 1️⃣ **Iniciar el Admin Panel**

```bash
cd admin/
npm start
```

Espera a que compile y abre: `http://localhost:4200`

### 2️⃣ **Navegar al módulo**

En el sidebar izquierdo, busca:
```
📂 Proveedores
  └── 🎥 Product Video Express
      ├── Dashboard
      ├── Crear Video
      └── Mis Jobs
```

### 3️⃣ **Dashboard - Primera vista**

Verifica que se muestra:
- ✅ 4 tarjetas de estadísticas (Total, Completados, En Proceso, Fallidos)
- ✅ Sección "Videos Recientes" (vacía si es primera vez)
- ✅ Botón "Crear Video" en la parte superior

### 4️⃣ **Crear tu primer video**

1. Click en **"Crear Video"**
2. Click en el área de upload o arrastra una imagen
   - Formatos válidos: JPG, PNG
   - Tamaño máximo: 10MB
3. Verás el **preview** de tu imagen
4. Selecciona un **estilo de animación**:
   - Zoom In (recomendado para productos)
   - Parallax 3D
   - Subtle Float
5. Click en **"Generar Video"**
6. Espera el mensaje de éxito (2 segundos)
7. Automáticamente te redirige a **"Mis Jobs"**

### 5️⃣ **Monitorear el progreso**

En **"Mis Jobs"**:
- ✅ Verás tu job con estado **"Procesando"** (badge amarillo)
- ✅ Progress bar animado debajo del estado
- ✅ Indicador de auto-actualización cada 10 seg
- ✅ Espera 1-2 minutos...
- ✅ El estado cambiará a **"Completado"** (badge verde)

### 6️⃣ **Descargar el video**

Cuando el job esté completado:
1. Verás un botón verde con ícono de **descarga** 📥
2. Click en el botón
3. Se abre nueva pestaña con el video MP4
4. Click derecho → "Guardar como" para descargar

### 7️⃣ **Probar otras funciones**

- **Ver detalles**: Click en el ícono 👁️ (abre modal con info completa)
- **Eliminar job**: Click en el ícono 🗑️ (pide confirmación)
- **Filtrar por estado**: Usa los botones "Todos", "Procesando", "Completados", "Fallidos"
- **Volver al dashboard**: Click en "Product Video Express" → "Dashboard"

## 🎨 Capturas de Pantalla Esperadas

### Dashboard
```
┌─────────────────────────────────────────────────┐
│ 🎥 Product Video Express      [Crear Video]    │
├─────────────────────────────────────────────────┤
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐       │
│  │  0   │  │  0   │  │  0   │  │  0   │       │
│  │Total │  │Complt│  │Proces│  │Fallos│       │
│  └──────┘  └──────┘  └──────┘  └──────┘       │
│                                                 │
│  Videos Recientes                               │
│  ┌─────────────────────────────────────────┐   │
│  │ Aún no has creado videos                │   │
│  │     [Crear tu Primer Video]             │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### Crear Video
```
┌─────────────────────────────────────────────────┐
│ ← 🎬 Crear Nuevo Video                          │
├─────────────────────────────────────────────────┤
│  1. Imagen del Producto    │ 2. Estilo         │
│  ┌────────────────────┐    │  ☑ Zoom In        │
│  │                    │    │  ☐ Parallax 3D    │
│  │   DROP IMAGE       │    │  ☐ Subtle Float   │
│  │       HERE         │    │                   │
│  └────────────────────┘    │  ⏱ Tiempo: 1-2min│
├─────────────────────────────────────────────────┤
│  [Cancelar]            [Generar Video]          │
└─────────────────────────────────────────────────┘
```

### Mis Jobs
```
┌─────────────────────────────────────────────────┐
│ 📹 Mis Video Jobs               [Crear Video]   │
├─────────────────────────────────────────────────┤
│ Filtrar: [Todos] [Procesando] [Completados] [X]│
├───┬────────┬──────────┬─────────┬───────┬───────┤
│Img│ Job ID │ Estilo   │ Estado  │Creado │Acción│
├───┼────────┼──────────┼─────────┼───────┼───────┤
│🖼 │ 12ab...│Zoom In   │●Process │10:30  │ 👁 🗑│
│🖼 │ 34cd...│Parallax  │✓Complete│10:25  │👁📥🗑│
└───┴────────┴──────────┴─────────┴───────┴───────┘
```

## 🐛 Solución de Problemas

### ❌ "No aparece el módulo en el sidebar"
```bash
# Solución: Recargar la aplicación
Ctrl + C (detener servidor)
npm start
```

### ❌ "Error 401 Unauthorized"
```bash
# Solución: Volver a iniciar sesión
Logout → Login con: admin@admin.com / secret
```

### ❌ "Error al cargar jobs"
```bash
# Verificar que el backend esté corriendo
cd api/
npm run dev

# Debe mostrar: "Server running on port 3500"
```

### ❌ "La imagen no se sube"
- Verifica formato: Solo JPG o PNG
- Verifica tamaño: Máximo 10MB
- Prueba con otra imagen

### ❌ "El video nunca completa"
- Revisa logs del backend: `api/logs/`
- Verifica la API key de fal.ai en `.env.development`
- Espera hasta 5 minutos (timeout del backend)

## 📊 Endpoints que se están llamando

Durante el flujo, el frontend llama a:

```
GET  /api/video-express/stats          → Dashboard (cada 10s)
GET  /api/video-express/jobs           → Jobs list
POST /api/video-express/jobs           → Crear job (con FormData)
GET  /api/video-express/jobs/:id       → Detalles (modal)
GET  /api/video-express/download/:id   → Descargar video
DELETE /api/video-express/jobs/:id     → Eliminar job
```

Puedes monitorear las llamadas en:
- Chrome DevTools → Network tab (F12)
- Backend logs: `console.log` en `videoExpress.controller.js`

## 🎉 Resultado Esperado

Después de 5 minutos de prueba, deberías tener:
- ✅ Al menos 1 video job creado
- ✅ Dashboard mostrando estadísticas actualizadas
- ✅ Video MP4 descargado en tu computadora
- ✅ Experiencia fluida sin errores

## 📞 ¿Necesitas Ayuda?

Si algo no funciona:
1. Abre la consola del navegador (F12 → Console)
2. Busca errores en rojo
3. Revisa los logs del backend
4. Consulta el README del módulo: `admin/src/app/modules/video-express/README.md`

---

**¡Listo para probar!** 🚀
