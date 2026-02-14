# Comandos para Subir y Desplegar

## 📤 PASO 1: Desde tu máquina local (Windows)

```cmd
cd C:\ruta\a\tu\proyecto\tech-budget-app

git add .
git commit -m "Fix: BudgetService - todos los métodos dentro de la clase"
git push origin main
```

## 📥 PASO 2: En EC2 - Limpiar y actualizar

```bash
# Conectarse
ssh -i tu-clave.pem ubuntu@tu-ip-ec2

# Detener aplicación
pm2 stop tech-budget-api

# Ir al directorio correcto
cd /home/ubuntu/tech-budget-app

# Limpiar archivos compilados anteriores
cd backend
rm -rf dist node_modules
cd ../frontend
rm -rf dist node_modules
cd ..

# Actualizar código
git pull origin main

# Reinstalar y compilar backend
cd backend
npm install
npx prisma generate
npm run build

# Reinstalar y compilar frontend
cd ../frontend
npm install
npm run build

# Reiniciar aplicación
cd ../backend
pm2 restart tech-budget-api
pm2 logs tech-budget-api --lines 50
```

## ⚡ PASO 2 ALTERNATIVO: Comando único (después de conectarte)

```bash
cd /home/ubuntu/tech-budget-app && \
pm2 stop tech-budget-api && \
cd backend && rm -rf dist node_modules && \
cd ../frontend && rm -rf dist node_modules && \
cd .. && \
git pull origin main && \
cd backend && npm install && npx prisma migrate deploy && npx prisma generate && npm run build && \
cd ../frontend && npm install && npm run build && \
pm2 restart tech-budget-api && \
pm2 logs tech-budget-api --lines 50
```

## 🔍 Si aún hay errores de estructura de directorios

```bash
# Verificar estructura
cd /home/ubuntu/tech-budget-app
pwd
ls -la

# Si ves directorios duplicados como "tech-budget-app/tech-budget-app", hacer:
cd /home/ubuntu
rm -rf tech-budget-app
git clone https://github.com/ellcsuns/tech-budget-app.git
cd tech-budget-app

# Luego continuar con la instalación normal
cd backend
npm install
npx prisma migrate deploy
npx prisma generate
npm run build

cd ../frontend
npm install
npm run build

cd ../backend
pm2 restart tech-budget-api
```
