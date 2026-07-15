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
Write-Host ">>> Construyendo proyecto Admin..." -ForegroundColor $Cyan
ng build --configuration=production

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nError en la compilacion de Admin. Se detiene la ejecucion" -ForegroundColor $Red
    exit 1
} else {
    Write-Host "Compilacion Admin completada correctamente" -ForegroundColor $Green
}

# ===================== PASO 3 =====================
Write-Host "`nPASO 3: Sincronizar archivos con la carpeta de deploy" -ForegroundColor $Cyan
Write-Host ">>> Sincronizando archivos..." -ForegroundColor $Cyan

# Crear directorio de destino si no existe
$deployDistDir = Join-Path $DEPLOY_DIR "dist"
if (-not (Test-Path $deployDistDir)) {
    New-Item -ItemType Directory -Path $deployDistDir -Force | Out-Null
}

# Limpiar carpeta destino
if (Test-Path $deployDistDir) {
    Get-ChildItem -Path $deployDistDir -Recurse | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
}

# Copiar archivos excluyendo metadatos
Get-ChildItem -Path $BUILD_DIR -Recurse | Where-Object { $_.Name -notlike "._*" } | ForEach-Object {
    $targetPath = $_.FullName -replace [regex]::Escape($BUILD_DIR), $deployDistDir
    if ($_.PSIsContainer) {
        if (-not (Test-Path $targetPath)) {
            New-Item -ItemType Directory -Path $targetPath -Force | Out-Null
        }
    } else {
        Copy-Item -Path $_.FullName -Destination $targetPath -Force
    }
}

if ($LASTEXITCODE -eq 0 -or $?) {
    Write-Host "Archivos sincronizados correctamente" -ForegroundColor $Green
} else {
    Write-Host "`nError al copiar los archivos. Se detiene la ejecucion" -ForegroundColor $Red
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
$pullCommand = "cd $REMOTE_PATH && git pull origin main"
ssh -i $SSH_KEY "${SSH_USER}@${SSH_HOST}" $pullCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host "Servidor remoto actualizado correctamente" -ForegroundColor $Green
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
