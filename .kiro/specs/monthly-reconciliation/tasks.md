# Tasks: Monthly Reconciliation

## Task 1: Database Schema and Migration
- [x] 1.1 Add `ReconciliationDecisionType` enum and `MonthlyReconciliation` model to `backend/prisma/schema.prisma`
- [x] 1.2 Add `reconciliations` relation to `BudgetLine` model in schema.prisma
- [x] 1.3 Add `reconciliations` relation to `User` model in schema.prisma
- [x] 1.4 Add `MONTHLY_RECONCILIATION: 'monthly-reconciliation'` to `backend/src/constants/menuCodes.ts`
- [x] 1.5 Run Prisma migration to apply schema changes

## Task 2: Backend Service Layer
- [x] 2.1 Create `backend/src/services/ReconciliationService.ts` with constructor accepting PrismaClient, SavingService, and ChangeRequestService
- [x] 2.2 Implement `computeMonthlyExecution(budgetLineId, month)` private method that computes planned (base + approved changes - active savings) vs actual (sum of REAL transactions) and returns planned, actual, difference
- [x] 2.3 Implement `getReconciliationSummary(userId, budgetId?)` that retrieves all budget lines for the user's technology direction and computes monthly execution data with reconciliation status
- [x] 2.4 Implement `confirmSaving(userId, budgetLineId, month, amount)` that validates the month is closed, computes under-execution, validates amount, creates a Saving via SavingService, creates a MonthlyReconciliation record with decisionType SAVING, and logs to AuditLog
- [x] 2.5 Implement `redistributeUnderExecution(userId, budgetLineId, month, distribution)` that validates month is closed, validates sum of distribution equals under-execution, validates annual total does not exceed allocation, creates a ChangeRequest via ChangeRequestService, creates a MonthlyReconciliation record with decisionType REDISTRIBUTION, and logs to AuditLog
- [x] 2.6 Implement `adjustOverExecution(userId, budgetLineId, month, reductions)` that validates month is closed, validates total reductions >= over-execution, validates no month goes below zero, creates a ChangeRequest via ChangeRequestService, creates a MonthlyReconciliation record with decisionType ADJUSTMENT, and logs to AuditLog
- [x] 2.7 Implement `getUserStatus(userId, budgetId?)` that returns per-month completion status (totalLines, reconciledLines, isComplete) for the current user
- [x] 2.8 Implement `getTrackingMatrix(budgetId?)` that returns all users with their per-month reconciliation completion status
- [x] 2.9 Implement `getHistory(budgetLineId)` that returns all MonthlyReconciliation records for a budget line ordered by month and createdAt
- [x] 2.10 Implement `getPendingCount(userId)` that returns the number of closed months with incomplete reconciliation for the user

## Task 3: Backend Routes
- [x] 3.1 Create `backend/src/routes/reconciliationRoutes.ts` with router factory function accepting PrismaClient, applying authenticateJWT and requirePermission middleware
- [x] 3.2 Implement `GET /api/reconciliations/summary` route that calls `getReconciliationSummary` with the authenticated user's ID
- [x] 3.3 Implement `POST /api/reconciliations/saving` route that validates request body (budgetLineId, month, amount) and calls `confirmSaving`
- [x] 3.4 Implement `POST /api/reconciliations/redistribution` route that validates request body (budgetLineId, month, distribution) and calls `redistributeUnderExecution`
- [x] 3.5 Implement `POST /api/reconciliations/adjustment` route that validates request body (budgetLineId, month, reductions) and calls `adjustOverExecution`
- [x] 3.6 Implement `GET /api/reconciliations/status` route that calls `getUserStatus` with the authenticated user's ID
- [x] 3.7 Implement `GET /api/reconciliations/history/:budgetLineId` route that calls `getHistory`
- [x] 3.8 Implement `GET /api/reconciliations/tracking` route (requires MODIFY permission) that calls `getTrackingMatrix`
- [x] 3.9 Implement `GET /api/reconciliations/pending-count` route that calls `getPendingCount`
- [x] 3.10 Register the reconciliation router in `backend/src/index.ts` at path `/api/reconciliations`

## Task 4: Frontend Types and API Client
- [x] 4.1 Add ReconciliationSummary, ReconciliationLineSummary, ReconciliationMonthData, MonthlyReconciliationRecord, ReconciliationMonthStatus, and ReconciliationUserTracking types to `frontend/src/types/index.ts`
- [x] 4.2 Add `reconciliationApi` object to `frontend/src/services/api.ts` with methods: getSummary, confirmSaving, redistribute, adjust, getStatus, getHistory, getTracking, getPendingCount

## Task 5: Frontend Reconciliation Page and Components
- [x] 5.1 Create `frontend/src/pages/ReconciliationPage.tsx` main page component with state for summary, userStatus, selectedMonth, and dialog visibility; loads data on mount via reconciliationApi
- [x] 5.2 Create `ReminderBanner` component within ReconciliationPage that displays pending month count and specific month names, hidden when all months are reconciled
- [x] 5.3 Create `ReconciliationSummaryTable` component that displays budget lines with planned, actual, difference columns for the selected month; highlights under-execution in amber and over-execution in red; shows reconciliation status badges and action buttons
- [x] 5.4 Create `UnderExecutionDialog` modal component with two options: "Confirmar Ahorro" (calls confirmSaving API) and "Redistribuir" (shows future month inputs, validates sum equals difference, calls redistribute API)
- [x] 5.5 Create `OverExecutionDialog` modal component showing future months with reduction inputs, validates total reduction >= over-execution and no month below zero, calls adjust API
- [x] 5.6 Create `ReconciliationHistory` expandable panel component that loads and displays past reconciliation records per budget line with decision type, amounts, user, and timestamp
- [x] 5.7 Create `AdminTrackingMatrix` component (visible to MODIFY permission holders) showing users vs months grid with completion indicators

## Task 6: App Integration (Routing, Sidebar, Translations)
- [x] 6.1 Add the `/reconciliation` route to `frontend/src/App.tsx` with ProtectedRoute wrapping using menuCode "monthly-reconciliation"
- [x] 6.2 Add the reconciliation menu item to `frontend/src/components/Sidebar.tsx` menuItems array with path "/reconciliation", labelKey "menu.reconciliation", fallback "Conciliación Mensual", icon HiOutlineClipboardDocumentCheck, and menuCode "monthly-reconciliation"
- [x] 6.3 Add reconciliation pending count polling to Sidebar.tsx and display badge on the reconciliation menu item when count > 0
- [x] 6.4 Add all reconciliation translation entries to `backend/src/seedTranslations.ts` with category "reconciliation" (menu.reconciliation, reconciliation.title, reconciliation.summary, reconciliation.planned, reconciliation.actual, reconciliation.difference, reconciliation.underExecution, reconciliation.overExecution, reconciliation.confirmSaving, reconciliation.redistribute, reconciliation.adjust, reconciliation.reconciled, reconciliation.pending, reconciliation.reminderTitle, reconciliation.reminderMessage, reconciliation.history, reconciliation.tracking, reconciliation.savingConfirmed, reconciliation.redistributionCreated, reconciliation.adjustmentCreated, reconciliation.noFutureMonths, reconciliation.sumMismatch, reconciliation.exceedsAllocation, reconciliation.monthBelowZero, reconciliation.insufficientBudget, reconciliation.complete, reconciliation.incomplete)
- [x] 6.5 Ensure ReconciliationPage supports dark mode using existing Tailwind dark: classes consistent with other pages
