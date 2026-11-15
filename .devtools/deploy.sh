#!/bin/bash

# ============================================================
# DEPLOY ADMIN
# ============================================================

# Detener ante errores no controlados
set -o pipefail

# ===================== COLORES =====================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[1;35m'
NC='\033[0m'

# ===================== RUTAS =====================

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="dist"

DEPLOY_DIR="$HOME/Developer/LujanDev/deployment/admin"

cd "$PROJECT_DIR" || {
    echo "ERROR: No se pudo acceder al directorio de Admin."
    exit 1
}

divider="========================================================="


# ============================================================
# FUNCIONES
# ============================================================

check_macos_files() {
    local TARGET="$1"

    if [ ! -d "$TARGET" ] || [ -L "$TARGET" ]; then
        echo -e "${RED}❌ Directorio de validación inválido: $TARGET${NC}"
        exit 1
    fi

    if ! JUNK_FILES=$(find "$TARGET" \
        -type f \
        \( -name "._*" -o -name ".DS_Store" \) \
        -print); then
        echo -e "${RED}❌ No se pudo inspeccionar el directorio: $TARGET${NC}"
        exit 1
    fi

    if [ -n "$JUNK_FILES" ]; then

        echo -e "${RED}❌ Se encontraron archivos basura de macOS:${NC}"
        echo "$JUNK_FILES"

        echo -e "${RED}❌ Deploy cancelado para evitar subir basura a Git.${NC}"

        exit 1
    fi
}


# ===================== BANNER =====================

echo -e "${MAGENTA}$divider${NC}"
echo -e "${MAGENTA}##                                                     ##${NC}"
echo -e "${MAGENTA}##       🚀🚀🚀 DEPLOY ADMIN 🚀🚀🚀                  ##${NC}"
echo -e "${MAGENTA}##                                                     ##${NC}"
echo -e "${MAGENTA}$divider${NC}"

echo -e "${YELLOW}🚀 Iniciando proceso de Deploy de ADMIN${NC}"
echo -e "${BLUE}$divider${NC}"


# ============================================================
# PASO 0: VALIDACIONES PREVIAS
# ============================================================

PROJECT_REAL=$(pwd -P) || exit 1
EXPECTED_PROJECT="$HOME/Developer/LujanDev/platform/admin"

if [ "$PROJECT_REAL" != "$EXPECTED_PROJECT" ]; then
    echo -e "${RED}❌ El deploy debe ejecutarse desde el proyecto Admin principal.${NC}"
    exit 1
fi




echo -e "\n${CYAN}0️⃣ PASO 0: Validaciones previas${NC}"


# ------------------------------------------------------------
# Comprobar que estamos dentro del proyecto Admin
# ------------------------------------------------------------

if [ ! -f "$PROJECT_DIR/angular.json" ]; then

    echo -e "${RED}❌ No parece que estés dentro del proyecto Angular Admin.${NC}"
    echo -e "${YELLOW}Directorio actual: $PROJECT_DIR${NC}"

    exit 1
fi


# ------------------------------------------------------------
# Comprobar que existe el repo de deploy
# ------------------------------------------------------------

if [ ! -d "$DEPLOY_DIR/.git" ]; then

    echo -e "${RED}❌ No existe un repositorio Git válido en:${NC}"
    echo "$DEPLOY_DIR"

    exit 1
fi


# ------------------------------------------------------------
# Limpiar basura antes de cualquier operación
# ------------------------------------------------------------

if [ "$(git -C "$PROJECT_DIR" branch --show-current)" != "main" ]; then
    echo -e "${RED}❌ El repositorio fuente debe estar en main.${NC}"
    exit 1
fi

# No modificar archivos antes de validar ambos repositorios.


# ------------------------------------------------------------
# Comprobar que admin_metronic_deploy está sincronizado
# ------------------------------------------------------------

echo -e "${CYAN}>>> 🔍 Comprobando repositorio de deploy...${NC}"

cd "$DEPLOY_DIR" || exit 1

if [ "$(git branch --show-current)" != "main" ]; then
    echo -e "${RED}❌ El repositorio de distribución debe estar en main.${NC}"
    exit 1
fi

