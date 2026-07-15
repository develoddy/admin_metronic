# ================= DEPLOY ADMIN - WINDOWS VERSION =================
# Version PowerShell del script deploy.sh para Windows
# ===================================================================

# Colores
$Magenta = "Magenta"
$Yellow = "Yellow"
$Green = "Green"
$Red = "Red"
$Cyan = "Cyan"
$Blue = "Blue"

# Rutas
$PROJECT_DIR = Get-Location
$BUILD_DIR = "dist"
$DEPLOY_DIR = "C:\backup_lujandev\dev\projects\ECOMMERCE\ECOMMERCE-RECURSOS\PRO-DIST\admin_metronic_deploy"

# Servidor remoto
$SSH_USER = "root"
$SSH_HOST = "64.226.123.91"
$REMOTE_PATH = "/var/www/admin_ecommerce_mean"
$SSH_KEY = "$env:USERPROFILE\.ssh\id_droplet"

$divider = "========================================================="

# ===================== BANNER PRINCIPAL =====================
Write-Host $divider -ForegroundColor $Magenta
Write-Host "##                                                     ##" -ForegroundColor $Magenta
Write-Host "##       DEPLOY ADMIN                                  ##" -ForegroundColor $Magenta
Write-Host "##                                                     ##" -ForegroundColor $Magenta
Write-Host $divider -ForegroundColor $Magenta
Write-Host "Iniciando proceso de Deploy de ADMIN" -ForegroundColor $Yellow
Write-Host $divider -ForegroundColor $Blue

# ===================== PASO 1 =====================
Write-Host "`nPASO 1: Guardar cambios en el repo del proyecto Admin" -ForegroundColor $Cyan
Write-Host ">>> Guardando cambios en repo de admin..." -ForegroundColor $Cyan
git add .
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
git commit -m "Pre-Deploy commit $timestamp" 2>&1 | Out-Null
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "Cambios guardados y enviados a GitHub correctamente" -ForegroundColor $Green
} else {
    Write-Host "Error al guardar/enviar cambios a GitHub. Se detiene la ejecucion" -ForegroundColor $Red
    exit 1
}

# ===================== PASO 2 =====================
Write-Host "`nPASO 2: Compilar Admin" -ForegroundColor $Cyan

# Limpiar archivos basura ANTES de compilar
Write-Host ">>> Limpiando archivos basura ._* antes de compilar..." -ForegroundColor $Yellow
Get-ChildItem -Path . -Recurse -Force -File | Where-Object { $_.Name -like "._*" } | Remove-Item -Force -ErrorAction SilentlyContinue
Write-Host "Archivos basura eliminados" -ForegroundColor $Green

# Limpiar dist/ anterior si existe
if (Test-Path $BUILD_DIR) {
    Write-Host ">>> Limpiando directorio dist/ anterior..." -ForegroundColor $Yellow
    Remove-Item -Path $BUILD_DIR -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host ">>> Construyendo proyecto Admin..." -ForegroundColor $Cyan
ng build --configuration=production

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nError en la compilacion de Admin. Se detiene la ejecucion" -ForegroundColor $Red
    exit 1
} else {
    Write-Host "Compilacion Admin completada correctamente" -ForegroundColor $Green
    
    # Verificar que index.html fue generado
    if (Test-Path "$BUILD_DIR\index.html") {
        Write-Host "✅ index.html generado correctamente" -ForegroundColor $Green
    } else {
        Write-Host "❌ ERROR: index.html NO fue generado en la compilacion" -ForegroundColor $Red
        exit 1
    }
}

# ===================== PASO 3 =====================
Write-Host "`nPASO 3: Sincronizar archivos con la carpeta de deploy" -ForegroundColor $Cyan
Write-Host ">>> Sincronizando archivos..." -ForegroundColor $Cyan

# Crear directorio de destino si no existe
$deployDistDir = Join-Path $DEPLOY_DIR "dist"
if (-not (Test-Path $deployDistDir)) {
    New-Item -ItemType Directory -Path $deployDistDir -Force | Out-Null
    Write-Host "Directorio de destino creado: $deployDistDir" -ForegroundColor $Yellow
}

# Limpiar SOLO archivos basura ._* del destino primero
Get-ChildItem -Path $deployDistDir -Recurse -Force -File | Where-Object { $_.Name -like "._*" } | Remove-Item -Force -ErrorAction SilentlyContinue

