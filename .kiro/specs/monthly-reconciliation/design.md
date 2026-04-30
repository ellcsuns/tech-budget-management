# Design Document: Monthly Reconciliation

## Overview

The Monthly Reconciliation module adds a new section to InvestIQ where users reconcile their budget execution against actual spending at the end of each month. The system computes planned vs actual per budget line per month, and guides users through corrective actions (confirm savings, redistribute under-execution, or adjust forecasts for over-execution). All adjustments integrate with the existing change request and savings systems. A new Prisma model (`MonthlyReconciliation`) stores reconciliation decisions, and a tracking layer monitors compliance.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  ┌──────────────────┐  ┌──────────────────────────────────┐ │
│  │  Sidebar          │  │  ReconciliationPage               │ │
│  │  (new menu item)  │  │  ├─ ReminderBanner               │ │
│  │                   │  │  ├─ ReconciliationSummaryTable    │ │
│  │                   │  │  ├─ UnderExecutionDialog          │ │
│  │                   │  │  ├─ OverExecutionDialog           │ │
│  │                   │  │  ├─ ReconciliationHistory         │ │
│  │                   │  │  └─ AdminTrackingMatrix           │ │
│  └──────────────────┘  └──────────────────────────────────┘ │
└─────────────────────────────┬───────────────────────────────┘
                              │ HTTP (axios)
┌─────────────────────────────▼───────────────────────────────┐
│                   Backend (Express)                           │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  reconciliationRoutes.ts                                  ││
│  │  POST /api/reconciliations/saving                         ││
│  │  POST /api/reconciliations/redistribution                 ││
│  │  POST /api/reconciliations/adjustment                     ││
│  │  GET  /api/reconciliations/summary                        ││
│  │  GET  /api/reconciliations/status                         ││
│  │  GET  /api/reconciliations/history/:budgetLineId          ││
│  │  GET  /api/reconciliations/tracking                       ││
│  │  GET  /api/reconciliations/pending-count                  ││
│  └──────────────────────┬───────────────────────────────────┘│
│  ┌──────────────────────▼───────────────────────────────────┐│
│  │  ReconciliationService.ts                                 ││
│  │  ├─ getReconciliationSummary(userId, budgetId)            ││
│  │  ├─ confirmSaving(userId, budgetLineId, month)            ││
│  │  ├─ redistributeUnderExecution(userId, budgetLineId, ...) ││
│  │  ├─ adjustOverExecution(userId, budgetLineId, ...)        ││
│  │  ├─ getUserStatus(userId, budgetId)                       ││
│  │  ├─ getTrackingMatrix(budgetId)                           ││
│  │  ├─ getHistory(budgetLineId)                              ││
│  │  └─ getPendingCount(userId)                               ││
│  └──────────────────────┬───────────────────────────────────┘│
│                         │                                     │
│  ┌──────────────────────▼───────────────────────────────────┐│
│  │  Existing Services                                        ││
│  │  ├─ SavingService (create savings)                        ││
│  │  ├─ ChangeRequestService (create change requests)         ││
│  │  └─ AuditService (log actions)                            ││
│  └──────────────────────────────────────────────────────────┘│
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  PostgreSQL (Prisma)                                         │
│  ├─ MonthlyReconciliation (new model)                        │
│  ├─ BudgetLine (existing, read)                              │
│  ├─ Transaction (existing, read)                             │
│  ├─ Saving (existing, create via SavingService)              │
│  ├─ BudgetLineChangeRequest (existing, create via service)   │
│  └─ AuditLog (existing, write via AuditService)              │
└─────────────────────────────────────────────────────────────┘
```

## Database Design

### New Model: MonthlyReconciliation

Add to `backend/prisma/schema.prisma`:

```prisma
// ============================================
// Monthly Reconciliation Module
// ============================================

enum ReconciliationDecisionType {
  SAVING
  REDISTRIBUTION
  ADJUSTMENT
}