git fetch origin

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ No se pudo ejecutar git fetch en el repo de deploy.${NC}"
    exit 1
fi


LOCAL_COMMIT=$(git rev-parse HEAD)
REMOTE_COMMIT=$(git rev-parse origin/main)


if [ "$LOCAL_COMMIT" != "$REMOTE_COMMIT" ]; then

    echo -e "${RED}❌ El repo de deploy NO está sincronizado con origin/main.${NC}"

    echo ""
    git status --short --branch
    echo ""

    echo -e "${YELLOW}👉 No se modificará nada.${NC}"
    echo -e "${YELLOW}👉 Sincroniza admin_metronic_deploy antes de volver a desplegar.${NC}"

    exit 1
fi


# ------------------------------------------------------------
# Comprobar working tree limpio
# ------------------------------------------------------------

if [ -n "$(git status --porcelain)" ]; then

    echo -e "${RED}❌ admin_metronic_deploy tiene cambios locales.${NC}"

    git status --short

    echo -e "${YELLOW}👉 Revisa esos cambios antes de desplegar.${NC}"

    exit 1
fi


echo -e "${GREEN}✅ Repo de deploy limpio y sincronizado con GitHub${NC}"


cd "$PROJECT_DIR" || exit 1


# ============================================================
# PASO 1: GUARDAR Y PUBLICAR CAMBIOS DEL CÓDIGO FUENTE
# ============================================================

echo -e "\n${CYAN}1️⃣ PASO 1: Preparar código fuente Admin${NC}"

cd "$PROJECT_DIR" || exit 1

if [ "$(git branch --show-current)" != "main" ]; then
    echo -e "${RED}❌ Solo se permite desplegar desde main.${NC}"
    exit 1
fi

if ! git fetch origin main; then
    echo -e "${RED}❌ No se pudo consultar origin/main.${NC}"
    exit 1
fi

LOCAL_COMMIT=$(git rev-parse HEAD) || exit 1
REMOTE_COMMIT=$(git rev-parse origin/main) || exit 1

if [ "$LOCAL_COMMIT" != "$REMOTE_COMMIT" ]; then
    echo -e "${RED}❌ main no está sincronizada con origin/main.${NC}"
    echo -e "${YELLOW}Revisa los commits pendientes antes de desplegar.${NC}"
    exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}Archivos modificados:${NC}"
    git status --short

    echo ""
    read -r -p "¿Guardar y publicar estos cambios en main? [s/N]: " CONFIRM_SOURCE

    if [ "$CONFIRM_SOURCE" != "s" ]; then
        echo -e "${YELLOW}Operación cancelada.${NC}"
        exit 1
    fi

    read -r -p "Mensaje del commit (Enter = Pre-Deploy Admin): " COMMIT_MESSAGE
    COMMIT_MESSAGE=${COMMIT_MESSAGE:-"Pre-Deploy Admin $(date '+%Y-%m-%d %H:%M:%S')"}

    if ! git add -A; then
        echo -e "${RED}❌ Error preparando los cambios.${NC}"
        exit 1
    fi

    echo -e "${CYAN}Cambios preparados para el commit:${NC}"
    git diff --cached --stat

    if ! git diff --cached --quiet; then
        if ! git commit -m "$COMMIT_MESSAGE"; then
            echo -e "${RED}❌ Error creando el commit.${NC}"
            exit 1
        fi

        if ! git push origin main; then
            echo -e "${RED}❌ Error publicando el código fuente.${NC}"
            exit 1
        fi
    fi
fi

if [ -n "$(git status --porcelain)" ]; then
    echo -e "${RED}❌ El repositorio sigue teniendo cambios locales.${NC}"
    exit 1
fi

if ! git fetch origin main; then
    exit 1
fi

if [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]; then
    echo -e "${RED}❌ No se pudo verificar la sincronización final.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Código fuente limpio y publicado correctamente.${NC}"


# ============================================================
# PASO 2: COMPILAR ADMIN
# ============================================================

echo -e "\n${CYAN}2️⃣ PASO 2: Compilar Admin${NC}"

cd "$PROJECT_DIR" || exit 1

if [ ! -x "./node_modules/.bin/ng" ]; then
    echo -e "${RED}❌ Angular CLI local no disponible.${NC}"
    exit 1
