# 🎥 Product Video Express - Frontend Angular

**Módulo del Admin Panel para el micro-SaaS de generación de videos con IA**

## 📁 Estructura del Módulo

```
admin/src/app/modules/video-express/
├── _models/
│   └── video-job.model.ts           # Interfaces TypeScript y helpers
├── _services/
│   └── video-express.service.ts     # Servicio HTTP (API client)
├── dashboard/
│   ├── video-express-dashboard.component.ts
│   ├── video-express-dashboard.component.html
│   └── video-express-dashboard.component.scss
├── job-creator/
│   ├── job-creator.component.ts     # Formulario de upload
│   ├── job-creator.component.html
│   └── job-creator.component.scss
├── jobs-list/
│   ├── jobs-list.component.ts       # Tabla de jobs
│   ├── jobs-list.component.html
│   └── jobs-list.component.scss
├── video-express-routing.module.ts
└── video-express.module.ts
```

## 🚀 Características MVP

### 1. **Dashboard** (`/video-express`)
- **Estadísticas en tiempo real**: Total, completados, en proceso, fallidos
- **Videos recientes**: Últimos 5 jobs con preview
- **Auto-actualización**: Polling cada 10 segundos
- **Indicador de tasa de éxito**: Porcentaje de videos completados

### 2. **Crear Video** (`/video-express/create`)
- **Upload de imagen**: Drag & drop o click to upload
- **Validación frontend**:
  - Formatos: JPG, PNG únicamente
  - Tamaño máximo: 10MB
- **Selección de estilo**: 3 opciones de animación
  - Zoom In (acercamiento dramático)
  - Parallax 3D (efecto de profundidad)
  - Subtle Float (flotación minimalista)
- **Preview de imagen**: Vista previa antes de enviar
- **Feedback inmediato**: Mensajes de éxito/error

### 3. **Mis Jobs** (`/video-express/jobs`)
- **Tabla completa**: Todos los jobs del usuario
- **Filtros por estado**: All, Processing, Completed, Failed
- **Auto-refresh**: Solo cuando hay jobs activos
- **Acciones rápidas**:
  - Ver detalles (modal con SweetAlert2)
  - Descargar video (solo completados)
  - Eliminar job
- **Indicador visual**: Progress bar para jobs en proceso

## 🔌 Integración con Backend

### Servicio HTTP (`VideoExpressService`)

```typescript
// Métodos disponibles:
getStats(): Observable<VideoJobResponse<UserVideoStats>>
listJobs(params?: ListJobsParams): Observable<VideoJobResponse<JobsListResponse>>
getJob(jobId: string): Observable<VideoJobResponse<VideoJob>>
createJob(productImage: File, animationStyle: AnimationStyle): Observable<VideoJobResponse<VideoJob>>
deleteJob(jobId: string): Observable<VideoJobResponse>
getDownloadUrl(jobId: string): string
```

**⚠️ Importante - Autenticación:**
El servicio usa el header `token` (no `Authorization: Bearer`) porque el backend espera:
```typescript
private getAuthHeaders() {
  const headers = new HttpHeaders({ 'token': this._auth.token || '' });
  return { headers };
}
```

Esto es consistente con el middleware `auth.verifyAdmin` del backend que lee `req.headers.token`.

### Endpoints consumidos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/video-express/stats` | Estadísticas del usuario |
| GET | `/api/video-express/jobs` | Listar jobs (con filtros) |
| GET | `/api/video-express/jobs/:id` | Detalles de un job |
| POST | `/api/video-express/jobs` | Crear nuevo job (upload) |
| DELETE | `/api/video-express/jobs/:id` | Eliminar job |
| GET | `/api/video-express/download/:id` | Descargar video |

## 🎨 UX/UI - Enfoque MVP

### Principios de diseño
✅ **Simplicidad**: Flujo lineal sin complejidad innecesaria  
✅ **Feedback visual**: Indicadores claros de estado y progreso  
✅ **Auto-actualización**: Sin necesidad de refresh manual  
✅ **Mobile-friendly**: Responsive design con Metronic  
✅ **Acciones rápidas**: Botones de acción visibles y accesibles  

### Componentes Metronic utilizados
- Cards con `card-custom`
- Badges para estados (`badge-success`, `badge-warning`, etc.)
- Tablas con `table-head-custom`
- Spinners para loading states
- Alerts con `alert-custom`
- Iconos Flaticon2

## 🔄 Polling Strategy

### Dashboard
- **Intervalo**: Cada 10 segundos
- **Condición**: Siempre activo mientras el componente está montado
- **Propósito**: Actualizar estadísticas en tiempo real

### Jobs List
- **Intervalo**: Cada 10 segundos
- **Condición**: Solo si hay jobs con estado `pending` o `processing`
- **Propósito**: Evitar polling innecesario cuando no hay jobs activos

```typescript
// Implementación en componente
private pollingSubscription?: Subscription;

startPolling(): void {
  this.pollingSubscription = interval(10000)
    .pipe(switchMap(() => this.videoExpressService.getStats()))
    .subscribe(/* ... */);
}

ngOnDestroy(): void {
  if (this.pollingSubscription) {
    this.pollingSubscription.unsubscribe();
  }
}
```

## 📊 Modelos TypeScript

### VideoJob
```typescript
interface VideoJob {
  id: string;                    // UUID
  user_id: number;
  product_image_url: string;
  animation_style: AnimationStyle;
  status: JobStatus;
  fal_request_id?: string;
  output_video_url?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}
```

### Tipos auxiliares
```typescript
type AnimationStyle = 'zoom_in' | 'parallax' | 'subtle_float';
type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';
```

