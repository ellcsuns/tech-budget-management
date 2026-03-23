# Documento de Diseño — Confirmación de Presupuesto

## Resumen

Este documento describe el diseño técnico del sistema de confirmación de presupuesto para InvestIQ. Incluye nuevos modelos Prisma, un servicio backend, rutas API REST, y componentes frontend React con Tailwind CSS.

## Arquitectura

El feature sigue la arquitectura existente de InvestIQ:
- **Backend**: Express + Prisma ORM + PostgreSQL
- **Frontend**: React + TypeScript + Tailwind CSS + Vite
- **Auth**: JWT con middleware `authenticateJWT` y `requirePermission`
- **i18n**: Traducciones vía `I18nContext` y tabla `Translation`

---

## 1. Modelo de Datos (Prisma)

### 1.1 Nuevos modelos en `schema.prisma`

```prisma
// Estado de la solicitud de confirmación
enum ConfirmationRequestStatus {
  OPEN
  CLOSED
}

// Estado de la respuesta individual
enum ConfirmationResponseStatus {
  PENDING
  CONFIRMED
}

// Solicitud de confirmación de presupuesto (creada por admin)
model BudgetConfirmationRequest {
  id          String                        @id @default(uuid())
  budgetId    String
  budget      Budget                        @relation(fields: [budgetId], references: [id], onDelete: Cascade)
  requestedById String
  requestedBy User                          @relation("ConfirmationRequester", fields: [requestedById], references: [id])
  type        String                        // "MASSIVE" o "INDIVIDUAL"
  status      ConfirmationRequestStatus     @default(OPEN)
  responses   BudgetConfirmationResponse[]
  createdAt   DateTime                      @default(now())
  updatedAt   DateTime                      @updatedAt

  @@index([budgetId])
  @@index([requestedById])
  @@index([status])
}

// Respuesta individual de un usuario a una solicitud
model BudgetConfirmationResponse {
  id          String                        @id @default(uuid())
  requestId   String
  request     BudgetConfirmationRequest     @relation(fields: [requestId], references: [id], onDelete: Cascade)
  userId      String
  user        User                          @relation("ConfirmationResponder", fields: [userId], references: [id])
  status      ConfirmationResponseStatus    @default(PENDING)
  confirmedAt DateTime?
  createdAt   DateTime                      @default(now())
  updatedAt   DateTime                      @updatedAt

  @@unique([requestId, userId])
  @@index([requestId])
  @@index([userId])
  @@index([status])
}
```

### 1.2 Relaciones en modelos existentes

Agregar al modelo `User`:
```prisma
confirmationRequests   BudgetConfirmationRequest[]  @relation("ConfirmationRequester")
confirmationResponses  BudgetConfirmationResponse[] @relation("ConfirmationResponder")
```

Agregar al modelo `Budget`:
```prisma
confirmationRequests   BudgetConfirmationRequest[]
```

### 1.3 Nuevo código de menú

Agregar en `menuCodes.ts`:
```typescript
BUDGET_CONFIRMATION: 'budget-confirmation'
```

---

## 2. Backend — Servicio

### 2.1 `BudgetConfirmationService` (`backend/src/services/BudgetConfirmationService.ts`)

Métodos principales:

```typescript
class BudgetConfirmationService {
  constructor(private prisma: PrismaClient) {}

  // Crear solicitud masiva: busca todos los usuarios con líneas en el presupuesto activo
  async createMassiveRequest(budgetId: string, requestedById: string): Promise<BudgetConfirmationRequest>

  // Crear solicitud individual para un usuario específico
  async createIndividualRequest(budgetId: string, userId: string, requestedById: string): Promise<BudgetConfirmationRequest>

  // Listar todas las solicitudes con estadísticas (count confirmed/pending)
  async getAllRequests(budgetId?: string): Promise<RequestWithStats[]>

  // Detalle de una solicitud con todas las respuestas
  async getRequestDetail(requestId: string): Promise<RequestDetail>

  // Confirmar: el usuario marca su respuesta como CONFIRMED
  async confirmResponse(requestId: string, userId: string): Promise<BudgetConfirmationResponse>

  // Obtener confirmaciones pendientes del usuario
  async getMyPending(userId: string): Promise<BudgetConfirmationResponse[]>

  // Obtener count de pendientes del usuario
  async getPendingCount(userId: string): Promise<number>
}
```

**Lógica de `createMassiveRequest`:**
1. Obtener todas las `BudgetLine` del presupuesto dado
2. Extraer los `userAreas` de cada `Expense` asociada
3. Buscar usuarios cuyo `technologyDirectionId` o áreas coincidan con las líneas (se usa la relación existente de `Expense.userAreas`)
4. Crear `BudgetConfirmationRequest` con type="MASSIVE"
5. Crear `BudgetConfirmationResponse` para cada usuario único encontrado

