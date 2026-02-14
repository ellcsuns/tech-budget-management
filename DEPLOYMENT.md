# Guía de Deployment en AWS EC2

Esta guía te ayudará a desplegar la aplicación de Gestión de Presupuesto Tecnológico en AWS EC2.

## Requisitos Previos

- Cuenta de AWS (capa gratuita disponible)
- Conocimientos básicos de AWS EC2
- Cliente SSH configurado

## Paso 1: Crear Instancia EC2

1. Inicia sesión en AWS Console
2. Ve a EC2 Dashboard
3. Click en "Launch Instance"
4. Configuración recomendada:
   - **AMI**: Ubuntu Server 22.04 LTS (Free tier eligible)
   - **Instance Type**: t2.micro (Free tier eligible)
   - **Key Pair**: Crea o selecciona un key pair para SSH
   - **Security Group**: Configura los siguientes puertos:
     - SSH (22) - Tu IP
     - HTTP (80) - 0.0.0.0/0
     - HTTPS (443) - 0.0.0.0/0
     - Custom TCP (3001) - 0.0.0.0/0 (backend API)
     - PostgreSQL (5432) - Solo desde la instancia EC2

## Paso 2: Conectar a la Instancia

```bash
ssh -i "tu-key.pem" ubuntu@tu-instancia-ec2.compute.amazonaws.com
```

## Paso 3: Instalar Dependencias

### Actualizar sistema
```bash
sudo apt update
sudo apt upgrade -y
```

### Instalar Node.js 18
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Verificar instalación
```

### Instalar PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Configurar PostgreSQL
```bash
sudo -u postgres psql

# En el prompt de PostgreSQL:
CREATE DATABASE tech_budget;
CREATE USER tech_user WITH PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE tech_budget TO tech_user;
\q
```

### Instalar PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### Instalar Git
```bash
sudo apt install -y git
```

## Paso 4: Transferir Código a EC2

Tienes dos opciones para obtener el código en EC2:

### Opción A: Desde GitHub (Recomendado)

Primero, sube tu código a GitHub desde tu máquina local:
```bash
# En tu máquina local
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/tu-usuario/tech-budget-management.git
git push -u origin main
```

Luego, en EC2:
```bash
cd /home/ubuntu
git clone https://github.com/tu-usuario/tech-budget-management.git tech-budget-app
cd tech-budget-app
```

### Opción B: Transferir archivos directamente con SCP

Desde tu máquina local:
```bash
# Comprimir el proyecto
tar -czf tech-budget-app.tar.gz .

# Transferir a EC2 (reemplaza con tu información)
scp -i "tu-key.pem" tech-budget-app.tar.gz ubuntu@tu-ec2-ip.compute.amazonaws.com:/home/ubuntu/
```

En EC2:
```bash
cd /home/ubuntu
mkdir tech-budget-app
tar -xzf tech-budget-app.tar.gz -C tech-budget-app
cd tech-budget-app
```

### Instalar dependencias
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### Configurar variables de entorno
```bash
cd backend
cp .env.example .env
nano .env
```

Actualizar con:
```env
DATABASE_URL="postgresql://tech_user:tu_password_seguro@tech_user_bd_pwd:5432/tech_budget?schema=public"
PORT=3001
NODE_ENV=production
```

### Ejecutar migraciones y seed
```bash
npm run prisma:generate
npm run prisma:migrate
npm run seed
```

## Paso 5: Build de Producción

### Build del frontend
```bash
cd /home/ubuntu/tech-budget-app/frontend
npm run build
```

### Build del backend
```bash
cd /home/ubuntu/tech-budget-app/backend
npm run build
```

## Paso 6: Configurar Backend para Servir Frontend

Actualizar `backend/src/index.ts` para servir archivos estáticos del frontend:

```typescript
import path from 'path';

// Después de las rutas de API, agregar:
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});
```

Rebuild del backend:
```bash
cd /home/ubuntu/tech-budget-app/backend
npm run build
```

## Paso 7: Iniciar Aplicación con PM2

```bash
cd /home/ubuntu/tech-budget-app/backend
pm2 start dist/index.js --name tech-budget-api
pm2 save
pm2 startup
```

Ejecutar el comando que PM2 te proporciona (algo como):
```bash
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

