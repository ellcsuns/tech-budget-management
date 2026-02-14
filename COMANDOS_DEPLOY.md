# Comandos para Deploy Completo

## 📤 PASO 1: Desde tu máquina local (Windows)

```cmd
cd C:\ruta\a\tu\proyecto\tech-budget-management
git add .
git commit -m "Fix: Errores de TypeScript corregidos"
git push origin main
```

## 📥 PASO 2: En EC2 - Actualizar y compilar

```bash
ssh -i tu-clave.pem ubuntu@tu-ip-ec2

cd /home/ubuntu/tech-budget-management
git pull origin main

# Compilar backend
cd backend
npm run build

# Compilar frontend
cd ../frontend
npm run build

# Reiniciar aplicación
pm2 restart tech-budget-api
pm2 logs tech-budget-api --lines 50
```

## ⚡ PASO 2 ALTERNATIVO: Comando único

```bash
cd /home/ubuntu/tech-budget-management && \
git pull origin main && \
cd backend && npm run build && \
cd ../frontend && npm run build && \
pm2 restart tech-budget-api && \
pm2 logs tech-budget-api --lines 50
```

## ✅ Verificar que funciona

Abre en el navegador: `http://tu-ip-ec2:3001`

Deberías ver la página de login.

Credenciales:
- Usuario: `admin`
- Contraseña: `admin`
