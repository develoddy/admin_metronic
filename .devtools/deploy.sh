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

PROJECT_DIR="$(pwd)" # Ejecutar desde admin/
BUILD_DIR="dist"

DEPLOY_DIR="/Volumes/lujandev/dev/projects/ECOMMERCE/ECOMMERCE-RECURSOS/PRO-DIST/admin_metronic_deploy"

divider="========================================================="


# ============================================================
# FUNCIONES
# ============================================================

clean_macos_files() {
    local TARGET="$1"

    echo -e "${CYAN}>>> 🧹 Limpiando basura macOS en: $TARGET${NC}"

    find "$TARGET" -name "._*" -type f -delete 2>/dev/null || true
    find "$TARGET" -name ".DS_Store" -type f -delete 2>/dev/null || true
}


check_macos_files() {
    local TARGET="$1"

    JUNK_FILES=$(find "$TARGET" \
        \( -name "._*" -o -name ".DS_Store" \) \
        -type f \
        -print 2>/dev/null)

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

clean_macos_files "$PROJECT_DIR"
clean_macos_files "$DEPLOY_DIR"


# ------------------------------------------------------------
# Comprobar que admin_metronic_deploy está sincronizado
# ------------------------------------------------------------

echo -e "${CYAN}>>> 🔍 Comprobando repositorio de deploy...${NC}"

cd "$DEPLOY_DIR" || exit 1

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
# PASO 1: GUARDAR CAMBIOS ADMIN
# ============================================================

echo -e "\n${CYAN}1️⃣ PASO 1: Guardar cambios en el repo del proyecto Admin${NC}"

echo -e "${CYAN}>>> 💾 Guardando cambios en repo de admin...${NC}"


# Limpieza adicional antes de git add
clean_macos_files "$PROJECT_DIR"

check_macos_files "$PROJECT_DIR"


git add .


# Solo crear commit si realmente existen cambios staged
if ! git diff --cached --quiet; then

    git commit -m "💾 Pre-Deploy commit $(date '+%Y-%m-%d %H:%M:%S')"

    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Error creando commit del Admin.${NC}"
        exit 1
    fi

else

    echo -e "${YELLOW}ℹ️ No hay nuevos cambios para commit en Admin${NC}"

fi


git push origin main


if [ $? -eq 0 ]; then

    echo -e "${GREEN}✅ Cambios guardados y enviados a GitHub correctamente${NC}"

else

    echo -e "${RED}❌ Error al guardar/enviar cambios a GitHub.${NC}"
    echo -e "${RED}❌ Se detiene la ejecución.${NC}"

    exit 1
fi


# ============================================================
# PASO 2: COMPILAR ADMIN
# ============================================================

echo -e "\n${CYAN}2️⃣ PASO 2: Compilar Admin${NC}"


clean_macos_files "$PROJECT_DIR"


# ------------------------------------------------------------
# Limpiar dist anterior
# ------------------------------------------------------------

if [ -d "$BUILD_DIR" ]; then

    echo -e "${CYAN}>>> 🧹 Limpiando directorio dist/ anterior...${NC}"

    rm -rf "$BUILD_DIR"

fi


# ------------------------------------------------------------
# Build Angular
# ------------------------------------------------------------

echo -e "${CYAN}>>> 🛠️ Construyendo proyecto Admin...${NC}"

ng build --configuration=production


if [ $? -ne 0 ]; then

    echo -e "\n${RED}❌ Error en la compilación de Admin.${NC}"
    echo -e "${RED}❌ Se detiene la ejecución.${NC}"

    exit 1

fi


echo -e "${GREEN}✅ Compilación Admin completada correctamente${NC}"


# ------------------------------------------------------------
# Verificar index.html
# ------------------------------------------------------------

if [ ! -f "$BUILD_DIR/index.html" ]; then

    echo -e "${RED}❌ ERROR: index.html NO fue generado.${NC}"

    exit 1

fi


echo -e "${GREEN}✅ index.html generado correctamente${NC}"


# ------------------------------------------------------------
# Comprobar que el build tampoco contiene basura
# ------------------------------------------------------------

clean_macos_files "$BUILD_DIR"

check_macos_files "$BUILD_DIR"


# ============================================================
# PASO 3: SINCRONIZAR CON REPO DE DEPLOY
# ============================================================

echo -e "\n${CYAN}3️⃣ PASO 3: Sincronizar archivos con la carpeta de deploy${NC}"

echo -e "${CYAN}>>> 📂 Sincronizando archivos...${NC}"


# Limpieza completa del repo destino
clean_macos_files "$DEPLOY_DIR"


rsync -a \
    --delete \
    --exclude='._*' \
    --exclude='.DS_Store' \
    "$BUILD_DIR/" \
    "$DEPLOY_DIR/dist/"


if [ $? -ne 0 ]; then

    echo -e "\n${RED}❌ Error al copiar archivos con rsync.${NC}"

    exit 1

fi


echo -e "${GREEN}✅ Archivos sincronizados correctamente${NC}"


# ------------------------------------------------------------
# Limpieza posterior al rsync
# ------------------------------------------------------------

clean_macos_files "$DEPLOY_DIR"


# ------------------------------------------------------------
# Verificación ANTI-BASURA
# ------------------------------------------------------------

check_macos_files "$DEPLOY_DIR"


# ------------------------------------------------------------
# Verificar index.html destino
# ------------------------------------------------------------

if [ ! -f "$DEPLOY_DIR/dist/index.html" ]; then

    echo -e "${RED}❌ ERROR: index.html NO encontrado en destino.${NC}"

    exit 1

fi


echo -e "${GREEN}✅ index.html encontrado en destino${NC}"


# ============================================================
# PASO 4: COMMIT + PUSH REPO DEPLOY
# ============================================================

echo -e "\n${CYAN}4️⃣ PASO 4: Git push final desde la carpeta de deploy${NC}"


cd "$DEPLOY_DIR" || exit 1


# Última limpieza antes de git add
clean_macos_files "$DEPLOY_DIR"

check_macos_files "$DEPLOY_DIR"


git add .


# ------------------------------------------------------------
# Verificación adicional:
# ningún archivo basura puede estar staged
# ------------------------------------------------------------

STAGED_JUNK=$(git diff --cached --name-only | grep -E '(^|/)\._|(^|/)\.DS_Store$' || true)


if [ -n "$STAGED_JUNK" ]; then

    echo -e "${RED}❌ ARCHIVOS BASURA DETECTADOS EN GIT STAGING:${NC}"

    echo "$STAGED_JUNK"

    echo -e "${RED}❌ Deploy cancelado.${NC}"

    git reset

    exit 1
fi


# ------------------------------------------------------------
# Crear commit solamente si existen cambios
# ------------------------------------------------------------

if git diff --cached --quiet; then

    echo -e "${YELLOW}ℹ️ El build no produjo cambios respecto al deploy anterior.${NC}"
    echo -e "${YELLOW}ℹ️ No es necesario crear un nuevo commit.${NC}"

else

    git commit -m "🚀 Deploy CDADMIN $(date '+%Y-%m-%d %H:%M:%S')"

    if [ $? -ne 0 ]; then

        echo -e "${RED}❌ Error creando commit de deploy.${NC}"

        exit 1

    fi


    git push origin main


    if [ $? -ne 0 ]; then

        echo -e "${RED}❌ Error haciendo push del repo de deploy.${NC}"
        echo -e "${RED}❌ Se detiene la ejecución.${NC}"

        exit 1

    fi


    echo -e "${GREEN}✅ Build enviado correctamente a GitHub${NC}"

fi


# ============================================================
# PASO 5: ACTUALIZAR PRODUCCIÓN
# ============================================================

echo -e "\n${CYAN}5️⃣ PASO 5: Actualizar servidor remoto${NC}"


ssh -i ~/.ssh/id_rsa_do root@64.226.123.91 << 'EOF'

    set -e

    PROD_DIR="/var/www/admin_ecommerce_mean"

    cd "$PROD_DIR"


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
# FIN
# ============================================================

echo -e "\n${MAGENTA}=========================================================${NC}"
echo -e "${MAGENTA}##                                                     ##${NC}"
echo -e "${MAGENTA}##    🎉🎉🎉 DEPLOY CDADMIN COMPLETADO 🎉🎉🎉         ##${NC}"
echo -e "${MAGENTA}##       ✅ Todo actualizado y en producción ✅       ##${NC}"
echo -e "${MAGENTA}##          🥳🚀🎊 FELICIDADES 🚀🎊🥳                 ##${NC}"
echo -e "${MAGENTA}##                                                     ##${NC}"
echo -e "${MAGENTA}=========================================================${NC}\n"