# Limpiar carpeta destino completamente
Write-Host "Limpiando carpeta destino..." -ForegroundColor $Yellow
if (Test-Path $deployDistDir) {
    Remove-Item -Path "$deployDistDir\*" -Recurse -Force -ErrorAction SilentlyContinue
}

# Usar robocopy para copia más confiable (excluye archivos ._*)
Write-Host "Copiando archivos desde $BUILD_DIR a $deployDistDir..." -ForegroundColor $Yellow
robocopy "$BUILD_DIR" "$deployDistDir" /E /XF "._*" /NFL /NDL /NJH /NJS /nc /ns /np

# robocopy retorna códigos de éxito entre 0-7
if ($LASTEXITCODE -le 7) {
    Write-Host "Archivos sincronizados correctamente" -ForegroundColor $Green
    
    # Verificar que index.html existe
    if (Test-Path "$deployDistDir\index.html") {
        Write-Host "✅ index.html encontrado en destino" -ForegroundColor $Green
    } else {
        Write-Host "❌ ERROR: index.html NO encontrado en destino" -ForegroundColor $Red
        exit 1
    }
} else {
    Write-Host "`nError al copiar los archivos con robocopy (Exit Code: $LASTEXITCODE)" -ForegroundColor $Red
    exit 1
}

# ===================== PASO 4 =====================
Write-Host "`nPASO 4: Git push final desde la carpeta de deploy" -ForegroundColor $Cyan
Set-Location $DEPLOY_DIR
git add .
git commit -m "Deploy CDADMIN $timestamp" 2>&1 | Out-Null
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n$divider" -ForegroundColor $Green
    Write-Host "DEPLOY CDADMIN completado y enviado a GitHub" -ForegroundColor $Green
    Write-Host "Ahora entra al servidor y ejecuta: cd $REMOTE_PATH && git pull origin main" -ForegroundColor $Yellow
    Write-Host $divider -ForegroundColor $Green
} else {
    Write-Host "`nError al hacer push a GitHub desde deploy. Se detiene la ejecucion" -ForegroundColor $Red
    Set-Location $PROJECT_DIR
    exit 1
}

Set-Location $PROJECT_DIR

# ===================== PASO 5 =====================
Write-Host "`nPASO 5: Actualizar en el servidor remoto" -ForegroundColor $Cyan

$remoteScript = @"
cd $REMOTE_PATH
echo '>>> Actualizando codigo desde GitHub...'
git pull origin main
echo '>>> Limpiando archivos basura ._*...'
find . -name '._*' -type f -delete
echo '>>> Verificando index.html...'
if [ -f 'dist/index.html' ]; then
  echo '✅ index.html encontrado'
  echo '>>> Ajustando permisos...'
  chown -R www-data:www-data $REMOTE_PATH
  chmod -R 755 $REMOTE_PATH
  find $REMOTE_PATH -type f -exec chmod 644 {} \;
  echo '✅ Permisos ajustados'
  echo '>>> Recargando Nginx...'
  systemctl reload nginx
  echo '✅ Nginx recargado'
else
  echo '❌ ERROR: index.html NO encontrado'
  exit 1
fi
"@

ssh -i $SSH_KEY "${SSH_USER}@${SSH_HOST}" $remoteScript

if ($LASTEXITCODE -eq 0) {
    Write-Host "Servidor remoto actualizado correctamente" -ForegroundColor $Green
    Write-Host "Admin disponible en: https://admin.lujandev.com" -ForegroundColor $Cyan
} else {
    Write-Host "Error al actualizar en el servidor remoto" -ForegroundColor $Red
    exit 1
}

# ================= FIN =================
Write-Host "`n$divider" -ForegroundColor $Magenta
Write-Host "##                                                     ##" -ForegroundColor $Magenta
Write-Host "##    DEPLOY CDADMIN COMPLETADO                        ##" -ForegroundColor $Magenta
Write-Host "##       Todo actualizado y en produccion              ##" -ForegroundColor $Magenta
Write-Host "##          FELICIDADES                                ##" -ForegroundColor $Magenta
Write-Host "##                                                     ##" -ForegroundColor $Magenta
Write-Host $divider -ForegroundColor $Magenta
