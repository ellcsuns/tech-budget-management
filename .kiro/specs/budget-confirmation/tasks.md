# Tareas de Implementación — Confirmación de Presupuesto

## Tarea 1: Modelo de Datos y Migración
- [x] 1.1 Agregar enums `ConfirmationRequestStatus` y `ConfirmationResponseStatus` en `backend/prisma/schema.prisma`
- [x] 1.2 Agregar modelo `BudgetConfirmationRequest` en `backend/prisma/schema.prisma` con campos: id, budgetId, requestedById, type, status, createdAt, updatedAt y relaciones a Budget y User
- [x] 1.3 Agregar modelo `BudgetConfirmationResponse` en `backend/prisma/schema.prisma` con campos: id, requestId, userId, status, confirmedAt, createdAt, updatedAt y relaciones a BudgetConfirmationRequest y User
- [x] 1.4 Agregar relaciones `confirmationRequests` y `confirmationResponses` al modelo `User` existente
- [x] 1.5 Agregar relación `confirmationRequests` al modelo `Budget` existente
- [ ] 1.6 Ejecutar `npx prisma migrate dev --name add_budget_confirmation` para crear la migración

## Tarea 2: Código de Menú y Permisos
- [x] 2.1 Agregar `BUDGET_CONFIRMATION: 'budget-confirmation'` en `backend/src/constants/menuCodes.ts`
- [x] 2.2 Agregar el permiso `budget-confirmation` con tipos VIEW y MODIFY al rol de administrador en el seed o script de actualización de permisos

## Tarea 3: Servicio Backend
- [x] 3.1 Crear `backend/src/services/BudgetConfirmationService.ts` con constructor que recibe PrismaClient
- [x] 3.2 Implementar método `createMassiveRequest(budgetId, requestedById)`: buscar usuarios con líneas asignadas en el presupuesto, crear BudgetConfirmationRequest con type="MASSIVE" y BudgetConfirmationResponse para cada usuario
- [x] 3.3 Implementar método `createIndividualRequest(budgetId, userId, requestedById)`: verificar que no exista solicitud pendiente, crear BudgetConfirmationRequest con type="INDIVIDUAL" y una BudgetConfirmationResponse
- [x] 3.4 Implementar método `getAllRequests(budgetId?)`: listar solicitudes con count de confirmados/pendientes usando `_count` de Prisma
- [x] 3.5 Implementar método `getRequestDetail(requestId)`: obtener solicitud con todas las respuestas incluyendo datos del usuario
- [x] 3.6 Implementar método `confirmResponse(requestId, userId)`: buscar respuesta por requestId+userId, verificar estado PENDING, actualizar a CONFIRMED con confirmedAt
- [x] 3.7 Implementar método `getMyPending(userId)`: obtener respuestas con status PENDING del usuario, incluyendo datos de la solicitud
- [x] 3.8 Implementar método `getPendingCount(userId)`: retornar count de respuestas PENDING del usuario

## Tarea 4: Rutas API
- [x] 4.1 Crear `backend/src/routes/budgetConfirmationRoutes.ts` con función `budgetConfirmationRouter(prisma)` siguiendo el patrón de `changeRequestRoutes.ts`
- [x] 4.2 Implementar POST `/` con permiso `budget-confirmation:MODIFY` para crear solicitud (masiva o individual según body.type)
- [x] 4.3 Implementar GET `/` con permiso `budget-confirmation:VIEW` para listar solicitudes
- [x] 4.4 Implementar GET `/my-pending` (autenticado, sin permiso especial) para obtener pendientes del usuario
- [x] 4.5 Implementar GET `/pending-count` (autenticado, sin permiso especial) para obtener count de pendientes
- [x] 4.6 Implementar GET `/:id` con permiso `budget-confirmation:VIEW` para detalle de solicitud
- [x] 4.7 Implementar POST `/:id/confirm` (autenticado, sin permiso especial) para confirmar respuesta
- [x] 4.8 Registrar la ruta en `backend/src/index.ts`: importar `budgetConfirmationRouter` y agregar `app.use('/api/budget-confirmations', budgetConfirmationRouter(prisma))`

## Tarea 5: Frontend — Tipos y API Client
- [x] 5.1 Agregar interfaces `BudgetConfirmationRequest` y `BudgetConfirmationResponse` en `frontend/src/types/index.ts`
- [x] 5.2 Agregar objeto `budgetConfirmationApi` en `frontend/src/services/api.ts` con métodos: create, getAll, getDetail, confirm, getMyPending, getPendingCount

## Tarea 6: Frontend — Panel de Administrador en BudgetsPage
- [x] 6.1 Agregar estado y lógica en `BudgetsPage.tsx` para cargar solicitudes de confirmación y lista de usuarios con líneas asignadas (solo si `hasPermission('budget-confirmation', 'MODIFY')`)
- [x] 6.2 Agregar sección colapsable "Confirmación de Presupuesto" en BudgetsPage con botón "Solicitar Confirmación Masiva" y lista de usuarios con botón "Solicitar" individual
- [x] 6.3 Agregar tabla de solicitudes existentes mostrando ID corto, fecha, tipo, progreso (confirmados/total)
- [x] 6.4 Agregar modal de detalle de solicitud que muestra lista de usuarios con estado y fecha de confirmación

## Tarea 7: Frontend — Flujo de Confirmación del Usuario
- [x] 7.1 Agregar lógica en `BudgetsPage.tsx` para consultar `budgetConfirmationApi.getMyPending()` al montar el componente
- [x] 7.2 Agregar banner amarillo de confirmación pendiente con botón "Confirmar Presupuesto" cuando hay pendientes
- [x] 7.3 Implementar Popup de Declaración con texto "Declaro que todas mis líneas de presupuesto están correctas" y botones Confirmar/Cancelar
- [x] 7.4 Implementar lógica de confirmación: llamar `budgetConfirmationApi.confirm(requestId)` para cada pendiente, mostrar toast de éxito, recargar estado

## Tarea 8: Frontend — Popup Recordatorio y Notificaciones
- [x] 8.1 Implementar popup recordatorio al montar BudgetsPage: mostrar modal si hay pendientes y no se ha mostrado en la sesión (usar `sessionStorage`)
- [x] 8.2 Agregar consulta de `budgetConfirmationApi.getPendingCount()` en `TopBar.tsx` con polling cada 30 segundos, mostrar badge si count > 0
- [x] 8.3 Agregar navegación a `/budgets` al hacer clic en el badge de confirmaciones pendientes en TopBar

## Tarea 9: Traducciones i18n
- [x] 9.1 Agregar todas las claves de traducción de `budgetConfirmation.*` en el seed de traducciones o directamente en la tabla Translation (ES y EN)
