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
echo -e "${CYAN}>>> 🛠️ Construyendo proyecto Admin...${NC}"
ng build --configuration=production
if [ $? -ne 0 ]; then
  echo -e "\n${RED}❌ Error en la compilación de Admin. Se detiene la ejecución${NC}"
  exit 1
else
  echo -e "${GREEN}✅ Compilación Admin completada correctamente${NC}"
fi

# ===================== PASO 3 =====================
echo -e "\n${CYAN}3️⃣ PASO 3: Sincronizar archivos con la carpeta de deploy${NC}"
echo -e "${CYAN}>>> 📂 Sincronizando archivos...${NC}"
rsync -a --delete --exclude='._*' "$BUILD_DIR/" "$DEPLOY_DIR/dist/"
if [ $? -ne 0 ]; then
  echo -e "\n${RED}❌ Error al copiar los archivos con rsync. Se detiene la ejecución${NC}"
  exit 1
else
  echo -e "${GREEN}✅ Archivos sincronizados correctamente${NC}"
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
ssh -i ~/.ssh/id_rsa_do root@64.226.123.91 << EOF
  cd /var/www/admin_ecommerce_mean
  git pull origin main
EOF

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Servidor remoto actualizado correctamente${NC}"
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