model MonthlyReconciliation {
  id                  String                       @id @default(uuid())
  budgetLineId        String
  budgetLine          BudgetLine                   @relation(fields: [budgetLineId], references: [id], onDelete: Cascade)
  userId              String
  user                User                         @relation("ReconciliationUser", fields: [userId], references: [id])
  month               Int                          // 1-12
  year                Int
  decisionType        ReconciliationDecisionType
  plannedAmount       Decimal                      @db.Decimal(15, 2)
  actualAmount        Decimal                      @db.Decimal(15, 2)
  differenceAmount    Decimal                      @db.Decimal(15, 2)
  details             Json                         // redistribution/adjustment breakdown
  changeRequestId     String?                      // cross-reference to BudgetLineChangeRequest
  savingId            String?                      // cross-reference to Saving
  createdAt           DateTime                     @default(now())

  @@unique([budgetLineId, month, year])
  @@index([userId])
  @@index([budgetLineId])
  @@index([month, year])
}
```

### Schema Changes to Existing Models

Add relation to `BudgetLine`:
```prisma
// Add to BudgetLine model
reconciliations     MonthlyReconciliation[]
```

Add relation to `User`:
```prisma
// Add to User model
reconciliations     MonthlyReconciliation[] @relation("ReconciliationUser")
```

### Migration Notes

- Run `npx prisma migrate dev --name add-monthly-reconciliation` after schema changes
- The `@@unique([budgetLineId, month, year])` constraint ensures one reconciliation per budget line per month per year
- The `details` JSON field stores redistribution breakdowns (e.g., `{ "M7": 5000, "M8": 3000 }`) or adjustment details

## API Design

### Route File: `backend/src/routes/reconciliationRoutes.ts`

All routes are protected by `authenticateJWT` and `requirePermission('monthly-reconciliation', ...)`.

#### GET /api/reconciliations/summary

Returns the reconciliation summary for the current user's assigned budget lines.

**Query Parameters:**
- `budgetId` (optional): Budget ID. Defaults to active budget.

**Response (200):**
```json
{
  "budgetId": "uuid",
  "currentMonth": 6,
  "lines": [
    {
      "budgetLineId": "uuid",
      "expenseCode": "EXP-001",
      "expenseDescription": "Cloud Infrastructure",
      "financialCompany": "ACME Corp",
      "currency": "USD",
      "months": [
        {
          "month": 1,
          "planned": 10000,
          "actual": 9500,
          "difference": 500,
          "isClosed": true,
          "isReconciled": true,
          "reconciliation": {
            "id": "uuid",
            "decisionType": "SAVING",
            "createdAt": "2025-01-31T..."
          }
        }
      ]
    }
  ]
}
```

**Logic:**
1. Get active budget (or specified budgetId)
2. Get budget lines for user's technology direction
3. For each line, compute planned (using computed values from approved change requests and savings) and actual (sum of REAL transactions) per month
4. Determine closed months (month < current month)
5. Check for existing reconciliation records

#### POST /api/reconciliations/saving

Confirms an under-execution as a saving.

**Request Body:**
```json
{
  "budgetLineId": "uuid",
  "month": 3,
  "amount": 1500.00
}
```

**Response (201):**
```json
{
  "reconciliation": { "id": "uuid", "decisionType": "SAVING", ... },
  "saving": { "id": "uuid", "status": "PENDING", ... }
}
```

**Logic:**
1. Validate the month is closed
2. Compute under-execution amount for the budget line and month
3. Validate `amount` matches the under-execution (or is <= under-execution if partial savings are allowed)
4. Call `SavingService.createSaving()` with the amount in the corresponding savingMX field
5. Create `MonthlyReconciliation` record with `decisionType: SAVING` and `savingId`
6. Log to AuditLog with entity "RECONCILIATION"

#### POST /api/reconciliations/redistribution

Redistributes under-execution across future months.

**Request Body:**
```json
{
  "budgetLineId": "uuid",
  "month": 3,
  "distribution": {
    "4": 500,
    "5": 300,
    "6": 700
  }
}
```

**Response (201):**
```json
{
  "reconciliation": { "id": "uuid", "decisionType": "REDISTRIBUTION", ... },
  "changeRequest": { "id": "uuid", "status": "PENDING", ... }
}
```

**Logic:**
1. Validate the month is closed
2. Compute under-execution amount
3. Validate sum of distribution values equals the under-execution amount
4. Validate all distribution months are future months (> reconciled month)
5. Compute new annual total: original plan + redistributions. Validate it does not exceed original annual allocation
6. Build proposed plan values (current + distribution additions)
7. Call `ChangeRequestService.createChangeRequest()` with proposed values and auto-generated comment
8. Create `MonthlyReconciliation` record with `decisionType: REDISTRIBUTION` and `changeRequestId`
9. Log to AuditLog

#### POST /api/reconciliations/adjustment

Adjusts future forecasts to compensate for over-execution.

**Request Body:**
```json
{
  "budgetLineId": "uuid",
  "month": 3,
  "reductions": {
    "4": 200,
    "5": 300,
    "6": 500
  }
}
```

**Response (201):**
```json
{
  "reconciliation": { "id": "uuid", "decisionType": "ADJUSTMENT", ... },
  "changeRequest": { "id": "uuid", "status": "PENDING", ... }
}
```

**Logic:**
1. Validate the month is closed
2. Compute over-execution amount
3. Validate total reductions >= over-execution amount
4. Validate no future month's planned amount goes below zero after reduction
5. Build proposed plan values (current - reductions)
6. Call `ChangeRequestService.createChangeRequest()` with proposed values and auto-generated comment
7. Create `MonthlyReconciliation` record with `decisionType: ADJUSTMENT` and `changeRequestId`
8. Log to AuditLog

#### GET /api/reconciliations/status

Returns the current user's reconciliation completion status per month.

**Response (200):**
```json
{
  "months": [
    { "month": 1, "year": 2025, "totalLines": 5, "reconciledLines": 5, "isComplete": true },
    { "month": 2, "year": 2025, "totalLines": 5, "reconciledLines": 3, "isComplete": false }
  ]
}
```

#### GET /api/reconciliations/history/:budgetLineId

Returns reconciliation history for a specific budget line.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "month": 1,
    "year": 2025,
    "decisionType": "SAVING",
    "plannedAmount": 10000,
    "actualAmount": 9500,
    "differenceAmount": 500,
    "details": {},
    "changeRequestId": null,
    "savingId": "uuid",
    "user": { "id": "uuid", "fullName": "John Doe" },
    "createdAt": "2025-01-31T..."
  }
]
```