fi

if [ -L "$BUILD_DIR" ]; then
    echo -e "${RED}❌ El directorio de build es un enlace simbólico.${NC}"
    exit 1
fi

if [ "$BUILD_DIR" != "dist" ]; then
    echo -e "${RED}❌ Directorio de compilación inesperado.${NC}"
    exit 1
fi

if [ -d "$BUILD_DIR" ]; then
    BUILD_REAL=$(cd "$BUILD_DIR" && pwd -P) || exit 1

    if [ "$BUILD_REAL" != "$PROJECT_REAL/dist" ]; then
        echo -e "${RED}❌ Ruta de eliminación no autorizada.${NC}"
        exit 1
    fi

    rm -rf -- "$BUILD_DIR" || exit 1
fi

if ! ./node_modules/.bin/ng build --configuration=production; then
    echo -e "${RED}❌ Error compilando Admin.${NC}"
    exit 1
fi

if [ ! -s "$BUILD_DIR/index.html" ]; then
    echo -e "${RED}❌ Build inválido: index.html no existe o está vacío.${NC}"
    exit 1
fi

check_macos_files "$BUILD_DIR"

echo -e "${GREEN}✅ Compilación Admin validada.${NC}"


# ============================================================
# PASO 3: SINCRONIZAR CON REPO DE DEPLOY
# ============================================================

echo -e "\n${CYAN}3️⃣ PASO 3: Sincronizar build Admin${NC}"

SOURCE_DIR="$PROJECT_DIR/$BUILD_DIR"
TARGET_DIR="$DEPLOY_DIR/dist"

EXPECTED_SOURCE="$HOME/Developer/LujanDev/platform/admin/dist"
EXPECTED_TARGET="$HOME/Developer/LujanDev/deployment/admin/dist"

if [ "$SOURCE_DIR" != "$EXPECTED_SOURCE" ] ||
   [ "$TARGET_DIR" != "$EXPECTED_TARGET" ]; then
    echo -e "${RED}❌ Rutas de sincronización inesperadas.${NC}"
    exit 1
fi

if [ -L "$SOURCE_DIR" ] || [ -L "$TARGET_DIR" ] ||
   [ -L "$PROJECT_DIR" ] || [ -L "$DEPLOY_DIR" ]; then
    echo -e "${RED}❌ Se detectó un enlace simbólico en una ruta crítica.${NC}"
    exit 1
fi

if [ ! -d "$SOURCE_DIR" ] || [ ! -d "$TARGET_DIR" ]; then
    echo -e "${RED}❌ Origen o destino no existe.${NC}"
    exit 1
fi

SOURCE_REAL=$(cd "$SOURCE_DIR" && pwd -P) || exit 1
TARGET_REAL=$(cd "$TARGET_DIR" && pwd -P) || exit 1

if [ "$SOURCE_REAL" != "$EXPECTED_SOURCE" ] ||
   [ "$TARGET_REAL" != "$EXPECTED_TARGET" ] ||
   [ "$SOURCE_REAL" = "$TARGET_REAL" ]; then
    echo -e "${RED}❌ Validación de rutas canónicas fallida.${NC}"
    exit 1
fi

if [ ! -s "$SOURCE_DIR/index.html" ]; then
    echo -e "${RED}❌ index.html del build no existe o está vacío.${NC}"
    exit 1
fi

if ! FILE_LIST=$(find "$SOURCE_DIR" -type f -print); then
    echo -e "${RED}❌ No se pudo inspeccionar el build.${NC}"
    exit 1
fi

FILE_COUNT=$(printf '%s\n' "$FILE_LIST" | wc -l | tr -d ' ')

if [ "$FILE_COUNT" -lt 100 ]; then
    echo -e "${RED}❌ Build sospechoso: solo $FILE_COUNT archivos.${NC}"
    exit 1
fi

echo -e "${CYAN}>>> Simulación de sincronización:${NC}"

if ! rsync -avn --delete \
    --exclude='._*' \
    --exclude='.DS_Store' \
    "$SOURCE_DIR/" "$TARGET_DIR/"; then
    echo -e "${RED}❌ Error en simulación rsync.${NC}"
    exit 1