**Lógica de `createIndividualRequest`:**
1. Verificar que no exista una solicitud PENDING para ese usuario en ese presupuesto
2. Crear `BudgetConfirmationRequest` con type="INDIVIDUAL"
3. Crear una única `BudgetConfirmationResponse` para el usuario

**Lógica de `confirmResponse`:**
1. Buscar la `BudgetConfirmationResponse` por requestId + userId
2. Verificar que esté en estado PENDING
3. Actualizar a CONFIRMED con `confirmedAt = now()`

---

## 3. Backend — Rutas API

### 3.1 `budgetConfirmationRoutes.ts` (`backend/src/routes/budgetConfirmationRoutes.ts`)

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| POST | `/api/budget-confirmations` | `budget-confirmation:MODIFY` | Crear solicitud (body: `{ budgetId, type, userId? }`) |
| GET | `/api/budget-confirmations` | `budget-confirmation:VIEW` | Listar solicitudes con stats |
| GET | `/api/budget-confirmations/my-pending` | Autenticado | Pendientes del usuario |
| GET | `/api/budget-confirmations/pending-count` | Autenticado | Count de pendientes |
| GET | `/api/budget-confirmations/:id` | `budget-confirmation:VIEW` | Detalle de solicitud |
| POST | `/api/budget-confirmations/:id/confirm` | Autenticado | Confirmar respuesta |

**Patrón de ruta** (igual que `changeRequestRoutes.ts`):
```typescript
export function budgetConfirmationRouter(prisma: PrismaClient) {
  const router = Router();
  const service = new BudgetConfirmationService(prisma);
  // ... setup auth middleware igual que changeRequestRoutes
  // ... definir rutas
  return router;
}
```

### 3.2 Registro en `index.ts`

```typescript
import { budgetConfirmationRouter } from './routes/budgetConfirmationRoutes';
// ...
app.use('/api/budget-confirmations', budgetConfirmationRouter(prisma));
```

---

## 4. Frontend — API Client

### 4.1 Agregar en `api.ts`

```typescript
export const budgetConfirmationApi = {
  create: (data: { budgetId: string; type: 'MASSIVE' | 'INDIVIDUAL'; userId?: string }) =>
    api.post('/budget-confirmations', data),
  getAll: (budgetId?: string) => {
    const params = budgetId ? `?budgetId=${budgetId}` : '';
    return api.get(`/budget-confirmations${params}`);
  },
  getDetail: (id: string) => api.get(`/budget-confirmations/${id}`),
  confirm: (id: string) => api.post(`/budget-confirmations/${id}/confirm`),
  getMyPending: () => api.get('/budget-confirmations/my-pending'),
  getPendingCount: () => api.get<{ count: number }>('/budget-confirmations/pending-count'),
};
```

### 4.2 Tipos en `frontend/src/types/index.ts`

```typescript
export interface BudgetConfirmationRequest {
  id: string;
  budgetId: string;
  requestedById: string;
  requestedBy?: { id: string; fullName: string };
  type: 'MASSIVE' | 'INDIVIDUAL';
  status: 'OPEN' | 'CLOSED';
  responses?: BudgetConfirmationResponse[];
  confirmedCount?: number;
  pendingCount?: number;
  totalCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetConfirmationResponse {
  id: string;
  requestId: string;
  userId: string;
  user?: { id: string; fullName: string; username: string };
  status: 'PENDING' | 'CONFIRMED';
  confirmedAt?: string;
  createdAt: string;
}
```

---

## 5. Frontend — Componentes

### 5.1 Panel de Confirmación del Administrador (dentro de `BudgetsPage.tsx`)

Se agrega una sección colapsable al final de `BudgetsPage` visible solo si `hasPermission('budget-confirmation', 'MODIFY')`:

- **Botón "Solicitar Confirmación Masiva"**: Llama a `budgetConfirmationApi.create({ budgetId, type: 'MASSIVE' })`
- **Lista de usuarios con líneas asignadas**: Cada fila tiene botón "Solicitar" que llama a `budgetConfirmationApi.create({ budgetId, type: 'INDIVIDUAL', userId })`
- **Tabla de solicitudes existentes**: Muestra ID corto, fecha, tipo, progreso (X/Y confirmados). Click abre detalle.
- **Detalle de solicitud**: Modal con tabla de usuarios, estado, fecha de confirmación.

### 5.2 Banner de Confirmación Pendiente (Usuario)

