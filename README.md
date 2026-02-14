# Sistema de Gestión de Presupuesto Tecnológico

Sistema full-stack para gestión de presupuestos tecnológicos con seguimiento de valores planificados, comprometidos y reales.

## Estructura del Proyecto

```
tech-budget-management/
├── backend/          # API Node.js + Express + Prisma
│   ├── src/
│   │   ├── services/     # Lógica de negocio
│   │   ├── routes/       # Endpoints REST
│   │   ├── middleware/   # Middleware Express
│   │   └── types/        # Tipos TypeScript
│   └── prisma/
│       └── schema.prisma # Esquema de base de datos
├── frontend/         # React + TypeScript + Tailwind CSS
│   └── src/
│       ├── components/   # Componentes React
│       ├── pages/        # Páginas de la aplicación
│       ├── services/     # Cliente API
│       └── types/        # Tipos TypeScript
└── README.md
```

## Requisitos Previos

- Node.js 18+
- PostgreSQL 14+
- npm

## Instalación

### 1. Instalar dependencias

```bash
# Instalar dependencias del proyecto raíz
npm install

# Instalar dependencias del backend
cd backend
npm install

# Instalar dependencias del frontend
cd ../frontend
npm install
cd ..
```

### 2. Configurar PostgreSQL

Crear una base de datos PostgreSQL:

```sql
CREATE DATABASE tech_budget;
```

Actualizar el archivo `backend/.env` con tus credenciales:

```env
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/tech_budget?schema=public"
PORT=3001
NODE_ENV=development
```

### 3. Ejecutar migraciones de Prisma

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

### 4. Cargar datos de prueba

```bash
npm run seed
```

## Desarrollo

### Opción 1: Iniciar ambos servidores simultáneamente

Desde la raíz del proyecto:

```bash
npm run dev
```

Esto iniciará:
- Backend en http://localhost:3001
- Frontend en http://localhost:3000

### Opción 2: Iniciar servidores individualmente

Backend:
```bash
cd backend
npm run dev
```

Frontend (en otra terminal):
```bash
cd frontend
npm run dev
```

## Acceder a la Aplicación

Una vez iniciados los servidores, abre tu navegador en:

**http://localhost:3000**

## Funcionalidades Implementadas

### Backend
✅ API REST completa con Express
✅ Servicios de negocio (Budget, Expense, Transaction, PlanValue, etc.)
✅ Conversión automática de monedas
✅ Validaciones de integridad de datos
✅ Manejo de errores centralizado
✅ Logging de requests

### Frontend
✅ Dashboard con visualización de gastos
✅ Vista Plan y Vista Comparativa
✅ Filtros por moneda y empresa financiera
✅ Popup de detalle de gastos
✅ Navegación entre secciones
✅ Diseño responsivo con Tailwind CSS

### Base de Datos
✅ Esquema completo con Prisma
✅ Relaciones entre entidades
✅ Restricciones de unicidad e integridad
✅ Datos de prueba (seed)

## Estructura de la Base de Datos

- **Budget**: Presupuestos por año y versión
- **Expense**: Gastos con metadatos configurables
- **Transaction**: Transacciones comprometidas y reales
- **PlanValue**: Valores planificados mensuales
- **ConversionRate**: Tasas de cambio por moneda y mes
- **TechnologyDirection**: Direcciones tecnológicas (dato maestro)
- **UserArea**: Áreas de usuario (dato maestro)
- **FinancialCompany**: Empresas financieras (dato maestro)
- **TagDefinition**: Definiciones de etiquetas configurables
- **TagValue**: Valores de etiquetas por gasto

## Scripts Disponibles

### Raíz del proyecto
- `npm run dev` - Iniciar backend y frontend
- `npm run build` - Build de producción

### Backend
- `npm run dev` - Modo desarrollo con hot reload
- `npm run build` - Compilar TypeScript
- `npm run start` - Iniciar servidor compilado
- `npm run prisma:generate` - Generar cliente Prisma
- `npm run prisma:migrate` - Ejecutar migraciones
- `npm run prisma:studio` - Abrir Prisma Studio
- `npm run seed` - Cargar datos de prueba

### Frontend
- `npm run dev` - Modo desarrollo
- `npm run build` - Build de producción
- `npm run preview` - Preview del build

## Tecnologías

**Backend:**
- Node.js + TypeScript
- Express 4
- Prisma ORM 5
- PostgreSQL 14+
- CORS

**Frontend:**
- React 18
- TypeScript 5
- Tailwind CSS 3
- React Router 6
- Axios
- Vite

## Próximos Pasos

Para deployment en AWS EC2:

1. Configurar instancia EC2 con Ubuntu
2. Instalar Node.js y PostgreSQL
3. Clonar repositorio
4. Configurar variables de entorno
5. Ejecutar migraciones
6. Build de producción
7. Configurar PM2 para proceso persistente
8. Configurar Nginx como reverse proxy (opcional)

## Soporte

Para problemas o preguntas, consulta la documentación en `.kiro/specs/tech-budget-management/`

## Licencia

Privado