fi

echo ""
read -r -p "¿Confirmar sincronización de Admin? [s/N]: " CONFIRM

if [ "$CONFIRM" != "s" ]; then
    echo -e "${YELLOW}Deploy cancelado por el usuario.${NC}"
    exit 1
fi

if ! rsync -av --delete \
    --exclude='._*' \
    --exclude='.DS_Store' \
    "$SOURCE_DIR/" "$TARGET_DIR/"; then
    echo -e "${RED}❌ Error sincronizando Admin.${NC}"
    exit 1
fi

check_macos_files "$TARGET_DIR"

if [ ! -s "$TARGET_DIR/index.html" ]; then
    echo -e "${RED}❌ index.html inválido en destino.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Sincronización Admin completada.${NC}"


# ============================================================
# PASO 4: COMMIT + PUSH REPO DEPLOY
# ============================================================

echo -e "\n${CYAN}4️⃣ PASO 4: Publicar build Admin${NC}"

cd "$DEPLOY_DIR" || exit 1

if [ "$(git branch --show-current)" != "main" ]; then
    echo -e "${RED}❌ El repositorio de distribución debe estar en main.${NC}"
    exit 1
fi

if ! git fetch origin main; then
    echo -e "${RED}❌ No se pudo consultar origin/main.${NC}"
    exit 1
fi

LOCAL_COMMIT=$(git rev-parse HEAD) || exit 1
REMOTE_COMMIT=$(git rev-parse origin/main) || exit 1

if [ "$LOCAL_COMMIT" != "$REMOTE_COMMIT" ]; then
    echo -e "${RED}❌ Distribución no sincronizada con origin/main.${NC}"
    exit 1
fi

check_macos_files "$TARGET_DIR"

if ! git add -A -- dist/; then
    echo -e "${RED}❌ Error preparando los archivos de distribución.${NC}"
    exit 1
fi

STAGED_JUNK=$(git diff --cached --name-only | grep -E '(^|/)\._|(^|/)\.DS_Store$' || true)

if [ -n "$STAGED_JUNK" ]; then
    echo -e "${RED}❌ Archivos macOS detectados en staging:${NC}"
    echo "$STAGED_JUNK"
    exit 1
fi

if ! git diff --cached --name-only -z | python3 -c '
import sys
paths = [p for p in sys.stdin.buffer.read().split(b"\0") if p]
invalid = [p for p in paths if not p.startswith(b"dist/")]
if invalid:
    print("ERROR: archivos staged fuera de dist/:")
    for p in invalid:
        print(repr(p))
    sys.exit(1)
'; then
    echo -e "${RED}❌ Deploy cancelado: staging no autorizado.${NC}"
    exit 1
fi

if git diff --cached --quiet; then
    echo -e "${YELLOW}ℹ️ El build no produjo cambios.${NC}"
else
    if ! git commit -m "Deploy Admin $(date '+%Y-%m-%d %H:%M:%S')"; then
        echo -e "${RED}❌ Error creando commit de distribución.${NC}"
        exit 1
    fi

    if ! git push origin main; then
        echo -e "${RED}❌ Error publicando distribución. Revisar el commit local.${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Distribución Admin procesada correctamente.${NC}"


# ============================================================
# PASO 5: ACTUALIZAR PRODUCCIÓN
# ============================================================

echo -e "\n${CYAN}5️⃣ PASO 5: Actualizar servidor remoto${NC}"


SSH_KEY="$HOME/.ssh/id_ed25519"

if [ ! -f "$SSH_KEY" ]; then
    echo -e "${RED}❌ No existe la clave SSH requerida: $SSH_KEY${NC}"
    exit 1
fi