En `BudgetsPage`, al cargar, se consulta `budgetConfirmationApi.getMyPending()`. Si hay pendientes:
- Se muestra un banner amarillo en la parte superior: "Tienes X confirmación(es) de presupuesto pendiente(s)"
- Botón "Confirmar Presupuesto" que abre el Popup_de_Declaración

### 5.3 Popup de Declaración

Modal con:
- Texto: "Declaro que todas mis líneas de presupuesto están correctas"
- Botón "Confirmar" → llama `budgetConfirmationApi.confirm(requestId)` para cada pendiente
- Botón "Cancelar" → cierra el modal

### 5.4 Popup Recordatorio al Entrar

Al montar `BudgetsPage`, si hay pendientes y no se ha mostrado en esta sesión (`sessionStorage`):
- Modal: "Tienes una solicitud de confirmación de presupuesto pendiente. ¿Deseas confirmar ahora?"
- Botón "Ir a Confirmar" → abre flujo de confirmación
- Botón "Recordar más tarde" → cierra y marca en `sessionStorage`

### 5.5 Badge en TopBar

En `TopBar.tsx`, agregar consulta a `budgetConfirmationApi.getPendingCount()` junto al polling existente de `changeRequestApi.getPendingCount()`. Mostrar badge adicional con ícono de check/documento si count > 0. Click navega a `/budgets`.

---

## 6. Traducciones i18n

Claves a agregar en la tabla `Translation`:

| Clave | ES | EN |
|-------|----|----|
| `budgetConfirmation.title` | Confirmación de Presupuesto | Budget Confirmation |
| `budgetConfirmation.requestMassive` | Solicitar Confirmación Masiva | Request Massive Confirmation |
| `budgetConfirmation.requestIndividual` | Solicitar | Request |
| `budgetConfirmation.pendingBanner` | Tienes confirmaciones de presupuesto pendientes | You have pending budget confirmations |
| `budgetConfirmation.declarationText` | Declaro que todas mis líneas de presupuesto están correctas | I declare that all my budget lines are correct |
| `budgetConfirmation.confirm` | Confirmar | Confirm |
| `budgetConfirmation.cancel` | Cancelar | Cancel |
| `budgetConfirmation.reminderTitle` | Confirmación Pendiente | Pending Confirmation |
| `budgetConfirmation.reminderText` | Tienes una solicitud de confirmación de presupuesto pendiente | You have a pending budget confirmation request |
| `budgetConfirmation.goConfirm` | Ir a Confirmar | Go to Confirm |
| `budgetConfirmation.remindLater` | Recordar más tarde | Remind me later |
| `budgetConfirmation.confirmed` | Confirmado | Confirmed |
| `budgetConfirmation.pending` | Pendiente | Pending |
| `budgetConfirmation.massive` | Masiva | Massive |
| `budgetConfirmation.individual` | Individual | Individual |
| `budgetConfirmation.progress` | Progreso | Progress |
| `budgetConfirmation.requestDate` | Fecha de Solicitud | Request Date |
| `budgetConfirmation.confirmedAt` | Confirmado el | Confirmed at |
| `budgetConfirmation.noRequests` | No hay solicitudes de confirmación | No confirmation requests |
| `budgetConfirmation.alreadyPending` | Ya existe una solicitud pendiente para este usuario | A pending request already exists for this user |
| `budgetConfirmation.success` | Confirmación registrada exitosamente | Confirmation registered successfully |
| `budgetConfirmation.requestCreated` | Solicitud de confirmación creada | Confirmation request created |
| `budgetConfirmation.usersWithLines` | Usuarios con líneas asignadas | Users with assigned lines |
| `budgetConfirmation.detail` | Detalle de Solicitud | Request Detail |

---

## 7. Migración de Base de Datos

Ejecutar `npx prisma migrate dev --name add_budget_confirmation` después de actualizar el schema.

---

## 8. Diagrama de Flujo

```
Administrador                          Sistema                         Usuario
    |                                     |                               |
    |-- Solicitar Confirmación ---------->|                               |
    |                                     |-- Crear Request + Responses ->|
    |                                     |-- (badge en TopBar) --------->|
    |                                     |                               |
    |                                     |<-- Ingresa a Presupuestos ----|
    |                                     |-- Popup Recordatorio -------->|
    |                                     |                               |
    |                                     |<-- Presiona "Confirmar" ------|
    |                                     |-- Popup Declaración --------->|
    |                                     |                               |
    |                                     |<-- Confirma Declaración ------|
    |                                     |-- Actualiza Response -------->|
    |                                     |                               |
    |<-- Ver tracking actualizado --------|                               |
```