## Paso 8: Verificar Deployment

### Verificar que PM2 está ejecutando la aplicación
```bash
pm2 status
pm2 logs tech-budget-api
```

### Probar la API
```bash
curl http://localhost:3001/health
```

### Acceder desde el navegador
Abre tu navegador y ve a:
```
http://tu-instancia-ec2.compute.amazonaws.com:3001
```

## Paso 9: Configurar Nginx (Opcional pero Recomendado)

### Instalar Nginx
```bash
sudo apt install -y nginx
```

### Configurar Nginx como reverse proxy
```bash
sudo nano /etc/nginx/sites-available/tech-budget
```

Agregar:
```nginx
server {
    listen 80;
    server_name tu-dominio.com;  # O tu IP pública

    location / {
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

Ahora puedes acceder a la aplicación en:
```
http://tu-instancia-ec2.compute.amazonaws.com
```

## Paso 10: Configurar SSL con Let's Encrypt (Opcional)

### Instalar Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Obtener certificado SSL
```bash
sudo certbot --nginx -d tu-dominio.com
```

Sigue las instrucciones de Certbot.

## Comandos Útiles de PM2

```bash
# Ver logs
pm2 logs tech-budget-api

# Reiniciar aplicación
pm2 restart tech-budget-api

# Detener aplicación
pm2 stop tech-budget-api

# Ver estado
pm2 status

# Monitoreo en tiempo real
pm2 monit
```

## Actualizar la Aplicación

```bash
cd /home/ubuntu/tech-budget-app
git pull
npm install
cd backend && npm install && npm run build
cd ../frontend && npm install && npm run build
cd ..
pm2 restart tech-budget-api
```

## Troubleshooting

### La aplicación no inicia
```bash
pm2 logs tech-budget-api --lines 100
```

### Error de conexión a PostgreSQL
```bash
sudo systemctl status postgresql
sudo -u postgres psql -c "\l"  # Listar bases de datos
```

### Puerto 3001 no accesible
Verificar Security Group en AWS Console y asegurar que el puerto 3001 está abierto.

### Nginx no funciona
```bash
sudo nginx -t  # Verificar configuración
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log
```

## Monitoreo y Mantenimiento

### Configurar backups de PostgreSQL
```bash
# Crear script de backup
sudo nano /home/ubuntu/backup-db.sh
```

Contenido:
```bash
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
mkdir -p $BACKUP_DIR
pg_dump -U tech_user tech_budget > $BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).sql
# Mantener solo últimos 7 backups
ls -t $BACKUP_DIR/backup-*.sql | tail -n +8 | xargs rm -f
```

```bash
chmod +x /home/ubuntu/backup-db.sh
# Agregar a crontab para ejecutar diariamente
crontab -e
# Agregar: 0 2 * * * /home/ubuntu/backup-db.sh
```

### Monitoreo de recursos
```bash
# CPU y memoria
htop

# Espacio en disco
df -h

# Logs del sistema
sudo journalctl -u nginx -f
```

## Costos Estimados (AWS Free Tier)

- **EC2 t2.micro**: Gratis por 12 meses (750 horas/mes)
- **EBS Storage**: 30 GB gratis por 12 meses
- **Data Transfer**: 15 GB salida gratis por mes

Después del free tier:
- EC2 t2.micro: ~$8-10/mes
- EBS 30GB: ~$3/mes
- Total estimado: ~$11-13/mes

## Seguridad

1. **Cambiar contraseñas por defecto**
2. **Configurar firewall (ufw)**:
   ```bash
   sudo ufw allow 22
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw enable
   ```
3. **Mantener sistema actualizado**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```
4. **Configurar fail2ban** para proteger SSH
5. **Usar SSL/HTTPS en producción**

## Soporte

Para más información, consulta:
- [Documentación de AWS EC2](https://docs.aws.amazon.com/ec2/)
- [Documentación de PM2](https://pm2.keymetrics.io/)
- [Documentación de Nginx](https://nginx.org/en/docs/)