#### GET /api/reconciliations/tracking

Returns the admin tracking matrix (requires MODIFY permission).

**Response (200):**
```json
{
  "users": [
    {
      "userId": "uuid",
      "fullName": "John Doe",
      "technologyDirection": "IT",
      "months": [
        { "month": 1, "isComplete": true, "reconciledAt": "2025-01-31T..." },
        { "month": 2, "isComplete": false, "reconciledAt": null }
      ]
    }
  ]
}
```

#### GET /api/reconciliations/pending-count

Returns the count of pending reconciliation months for the current user (used by sidebar badge).

**Response (200):**
```json
{ "count": 2 }
```

## Service Layer Design

### File: `backend/src/services/ReconciliationService.ts`

```typescript
export class ReconciliationService {
  constructor(
    private prisma: PrismaClient,
    private savingService: SavingService,
    private changeRequestService: ChangeRequestService
  ) {}

  // Core computation: get planned vs actual for a budget line and month
  private async computeMonthlyExecution(budgetLineId: string, month: number): Promise<{
    planned: number;
    actual: number;
    difference: number;
  }>

  // Get full summary for user's assigned lines
  async getReconciliationSummary(userId: string, budgetId?: string): Promise<ReconciliationSummary>

  // Confirm saving for under-execution
  async confirmSaving(userId: string, budgetLineId: string, month: number, amount: number): Promise<{
    reconciliation: MonthlyReconciliation;
    saving: Saving;
  }>

  // Redistribute under-execution to future months
  async redistributeUnderExecution(
    userId: string,
    budgetLineId: string,
    month: number,
    distribution: Record<number, number>
  ): Promise<{
    reconciliation: MonthlyReconciliation;
    changeRequest: BudgetLineChangeRequest;
  }>

  // Adjust forecast for over-execution
  async adjustOverExecution(
    userId: string,
    budgetLineId: string,
    month: number,
    reductions: Record<number, number>
  ): Promise<{
    reconciliation: MonthlyReconciliation;
    changeRequest: BudgetLineChangeRequest;
  }>

  // Get user's completion status per month
  async getUserStatus(userId: string, budgetId?: string): Promise<MonthStatus[]>

  // Get admin tracking matrix
  async getTrackingMatrix(budgetId?: string): Promise<UserTrackingRow[]>

  // Get history for a budget line
  async getHistory(budgetLineId: string): Promise<MonthlyReconciliation[]>

  // Get pending count for sidebar badge
  async getPendingCount(userId: string): Promise<number>
}
```

