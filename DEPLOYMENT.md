# Guía de Despliegue - Tech Budget Management System

Este documento describe los pasos completos para desplegar la aplicación actualizada en AWS EC2 con PostgreSQL local.

## 🎯 Resumen de Cambios Implementados

Esta actualización incluye:

1. **Sistema de Autenticación y Autorización Completo**
   - Login con usuario y contraseña
   - Roles y permisos granulares por menú
   - Gestión de usuarios y roles
   - Usuario admin creado automáticamente

2. **Navegación Mejorada**
   - Menú lateral izquierdo (Sidebar)
   - Navegación basada en permisos

3. **Gestión de Presupuestos**
   - Página de presupuestos
   - Versionamiento automático

4. **Gestión de Gastos**
   - Página de gastos por presupuesto

5. **Edición de Valores Planeados**
   - Edición inline de valores mensuales
   - Creación automática de nueva versión al guardar
   - Tracking de cambios pendientes

6. **Gestión de Transacciones**
   - Página de transacciones comprometidas
   - Página de transacciones reales
   - CRUD completo para ambos tipos

7. **Filtros Mejorados**
   - Filtros toggle para monedas
   - Filtros toggle para empresas financieras

## 📋 Requisitos Previos

- Instancia EC2 de AWS (Ubuntu 22.04 LTS)
- Node.js 22 LTS instalado
- PostgreSQL instalado localmente
- Git instalado
- Acceso SSH a la instancia

---

## 🚀 PASOS PARA ACTUALIZAR LA APLICACIÓN EN EC2

### Paso 1: Conectarse al EC2

```bash
ssh -i tu-clave.pem ubuntu@tu-ip-ec2
```

### Paso 2: Ir al directorio del proyecto

```bash
cd /home/ubuntu/tech-budget-app
```

### Paso 3: Detener la aplicación

```bash
pm2 stop tech-budget-api
```

### Paso 4: Hacer backup de la base de datos (RECOMENDADO)

```bash
pg_dump -U tech_budget_user -d tech_budget > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Paso 5: Actualizar código desde Git

```bash
git pull origin main
```

**Nota**: Si no tienes Git configurado, puedes transferir los archivos con SCP:

```bash
# Desde tu máquina local:
scp -i tu-clave.pem -r /ruta/local/tech-budget-app ubuntu@tu-ip-ec2:/home/ubuntu/
```

### Paso 6: Instalar nuevas dependencias del backend

```bash
cd /home/ubuntu/tech-budget-app/backend
npm install
```

### Paso 7: Instalar nuevas dependencias del frontend

```bash
cd /home/ubuntu/tech-budget-app/frontend
npm install
```

### Paso 8: Ejecutar nuevas migraciones de base de datos

```bash
cd /home/ubuntu/tech-budget-app/backend
npx prisma migrate deploy
```

**Importante**: Si encuentras error de "shadow database", edita temporalmente `backend/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  shadowDatabaseUrl = env("DATABASE_URL")  // Agregar esta línea
}
```

Ejecuta las migraciones y luego remueve la línea.

### Paso 9: Generar cliente de Prisma actualizado

```bash
npx prisma generate
```

### Paso 10: Compilar backend

```bash
npm run build
```

### Paso 11: Compilar frontend

```bash
cd /home/ubuntu/tech-budget-app/frontend
npm run build
```

### Paso 12: Reiniciar aplicación

```bash
pm2 restart tech-budget-api
```

### Paso 13: Verificar que la aplicación esté corriendo

```bash
pm2 status
pm2 logs tech-budget-api --lines 50
```

### Paso 14: Verificar en el navegador

Abre en el navegador:
- Con Nginx: `http://tu-ip-ec2` o `http://tu-dominio.com`
- Sin Nginx: `http://tu-ip-ec2:3001`

Deberías ver la página de login. Usa las credenciales:
- **Usuario**: `admin`
- **Contraseña**: `admin`

---

## ⚡ Comando Rápido para Actualización

```bash
cd /home/ubuntu/tech-budget-app && \
pm2 stop tech-budget-api && \
git pull origin main && \
cd backend && npm install && npx prisma migrate deploy && npx prisma generate && npm run build && \
cd ../frontend && npm install && npm run build && \
pm2 restart tech-budget-api && \
pm2 logs tech-budget-api --lines 50
```

---

## 🔧 Configuración Inicial (Si es primera vez)

### 1. Instalar Node.js 22 LTS

```bash
# Desinstalar versiones anteriores
sudo apt remove nodejs npm -y

# Instalar Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar
node --version  # Debe mostrar v22.x.x
npm --version
```

### 2. Instalar PostgreSQL

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 3. Configurar PostgreSQL

```bash
sudo -u postgres psql

# Dentro de psql:
CREATE DATABASE tech_budget;
CREATE USER tech_budget_user WITH PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE tech_budget TO tech_budget_user;
\q
```

### 4. Configurar Variables de Entorno

```bash
cd /home/ubuntu/tech-budget-app/backend
nano .env
```

Contenido del archivo `.env`:

```env
DATABASE_URL="postgresql://tech_budget_user:tu_password_seguro@localhost:5432/tech_budget?schema=public"
PORT=3001
NODE_ENV=production
JWT_SECRET=tu_jwt_secret_muy_seguro_cambiar_esto
JWT_EXPIRATION=24h
```

### 5. Instalar PM2

```bash
sudo npm install -g pm2
```

### 6. Iniciar aplicación por primera vez

```bash
cd /home/ubuntu/tech-budget-app/backend
npm install
npx prisma migrate deploy
npx prisma generate
npm run build

cd ../frontend
npm install
npm run build

cd ../backend
pm2 start dist/index.js --name tech-budget-api
pm2 save
pm2 startup
```