### Helpers
- `ANIMATION_STYLE_LABELS`: Labels en español para estilos
- `JOB_STATUS_LABELS`: Labels en español para estados
- `JOB_STATUS_CLASSES`: Clases CSS de Bootstrap para badges

## 🛠️ Dependencias

### Angular Core
- `@angular/core`, `@angular/common`, `@angular/router`
- `@angular/forms` (FormsModule, ReactiveFormsModule)
- `@angular/common/http` (HttpClientModule)

### Servicios del Proyecto
- `AuthService`: Inyectado para obtener token JWT

### RxJS
- `rxjs`: Observable, interval, Subscription
- `rxjs/operators`: switchMap, map

### Terceros
- `sweetalert2`: Modales de confirmación y detalles

## 🚦 Navegación

El módulo se registra en:

1. **`pages-routing.module.ts`** (lazy loading):
```typescript
{
  path: 'video-express',
  loadChildren: () =>
    import('../modules/video-express/video-express.module').then(
      (m) => m.VideoExpressModule
    ),
}
```

2. **`aside-menu-admin-general.config.ts`** (sidebar):
```typescript
{
  title: 'Product Video Express',
  name: "video-express",
  icon: 'flaticon2-film',
  svg: './assets/media/svg/icons/Devices/Video-camera.svg',
  page: '/video-express',
  submenu: [
    { title: 'Dashboard', page: '/video-express' },
    { title: 'Crear Video', page: '/video-express/create' },
    { title: 'Mis Jobs', page: '/video-express/jobs' }
  ]
}
```

## 🧪 Testing Manual

### Checklist de pruebas

#### Dashboard
- [ ] Las estadísticas se cargan correctamente
- [ ] Los 5 videos recientes se muestran
- [ ] El polling actualiza las estadísticas cada 10s
- [ ] El botón "Crear Video" navega a `/video-express/create`
- [ ] El botón "Ver Todos" navega a `/video-express/jobs`

#### Crear Video
- [ ] El preview de imagen funciona al seleccionar archivo
- [ ] Valida formato de archivo (solo JPG/PNG)
- [ ] Valida tamaño máximo (10MB)
- [ ] Los 3 estilos de animación son seleccionables
- [ ] El botón "Generar Video" está deshabilitado sin imagen
- [ ] Muestra spinner durante el upload
- [ ] Muestra mensaje de éxito y redirige a jobs list
- [ ] Muestra mensaje de error si falla el upload

#### Mis Jobs
- [ ] La tabla muestra todos los jobs del usuario
- [ ] Los filtros por estado funcionan correctamente
- [ ] El polling se activa solo con jobs activos
- [ ] El botón de descarga solo aparece en jobs completados
- [ ] El botón de eliminar muestra confirmación (SweetAlert2)
- [ ] El modal de detalles muestra toda la información
- [ ] La descarga abre nueva pestaña con el video

## 🎯 Próximas Iteraciones (Fuera del MVP)

**No implementar hasta validar el MVP:**
- [ ] Paginación avanzada en jobs list
- [ ] Búsqueda por texto en jobs
- [ ] Vista de video inline (player HTML5)
- [ ] Edición de jobs (re-procesar con otro estilo)
- [ ] Compartir videos (links públicos)
- [ ] Galería de ejemplos
- [ ] Exportar lista de jobs a CSV
- [ ] Notificaciones push cuando completa un video
- [ ] Analytics detallados (tiempo promedio, etc.)

## 📝 Notas de Desarrollo

### Convenciones de código
- Componentes con sufijo `Component` (ej: `JobCreatorComponent`)
- Servicios con sufijo `Service` (ej: `VideoExpressService`)
- Modelos en carpeta `_models/` con sufijo `.model.ts`
- Servicios en carpeta `_services/` con sufijo `.service.ts`

### Gestión de errores
- Siempre mostrar mensaje user-friendly
- Loggear error completo en consola (para debugging)
- Usar SweetAlert2 para errores críticos
- Usar alert-danger de Bootstrap para errores no bloqueantes

### Performance
- Lazy loading del módulo (no afecta bundle principal)
- Polling condicional (solo cuando necesario)
- Unsubscribe en `ngOnDestroy()` para evitar memory leaks
- Imágenes con `object-fit: cover` para mantener aspect ratio

## 🐛 Troubleshooting

### Problema: "Cannot find module '@angular/common/http'"
**Solución**: Verificar que `HttpClientModule` esté importado en `app.module.ts`

### Problema: El polling no se detiene al salir del componente
**Solución**: 
- Verificar que el usuario esté logueado correctamente
- El token JWT debe estar presente en `localStorage` con key `'token'`
- El servicio usa el header `token` (no `Authorization`) como espera el backend
- Si persiste, hacer logout → login nuevamente

### Problema: 401 Unauthorized en requests
**Solución**: Verificar que el token JWT esté en localStorage con key `'token'`

### Problema: No aparece el módulo en el sidebar
**Solución**: Verificar que `aside-menu-admin-general.config.ts` esté correctamente actualizado

### Problema: 404 al navegar a `/video-express`
**Solución**: Verificar que la ruta esté registrada en `pages-routing.module.ts`

## 📞 Soporte

Para dudas o issues relacionados con este módulo:
1. Revisar logs del navegador (F12 → Console)
2. Verificar que el backend esté corriendo en `http://localhost:3500`
3. Revisar logs del servidor backend en `/api/logs/`
4. Consultar documentación del backend en `/api/PRODUCT-VIDEO-EXPRESS-SETUP.md`

---

**Versión**: 1.0.0 MVP  
**Fecha**: Febrero 2025  
**Autor**: Indie Hacker (Enfoque rápido de validación)