### Key Computation: `computeMonthlyExecution`

This method computes the planned vs actual for a budget line and month:

1. **Planned Amount**: Start with `planMX` base value, then apply approved change request overlays and subtract active savings for that month. This mirrors the existing `getComputed` logic in `BudgetService`.
2. **Actual Amount**: Sum all REAL-type transactions for the budget line where `month = X`.
3. **Difference**: `planned - actual`. Positive = under-execution, negative = over-execution.

### Validation Rules

**For `confirmSaving`:**
- Month must be closed (< current month)
- Budget line must not already have a reconciliation for this month
- Amount must equal the under-execution difference
- Delegates to `SavingService.createSaving()` which validates saving doesn't exceed budget

**For `redistributeUnderExecution`:**
- Month must be closed
- Budget line must not already have a reconciliation for this month
- Sum of distribution values must equal the under-execution amount
- All target months must be > reconciled month and <= 12
- New annual total (sum of all planMX + distribution additions) must not exceed original annual allocation
- Delegates to `ChangeRequestService.createChangeRequest()`

**For `adjustOverExecution`:**
- Month must be closed
- Budget line must not already have a reconciliation for this month
- Total reductions must >= over-execution amount
- No future month's planned value can go below zero after reduction
- Delegates to `ChangeRequestService.createChangeRequest()`

## Frontend Design

### New Page: `frontend/src/pages/ReconciliationPage.tsx`

Main page component that orchestrates the reconciliation workflow.

**State:**
- `summary`: ReconciliationSummary from API
- `userStatus`: MonthStatus[] for the reminder banner
- `selectedMonth`: number | null — the month being reconciled
- `selectedLine`: BudgetLineSummary | null — the line being acted on
- `showSavingDialog`: boolean
- `showRedistributionDialog`: boolean
- `showAdjustmentDialog`: boolean
- `showHistory`: boolean
- `showAdminTracking`: boolean

**Layout:**
1. **ReminderBanner** at top (if pending months exist)
2. **Month selector tabs** for closed months
3. **ReconciliationSummaryTable** showing all lines for selected month
4. **Action dialogs** (modals) for saving/redistribution/adjustment
5. **ReconciliationHistory** panel (expandable per line)
6. **AdminTrackingMatrix** (visible to users with MODIFY permission)

### Component: `ReminderBanner`

Displays pending reconciliation months. Shows count and specific month names. Disappears when all months are reconciled.

### Component: `ReconciliationSummaryTable`

Table with columns:
- Expense Code | Description | Financial Company | Currency
- Planned | Actual | Difference (for selected month)
- Status badge (Reconciled / Pending)
- Action button (Reconcile)

Rows are grouped with subtotals. Under-execution cells highlighted in amber, over-execution in red.

### Component: `UnderExecutionDialog`

Modal dialog for handling under-execution:
1. Shows the under-execution amount
2. Two options: "Confirmar Ahorro" / "Redistribuir"
3. If saving: confirmation button → calls POST /api/reconciliations/saving
4. If redistribution: shows future months with input fields for amounts, validates sum = under-execution, validates annual total → calls POST /api/reconciliations/redistribution

### Component: `OverExecutionDialog`

Modal dialog for handling over-execution:
1. Shows the over-execution amount
2. Shows future months with current planned amounts
3. Input fields to enter reduction per month
4. Validates total reduction >= over-execution and no month goes below zero
5. Calls POST /api/reconciliations/adjustment

### Component: `ReconciliationHistory`

Expandable panel per budget line showing past reconciliation records with decision type, amounts, user, and timestamp.

### Component: `AdminTrackingMatrix`

Table with users as rows and months as columns. Each cell shows a green check (complete) or red X (pending). Only visible to users with MODIFY permission on the monthly-reconciliation menu code.

## Integration Points

### Menu Code Registration

Add to `backend/src/constants/menuCodes.ts`:
```typescript
MONTHLY_RECONCILIATION: 'monthly-reconciliation'
```

### Sidebar Integration

Add to `frontend/src/components/Sidebar.tsx` menuItems array:
```typescript
{
  path: '/reconciliation',
  labelKey: 'menu.reconciliation',
  fallback: 'Conciliación Mensual',
  icon: HiOutlineClipboardDocumentCheck, // from react-icons/hi2
  menuCode: 'monthly-reconciliation'
}
```

