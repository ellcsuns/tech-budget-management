# Comandos para Implementar Módulos de Ahorros y Gestión de Gastos

## Resumen de Cambios Realizados

Se han implementado dos nuevos módulos completos:

1. **Módulo de Ahorros**: Permite registrar ahorros sobre gastos con distribución flexible (homogénea, un mes, o personalizada), workflow de aprobación, y creación automática de nuevas versiones de presupuesto.

2. **Gestión de Gastos Mejorada**: CRUD completo de gastos con sistema de tags personalizados (key-value pairs), búsqueda dinámica por cualquier atributo, y modal de detalle.

### Archivos Modificados/Creados

**Backend:**
- `backend/src/index.ts` - Registradas nuevas rutas
- `backend/src/routes/savings.ts` - NUEVO
- `backend/src/routes/expenses.ts` - NUEVO
- `backend/src/services/SavingService.ts` - YA EXISTÍA
- `backend/src/services/ExpenseService.ts` - YA EXISTÍA
- `backend/src/types/index.ts` - Actualizado con tipos

**Frontend:**
- `frontend/src/services/api.ts` - Agregados clientes API
- `frontend/src/types/index.ts` - Agregados tipos
- `frontend/src/pages/SavingsPage.tsx` - NUEVO
- `frontend/src/pages/ExpensesPage.tsx` - REEMPLAZADO
- `frontend/src/components/ExpenseDetailPopup.tsx` - NUEVO
- `frontend/src/App.tsx` - Agregada ruta /savings
- `frontend/src/components/Sidebar.tsx` - Agregado enlace Ahorros

---

## Comandos a Ejecutar en EC2

### 1. Sincronizar Código desde GitHub

```bash
cd /home/ubuntu/tech-budget-management
git pull origin main
```

### 2. Backend - Compilar y Reiniciar

```bash
cd /home/ubuntu/tech-budget-management/backend
npm run build
pm2 restart tech-budget-api
```

### 3. Frontend - Compilar

```bash
cd /home/ubuntu/tech-budget-management/frontend
npm run build
```

### 4. Verificar Estado

```bash
# Ver logs del backend
pm2 logs tech-budget-api --lines 50

# Verificar que el API esté corriendo
curl http://localhost:3001/health
```

---

## Notas Importantes

### Base de Datos
- **NO se requiere migración de Prisma** - El modelo `Saving` ya existe en el schema
- Todos los cambios son compatibles con el schema actual

### Rutas del Backend
Las siguientes rutas nuevas están disponibles:

**Savings:**
- `GET /api/savings` - Listar ahorros (con filtros opcionales)
- `GET /api/savings/:id` - Obtener ahorro por ID
- `POST /api/savings` - Crear nuevo ahorro
- `POST /api/savings/approve` - Aprobar múltiples ahorros
- `DELETE /api/savings/:id` - Eliminar ahorro

**Expenses Enhanced:**
- `GET /api/expenses-enhanced` - Listar gastos con tags (con filtros)
- `GET /api/expenses-enhanced/:id` - Obtener gasto con tags
- `POST /api/expenses-enhanced` - Crear nuevo gasto
- `PUT /api/expenses-enhanced/:id` - Actualizar gasto
- `DELETE /api/expenses-enhanced/:id` - Eliminar gasto
- `POST /api/expenses-enhanced/:id/tags` - Agregar tag personalizado
- `PUT /api/expenses-enhanced/:id/tags/:key` - Actualizar tag
- `DELETE /api/expenses-enhanced/:id/tags/:key` - Eliminar tag

### Permisos
- El módulo de Ahorros usa el permiso `budgets` (VIEW/MODIFY)
- El módulo de Gastos usa el permiso `expenses` (VIEW/MODIFY)

### Acceso en el Frontend
- **Ahorros**: http://tu-dominio/savings
- **Gastos**: http://tu-dominio/expenses (página actualizada)

---

## Verificación Post-Despliegue

1. Accede a la aplicación y verifica que aparezca "Ahorros" en el menú lateral
2. Prueba crear un ahorro sobre un gasto existente
3. Prueba la búsqueda de gastos y la gestión de tags personalizados
4. Verifica que los permisos funcionen correctamente

---

## Troubleshooting

Si encuentras errores:

1. **Error de compilación TypeScript**: Verifica que todos los archivos se hayan sincronizado correctamente
2. **Error 404 en rutas**: Asegúrate de que PM2 reinició correctamente el backend
3. **Error de permisos**: Verifica que tu usuario tenga los permisos `budgets` y `expenses`

Para ver logs detallados:
```bash
pm2 logs tech-budget-api --lines 100
```