Ejecuta el comando que PM2 te muestra para configurar inicio automático.

---

## 🔐 Credenciales por Defecto

Al iniciar la aplicación por primera vez, se crea automáticamente:

- **Usuario**: `admin`
- **Contraseña**: `admin`

El usuario admin tiene acceso completo a:
- Dashboard
- Presupuestos
- Gastos
- Valores Planeados
- Transacciones Comprometidas
- Transacciones Reales
- Datos Maestros
- Usuarios
- Roles
- Reportes

**⚠️ IMPORTANTE**: Cambia esta contraseña inmediatamente después del primer login.

---

## 🛠️ Comandos Útiles de PM2

```bash
# Ver estado
pm2 status

# Ver logs en tiempo real
pm2 logs tech-budget-api

# Ver últimas 100 líneas de logs
pm2 logs tech-budget-api --lines 100

# Ver solo errores
pm2 logs tech-budget-api --err

# Reiniciar
pm2 restart tech-budget-api

# Detener
pm2 stop tech-budget-api

# Eliminar de PM2
pm2 delete tech-budget-api

# Limpiar logs
pm2 flush
```

---

## 🔍 Verificación

### Verificar Backend

```bash
curl http://localhost:3001/health
```

Debe responder:
```json
{"status":"ok","timestamp":"..."}
```

### Verificar Frontend

Abre en el navegador y verifica que:
1. La página de login carga correctamente
2. Puedes iniciar sesión con admin/admin
3. El menú lateral izquierdo aparece
4. Todas las secciones son accesibles

---

## 🐛 Solución de Problemas

### Error: Cannot connect to database

```bash
# Verificar PostgreSQL
sudo systemctl status postgresql

# Probar conexión
psql -U tech_budget_user -d tech_budget -h localhost
```

### Error: Port 3001 already in use

```bash
# Encontrar proceso
sudo lsof -i :3001

# Matar proceso
sudo kill -9 <PID>

# O reiniciar PM2
pm2 restart tech-budget-api
```

### Error: Prisma Client not generated

```bash
cd /home/ubuntu/tech-budget-app/backend
npx prisma generate
npm run build
pm2 restart tech-budget-api
```

### Frontend no carga

```bash
# Verificar que el build existe
ls -la /home/ubuntu/tech-budget-app/frontend/dist

# Recompilar si es necesario
cd /home/ubuntu/tech-budget-app/frontend
npm run build
pm2 restart tech-budget-api
```

### Error de compilación TypeScript

```bash
cd /home/ubuntu/tech-budget-app/backend
npm run build
# Revisar errores y corregir
```

### Usuario admin no se crea

El usuario admin se crea automáticamente al iniciar el servidor. Verifica los logs:

```bash
pm2 logs tech-budget-api --lines 100
```

Deberías ver:
```
✅ Default admin user created (username: admin, password: admin)
```

---

## 💾 Backup de Base de Datos

### Crear Backup Manual

```bash
pg_dump -U tech_budget_user -d tech_budget > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restaurar Backup

```bash
psql -U tech_budget_user -d tech_budget < backup_20240101_120000.sql
```

### Automatizar Backups Diarios

```bash
# Crear script
nano /home/ubuntu/backup_db.sh
```

Contenido:
```bash
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
mkdir -p $BACKUP_DIR
pg_dump -U tech_budget_user -d tech_budget > $BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql
# Mantener solo últimos 7 días
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

```bash
chmod +x /home/ubuntu/backup_db.sh
crontab -e
# Agregar: 0 2 * * * /home/ubuntu/backup_db.sh
```

---

## 🌐 Configurar Nginx (Opcional)

### Instalar Nginx

```bash
sudo apt install nginx -y
```

### Configurar como Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/tech-budget
```

Contenido:
```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    # Frontend
    location / {
        root /home/ubuntu/tech-budget-app/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API Backend
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Activar configuración

```bash
sudo ln -s /etc/nginx/sites-available/tech-budget /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔒 Configurar Firewall

```bash
# Permitir puertos necesarios
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3001/tcp
sudo ufw enable
```

**Security Group en AWS**:
- Puerto 22 (SSH)
- Puerto 80 (HTTP)
- Puerto 443 (HTTPS)
- Puerto 3001 (Backend - opcional)

---

## 📊 Monitoreo

### Ver uso de recursos

```bash
# CPU y memoria
htop

# Espacio en disco
df -h

# Logs del sistema
sudo journalctl -u nginx -f
```

### Logs de la aplicación

```bash
# PM2
pm2 logs tech-budget-api

# Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 📝 Notas Importantes

1. **Siempre haz backup** antes de actualizar
2. **Verifica los logs** después de cada actualización
3. **Cambia las contraseñas por defecto** inmediatamente
4. **Mantén el sistema actualizado**: `sudo apt update && sudo apt upgrade -y`
5. **Monitorea el uso de recursos** regularmente

---

## 🆘 Soporte

Si encuentras problemas:

1. Revisa los logs: `pm2 logs tech-budget-api --lines 100`
2. Verifica el estado: `pm2 status`
3. Revisa la conexión a la base de datos
4. Verifica que todos los servicios estén corriendo

---

## ✅ Checklist de Despliegue

- [ ] Código actualizado desde Git
- [ ] Dependencias instaladas (backend y frontend)
- [ ] Migraciones ejecutadas
- [ ] Cliente Prisma generado
- [ ] Backend compilado
- [ ] Frontend compilado
- [ ] Aplicación reiniciada con PM2
- [ ] Logs verificados sin errores
- [ ] Login funciona correctamente
- [ ] Todas las páginas cargan
- [ ] Backup de base de datos creado