Place it after the "Approvals" item and before the "Expenses" item in the main section.

### Route Registration

Add to `frontend/src/App.tsx`:
```tsx
<Route path="/reconciliation"
  element={
    <ProtectedRoute menuCode="monthly-reconciliation" permissionType="VIEW">
      <Layout><ReconciliationPage /></Layout>
    </ProtectedRoute>
  }
/>
```

Add to `backend/src/index.ts`:
```typescript
import { reconciliationRouter } from './routes/reconciliationRoutes';
// ...
app.use('/api/reconciliations', reconciliationRouter(prisma));
```

### Frontend API Client

Add to `frontend/src/services/api.ts`:
```typescript
export const reconciliationApi = {
  getSummary: (budgetId?: string) => {
    const params = budgetId ? `?budgetId=${budgetId}` : '';
    return api.get(`/reconciliations/summary${params}`);
  },
  confirmSaving: (data: { budgetLineId: string; month: number; amount: number }) =>
    api.post('/reconciliations/saving', data),
  redistribute: (data: { budgetLineId: string; month: number; distribution: Record<number, number> }) =>
    api.post('/reconciliations/redistribution', data),
  adjust: (data: { budgetLineId: string; month: number; reductions: Record<number, number> }) =>
    api.post('/reconciliations/adjustment', data),
  getStatus: () => api.get('/reconciliations/status'),
  getHistory: (budgetLineId: string) => api.get(`/reconciliations/history/${budgetLineId}`),
  getTracking: () => api.get('/reconciliations/tracking'),
  getPendingCount: () => api.get<{ count: number }>('/reconciliations/pending-count'),
};
```

### Translations

Add to `backend/src/seedTranslations.ts` with category "reconciliation":

| Key | ES | EN |
|-----|----|----|
| menu.reconciliation | Conciliación Mensual | Monthly Reconciliation |
| reconciliation.title | Conciliación Mensual | Monthly Reconciliation |
| reconciliation.summary | Resumen de Ejecución | Execution Summary |
| reconciliation.planned | Planificado | Planned |
| reconciliation.actual | Real | Actual |
| reconciliation.difference | Diferencia | Difference |
| reconciliation.underExecution | Sub-ejecución | Under-execution |
| reconciliation.overExecution | Sobre-ejecución | Over-execution |
| reconciliation.confirmSaving | Confirmar Ahorro | Confirm Saving |
| reconciliation.redistribute | Redistribuir | Redistribute |
| reconciliation.adjust | Ajustar Previsión | Adjust Forecast |
| reconciliation.reconciled | Conciliado | Reconciled |
| reconciliation.pending | Pendiente | Pending |
| reconciliation.reminderTitle | Conciliaciones Pendientes | Pending Reconciliations |
| reconciliation.reminderMessage | Tienes {count} mes(es) pendiente(s) de conciliar | You have {count} pending month(s) to reconcile |
| reconciliation.history | Historial de Conciliación | Reconciliation History |
| reconciliation.tracking | Seguimiento de Conciliación | Reconciliation Tracking |
| reconciliation.savingConfirmed | Ahorro confirmado exitosamente | Saving confirmed successfully |
| reconciliation.redistributionCreated | Redistribución enviada para aprobación | Redistribution submitted for approval |
| reconciliation.adjustmentCreated | Ajuste enviado para aprobación | Adjustment submitted for approval |
| reconciliation.noFutureMonths | No hay meses futuros disponibles | No future months available |
| reconciliation.sumMismatch | La suma de la distribución debe ser igual a la diferencia | Distribution sum must equal the difference |
| reconciliation.exceedsAllocation | La redistribución excede la asignación total de la línea | Redistribution exceeds the line's total allocation |
| reconciliation.monthBelowZero | El valor de un mes no puede ser negativo | A month's value cannot be negative |
| reconciliation.insufficientBudget | Presupuesto futuro insuficiente para compensar | Insufficient future budget to compensate |
| reconciliation.complete | Completo | Complete |
| reconciliation.incomplete | Incompleto | Incomplete |

### Sidebar Badge

The sidebar already polls for pending counts (see `changeRequestApi.getPendingCount` pattern). Add a similar poll for reconciliation pending count:

```typescript
// In Sidebar.tsx, add alongside existing pendingCount logic
const [reconciliationPendingCount, setReconciliationPendingCount] = useState(0);

useEffect(() => {
  const loadReconciliationCount = async () => {
    try {
      const res = await reconciliationApi.getPendingCount();
      setReconciliationPendingCount(res.data.count || 0);
    } catch { setReconciliationPendingCount(0); }
  };
  loadReconciliationCount();
  const interval = setInterval(loadReconciliationCount, 30000);
  return () => clearInterval(interval);
}, []);
```

## Frontend Types

Add to `frontend/src/types/index.ts`:

```typescript
// Monthly Reconciliation Types
export interface ReconciliationSummary {
  budgetId: string;
  currentMonth: number;
  lines: ReconciliationLineSummary[];
}

export interface ReconciliationLineSummary {
  budgetLineId: string;
  expenseCode: string;
  expenseDescription: string;
  financialCompany: string;
  currency: string;
  months: ReconciliationMonthData[];
}

export interface ReconciliationMonthData {
  month: number;
  planned: number;
  actual: number;
  difference: number;
  isClosed: boolean;
  isReconciled: boolean;
  reconciliation?: {
    id: string;
    decisionType: 'SAVING' | 'REDISTRIBUTION' | 'ADJUSTMENT';
    createdAt: string;
  };
}

export interface MonthlyReconciliationRecord {
  id: string;
  budgetLineId: string;
  month: number;
  year: number;
  decisionType: 'SAVING' | 'REDISTRIBUTION' | 'ADJUSTMENT';
  plannedAmount: number;
  actualAmount: number;
  differenceAmount: number;
  details: Record<string, number>;
  changeRequestId?: string;
  savingId?: string;
  user?: { id: string; fullName: string };
  createdAt: string;
}

export interface ReconciliationMonthStatus {
  month: number;
  year: number;
  totalLines: number;
  reconciledLines: number;
  isComplete: boolean;
}

export interface ReconciliationUserTracking {
  userId: string;
  fullName: string;
  technologyDirection: string;
  months: {
    month: number;
    isComplete: boolean;
    reconciledAt: string | null;
  }[];
}
```

## Correctness Properties

### Property 1: Reconciliation difference computation is consistent

For any budget line and closed month, the difference stored in a MonthlyReconciliation record must equal `plannedAmount - actualAmount`. This ensures the computation is never inconsistent with the stored values.

**Covers:** Requirement 1 (AC 1.3), Requirement 7 (AC 7.1)

### Property 2: Redistribution sum equals under-execution amount

For any redistribution reconciliation, the sum of all values in the `distribution` object must equal the `differenceAmount` stored in the reconciliation record. This ensures no budget is lost or created during redistribution.

**Covers:** Requirement 3 (AC 3.3)

### Property 3: Redistribution does not exceed annual allocation

For any redistribution reconciliation on a budget line, the sum of all 12 months' planned values after applying the redistribution must not exceed the original annual allocation (sum of base planM1–planM12 before any reconciliation adjustments).

**Covers:** Requirement 3 (AC 3.4)

### Property 4: Over-execution adjustment reductions are sufficient

For any adjustment reconciliation, the sum of all reduction values must be greater than or equal to the absolute value of the over-execution amount. This ensures the adjustment fully compensates for the overspend.

**Covers:** Requirement 4 (AC 4.3)

### Property 5: No month reduced below zero after adjustment

For any adjustment reconciliation, every future month's planned value after applying the reduction must be >= 0. This ensures adjustments never produce negative plan values.

**Covers:** Requirement 4 (AC 4.4)

### Property 6: Completion status is true only when all lines are reconciled

For any user and closed month, the completion status is `true` if and only if every budget line assigned to the user's technology direction has a MonthlyReconciliation record for that month. Partial reconciliation must always show as incomplete.

**Covers:** Requirement 5 (AC 5.2, 5.5)

### Property 7: Saving amount does not exceed available budget

For any saving reconciliation, the saving amount for the month must not exceed the planned amount minus existing active savings for that budget line and month. This prevents over-saving.

**Covers:** Requirement 2 (AC 2.4)

### Property 8: Unique reconciliation per budget line per month

The system must enforce that at most one reconciliation record exists per budget line per month per year. Attempting to reconcile an already-reconciled month must fail.

**Covers:** Requirement 5 (AC 5.1), database constraint `@@unique([budgetLineId, month, year])`