ssh -o BatchMode=yes -o ConnectTimeout=10 -i "$SSH_KEY" root@64.226.123.91 << 'EOF'

    set -e

    PROD_DIR="/var/www/admin_ecommerce_mean"

    cd "$PROD_DIR" || exit 1

    if [ "$(git branch --show-current)" != "main" ]; then
        echo "❌ ERROR: producción debe estar en la rama main."
        exit 1
    fi

    # --------------------------------------------------------
    # Verificar que producción está limpia
    # --------------------------------------------------------

    echo ">>> 🔍 Verificando estado del repositorio de producción..."

    if [ -n "$(git status --porcelain)" ]; then

        echo "❌ ERROR: producción tiene cambios locales."
        echo ""

        git status --short

        echo ""
        echo "❌ Deploy cancelado para no sobrescribir cambios."

        exit 1

    fi


    echo "✅ Repositorio de producción limpio"


    # --------------------------------------------------------
    # Actualizar referencias remotas
    # --------------------------------------------------------

    echo ">>> 📡 Consultando cambios en GitHub..."

    git fetch origin


    # --------------------------------------------------------
    # Actualizar producción SOLO mediante Fast-Forward
    #
    # No usamos git pull para evitar configuraciones globales
    # como pull.rebase=true en el servidor.
    # --------------------------------------------------------

    echo ">>> ⬇️ Actualizando producción..."

    git merge --ff-only origin/main


    echo "✅ Repositorio actualizado correctamente"


    # --------------------------------------------------------
    # Verificar index.html
    # --------------------------------------------------------

    echo ">>> 🔍 Verificando dist/index.html..."

    if [ ! -f "dist/index.html" ]; then

        echo "❌ ERROR: dist/index.html NO encontrado"

        exit 1

    fi


    echo "✅ index.html encontrado"


    # --------------------------------------------------------
    # Verificar configuración Nginx
    # --------------------------------------------------------

    echo ">>> 🔍 Verificando configuración Nginx..."

    nginx -t


    echo "✅ Configuración Nginx válida"


    # --------------------------------------------------------
    # Recargar Nginx
    # --------------------------------------------------------

    echo ">>> 🔄 Recargando Nginx..."

    systemctl reload nginx


    echo "✅ Nginx recargado"


    # --------------------------------------------------------
    # Verificación final
    #
    # El deploy NO debe dejar cambios locales en producción.
    # --------------------------------------------------------

    echo ">>> 🔍 Verificando estado final del repositorio..."

    if [ -n "$(git status --porcelain)" ]; then

        echo "❌ ERROR: el deploy dejó cambios locales en producción."
        echo ""

        git status --short

        echo ""

        exit 1

    fi


    echo "✅ Producción limpia después del deploy"

EOF


if [ $? -eq 0 ]; then

    echo -e "${GREEN}✅ Servidor remoto actualizado correctamente${NC}"
    echo -e "${CYAN}🌐 Admin disponible en: ${YELLOW}https://admin.lujandev.com${NC}"

else

    echo -e "${RED}❌ Error al actualizar el servidor remoto${NC}"

    exit 1

fi


# ============================================================
# VERIFICACIÓN HTTPS
# ============================================================

echo -e "\n${CYAN}>>> Verificando HTTPS de Admin...${NC}"

if ! command -v curl >/dev/null 2>&1; then
    echo -e "${RED}❌ curl no está disponible.${NC}"
    exit 1
fi

HTTP_STATUS=$(curl --silent --show-error --location \
    --output /dev/null \
    --write-out '%{http_code}' \
    --connect-timeout 10 \
    --max-time 30 \
    "https://admin.lujandev.com/")

CURL_EXIT=$?

if [ "$CURL_EXIT" -ne 0 ] || [ "$HTTP_STATUS" != "200" ]; then
    echo -e "${RED}❌ Verificación HTTPS fallida (HTTP: $HTTP_STATUS).${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Admin responde correctamente por HTTPS (200).${NC}"


# ============================================================
# FIN
# ============================================================

echo -e "\n${MAGENTA}=========================================================${NC}"
echo -e "${MAGENTA}##                                                     ##${NC}"
echo -e "${MAGENTA}##    🎉🎉🎉 DEPLOY CDADMIN COMPLETADO 🎉🎉🎉         ##${NC}"
echo -e "${MAGENTA}##       ✅ Todo actualizado y en producción ✅       ##${NC}"
echo -e "${MAGENTA}##          🥳🚀🎊 FELICIDADES 🚀🎊🥳                 ##${NC}"
echo -e "${MAGENTA}##                                                     ##${NC}"
echo -e "${MAGENTA}=========================================================${NC}\n"