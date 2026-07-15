#!/bin/bash

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[1;35m'
NC='\033[0m' # No Color

# Rutas
PROJECT_DIR="$(pwd)" # Asumiendo que estás dentro de admin/
BUILD_DIR="dist"
DEPLOY_DIR="/Volumes/lujandev/dev/projects/ECOMMERCE/ECOMMERCE-RECURSOS/PRO-DIST/admin_metronic_deploy"

divider="========================================================="

# ===================== BANNER PRINCIPAL =====================
echo -e "${MAGENTA}$divider${NC}"
echo -e "${MAGENTA}##                                                     ##${NC}"
echo -e "${MAGENTA}##       🚀🚀🚀 DEPLOY ADMIN 🚀🚀🚀                  ##${NC}"
echo -e "${MAGENTA}##                                                     ##${NC}"
echo -e "${MAGENTA}$divider${NC}"
echo -e "${YELLOW}🚀 Iniciando proceso de Deploy de ADMIN${NC}"
echo -e "${BLUE}$divider${NC}"

# ===================== PASO 1 =====================
echo -e "\n${CYAN}1️⃣ PASO 1: Guardar cambios en el repo del proyecto Admin${NC}"
echo -e "${CYAN}>>> 💾 Guardando cambios en repo de admin...${NC}"
git add .
git commit -m "💾 Pre-Deploy commit $(date '+%Y-%m-%d %H:%M:%S')" >/dev/null 2>&1
git push origin main
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Cambios guardados y enviados a GitHub correctamente${NC}"
else
  echo -e "${RED}❌ Error al guardar/enviar cambios a GitHub. Se detiene la ejecución${NC}"
  exit 1
fi

# ===================== PASO 2 =====================
echo -e "\n${CYAN}2️⃣ PASO 2: Compilar Admin${NC}"

# Limpiar archivos basura ANTES de compilar
echo -e "${CYAN}>>> 🧹 Limpiando archivos basura ._* antes de compilar...${NC}"
find . -name "._*" -type f -delete
echo -e "${GREEN}✅ Archivos basura eliminados${NC}"

# Limpiar dist/ anterior si existe
if [ -d "$BUILD_DIR" ]; then
  echo -e "${CYAN}>>> 🧹 Limpiando directorio dist/ anterior...${NC}"
  rm -rf "$BUILD_DIR"
fi

echo -e "${CYAN}>>> 🛠️ Construyendo proyecto Admin...${NC}"
ng build --configuration=production
if [ $? -ne 0 ]; then
  echo -e "\n${RED}❌ Error en la compilación de Admin. Se detiene la ejecución${NC}"
  exit 1
else
  echo -e "${GREEN}✅ Compilación Admin completada correctamente${NC}"
  
  # Verificar que index.html fue generado
  if [ -f "$BUILD_DIR/index.html" ]; then
    echo -e "${GREEN}✅ index.html generado correctamente${NC}"
  else
    echo -e "${RED}❌ ERROR: index.html NO fue generado en la compilación${NC}"
    exit 1
  fi
fi

# ===================== PASO 3 =====================
echo -e "\n${CYAN}3️⃣ PASO 3: Sincronizar archivos con la carpeta de deploy${NC}"
echo -e "${CYAN}>>> 📂 Sincronizando archivos...${NC}"

# Limpiar archivos basura del destino primero
echo -e "${CYAN}>>> 🧹 Limpiando archivos ._* del destino...${NC}"
find "$DEPLOY_DIR/dist/" -name "._*" -type f -delete 2>/dev/null || true

rsync -a --delete --exclude='._*' "$BUILD_DIR/" "$DEPLOY_DIR/dist/"
if [ $? -ne 0 ]; then
  echo -e "\n${RED}❌ Error al copiar los archivos con rsync. Se detiene la ejecución${NC}"
  exit 1
else
  echo -e "${GREEN}✅ Archivos sincronizados correctamente${NC}"
  
  # Verificar que index.html existe en destino
  if [ -f "$DEPLOY_DIR/dist/index.html" ]; then
    echo -e "${GREEN}✅ index.html encontrado en destino${NC}"
  else
    echo -e "${RED}❌ ERROR: index.html NO encontrado en destino${NC}"
    exit 1
  fi
fi

# ===================== PASO 4 =====================
echo -e "\n${CYAN}4️⃣ PASO 4: Git push final desde la carpeta de deploy${NC}"
cd "$DEPLOY_DIR" || exit
git add .
git commit -m "🚀 Deploy CDADMIN $(date '+%Y-%m-%d %H:%M:%S')" >/dev/null 2>&1
git push origin main
if [ $? -eq 0 ]; then
  echo -e "\n${GREEN}$divider${NC}"
  echo -e "${GREEN}✅ DEPLOY CDADMIN completado y enviado a GitHub${NC}"
  echo -e "${YELLOW}👉 Ahora entra al servidor y ejecuta: ${CYAN}cd /var/www/admin_ecommerce_mean && git pull origin main${NC}"
  echo -e "${GREEN}$divider${NC}\n"
else
  echo -e "\n${RED}❌ Error al hacer push a GitHub desde deploy. Se detiene la ejecución${NC}"
  exit 1
fi

# ===================== PASO 5 =====================
echo -e "\n${CYAN}5️⃣ PASO 5: Actualizar en el servidor remoto${NC}"
ssh -i ~/.ssh/id_rsa_do root@64.226.123.91 << 'EOF'
  cd /var/www/admin_ecommerce_mean
  echo ">>> Actualizando código desde GitHub..."
  git pull origin main
  echo ">>> Limpiando archivos basura ._*..."
  find . -name "._*" -type f -delete
  echo ">>> Verificando index.html..."
  if [ -f "dist/index.html" ]; then
    echo "✅ index.html encontrado"
    echo ">>> Ajustando permisos..."
    chown -R www-data:www-data /var/www/admin_ecommerce_mean
    chmod -R 755 /var/www/admin_ecommerce_mean
    find /var/www/admin_ecommerce_mean -type f -exec chmod 644 {} \;
    echo "✅ Permisos ajustados"
    echo ">>> Recargando Nginx..."
    systemctl reload nginx
    echo "✅ Nginx recargado"
  else
    echo "❌ ERROR: index.html NO encontrado"
    exit 1
  fi
EOF

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Servidor remoto actualizado correctamente${NC}"
  echo -e "${CYAN}🌐 Admin disponible en: ${YELLOW}https://admin.lujandev.com${NC}"
else
  echo -e "${RED}❌ Error al actualizar en el servidor remoto${NC}"
  exit 1
fi


# ================= FIN =================
echo -e "${MAGENTA}=========================================================${NC}"
echo -e "${MAGENTA}##                                                     ##${NC}"
echo -e "${MAGENTA}##    🎉🎉🎉 DEPLOY CDADMIN COMPLETADO 🎉🎉🎉         ##${NC}"
echo -e "${MAGENTA}##       ✅ Todo actualizado y en producción ✅       ##${NC}"
echo -e "${MAGENTA}##          🥳🚀🎊 FELICIDADES 🚀🎊🥳           ##${NC}"
echo -e "${MAGENTA}##                                                     ##${NC}"
echo -e "${MAGENTA}=========================================================${NC}\n"

