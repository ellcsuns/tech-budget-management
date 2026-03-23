# Design Document

## Overview

Two independent enhancements implemented together:
1. Role-based technical error detail viewing in error toasts
2. Month label standardization from Ene/Feb/Mar to M1/M2/M3 format

---

## Feature 1: Technical Error Detail with Role-Based Permission

### 1.1 Prisma Schema Change

Add a boolean field to the `Role` model:

```prisma
model Role {
  // ... existing fields ...
  canViewTechnicalErrors  Boolean  @default(false)
  // ... existing fields ...
}
```

Migration: `npx prisma migrate dev --name add-can-view-technical-errors`

### 1.2 Backend Error Handler Enhancement

Modify `backend/src/middleware/errorHandler.ts` to include `technicalDetails` in every error response:

```typescript
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err);

  const technicalDetails = {
    stack: err.stack || null,
    code: err.code || null,
    meta: err.meta || null,
  };

  // Prisma P2002
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'Conflicto de unicidad',
      message: 'Ya existe un registro con estos valores únicos',
      details: err.meta,
      technicalDetails,
    });
  }

  // Prisma P2025
  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'No encontrado',
      message: 'El registro solicitado no existe',
      technicalDetails,
    });
  }

  // Prisma P2003
  if (err.code === 'P2003') {
    return res.status(400).json({
      error: 'Referencia inválida',
      message: 'La referencia a otro registro no es válida',
      details: err.meta,
      technicalDetails,
    });
  }

  // Custom validation error
  if (err.message) {
    return res.status(400).json({
      error: 'Error de validación',
      message: err.message,
      technicalDetails,
    });
  }

  // Generic error
  res.status(500).json({
    error: 'Error interno del servidor',
    message: 'Ocurrió un error inesperado',
    technicalDetails,
  });
}
```

### 1.3 Backend /auth/me Enhancement

In `backend/src/services/UserService.ts` → `getUserWithPermissions`, derive `canViewTechnicalErrors` from the user's roles:

```typescript
// After aggregating permissions, also check canViewTechnicalErrors
const canViewTechnicalErrors = user.userRoles.some(ur => ur.role.canViewTechnicalErrors);

return {
  ...user,
  roles,
  permissions,
  canViewTechnicalErrors,
};
```

The `UserWithPermissions` interface adds:
```typescript
export interface UserWithPermissions extends User {
  roles: Role[];
  permissions: Array<{ menuCode: string; permissionType: PermissionType }>;
  canViewTechnicalErrors: boolean;
}
```

### 1.4 Backend Role CRUD Updates

In `RoleService.ts`, update `createRole` and `updateRole` to accept and persist `canViewTechnicalErrors`:

- `CreateRoleDTO` and `UpdateRoleDTO` add `canViewTechnicalErrors?: boolean`
- Pass through to Prisma `create`/`update` data

In `roleRoutes.ts`, extract `canViewTechnicalErrors` from `req.body` in POST and PUT handlers.

### 1.5 Frontend AuthContext Enhancement

In `frontend/src/contexts/AuthContext.tsx`:

- Add `canViewTechnicalErrors: boolean` to `AuthContextType`
- Store it from `/auth/me` response, default to `false`
- Expose via context value

```typescript
interface AuthContextType {
  // ... existing ...
  canViewTechnicalErrors: boolean;
}
```

### 1.6 Frontend Toast Enhancement

Modify `frontend/src/components/Toast.tsx`:

- Extend `ToastMessage` interface with optional `technicalDetails`
- Extend `showToast` to accept optional `technicalDetails` parameter
- When `canViewTechnicalErrors` is true and `technicalDetails` exists, render a "Visualizar detalle técnico" link
- On click, expand to show a `<pre>` block with the technical details
- When expanded, disable auto-dismiss timeout

The Toast needs access to `canViewTechnicalErrors`. Since Toast uses a global function pattern (not inside React tree for permission check), the approach is:
- Store `canViewTechnicalErrors` in a module-level variable updated by AuthContext
- Export a setter `setCanViewTechnicalErrors(value: boolean)` from Toast.tsx
- AuthContext calls this setter when the flag changes

### 1.7 Frontend API Interceptor Enhancement

In `frontend/src/services/api.ts`, update the Axios response error interceptor:

```typescript
api.interceptors.response.use(
  response => response,
  error => {
    const data = error.response?.data;
    const message = data?.message || 'Error desconocido';
    const technicalDetails = data?.technicalDetails || null;
    showToast(message, 'error', technicalDetails);
    return Promise.reject(error);
  }
);
```

Note: Only update the interceptor if one already exists. If error handling is done per-call, add a centralized interceptor.

### 1.8 Frontend RoleManagementPage Enhancement

In `frontend/src/pages/RoleManagementPage.tsx`:

- Add `canViewTechnicalErrors` to the `Role` interface and `formData` state
- Add a checkbox in the role form (after the approver config section):

```tsx
<label className="flex items-center gap-2">
  <input
    type="checkbox"
    checked={formData.canViewTechnicalErrors}
    onChange={(e) => setFormData({ ...formData, canViewTechnicalErrors: e.target.checked })}
    className="w-4 h-4"
  />
  <span className="text-sm">Puede ver errores técnicos / Can view technical errors</span>
</label>
```

---

## Feature 2: Month Label Standardization (M1–M12)

### 2.1 Files to Update

All hardcoded month arrays change from `['Ene', 'Feb', ...]` to `['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12']`.

Files:
1. `frontend/src/utils/formatters.ts` — `MONTH_NAMES`
2. `frontend/src/components/BudgetTable.tsx` — `MONTHS`
3. `frontend/src/components/BudgetLineDetailPopup.tsx` — `MONTHS`
4. `frontend/src/components/ExpenseDetailPopup.tsx` — `MONTHS`
5. `frontend/src/components/ExpenseTable.tsx` — `months`
6. `frontend/src/pages/ApprovalsPage.tsx` — `MONTHS`
7. `frontend/src/pages/BudgetsPage.tsx` — `MONTHS`
8. `frontend/src/pages/CommittedTransactionsPage.tsx` — `months` (inside `getMonthFromDate`)
9. `frontend/src/pages/RealTransactionsPage.tsx` — `months` (inside `getMonthFromDate`)
10. `frontend/src/pages/SavingsPage.tsx` — `MONTHS`
11. `frontend/src/pages/DeferralsPage.tsx` — `MONTHS`

### 2.2 Seed Translations Update

In `backend/src/seedTranslations.ts`, update `month.short.1` through `month.short.12`:

```typescript
{ key: 'month.short.1', es: 'M1', en: 'M1', category: 'common' },
{ key: 'month.short.2', es: 'M2', en: 'M2', category: 'common' },
// ... through M12
{ key: 'month.short.12', es: 'M12', en: 'M12', category: 'common' },
```

This ensures `ReportsPage.tsx` and `ExchangeRatePage.tsx` (which use `t('month.short.N')`) also display M1–M12.

### 2.3 OnboardingSplash SVG Update

In `frontend/src/components/OnboardingSplash.tsx`, replace any SVG text elements containing month abbreviations (ENE, FEB, MAR, etc.) with M1, M2, M3, etc.

---

## Data Flow Diagrams

### Error Detail Flow
```
API Error → errorHandler (adds technicalDetails) → JSON Response
  → Axios interceptor (extracts technicalDetails) → showToast(msg, 'error', technicalDetails)
    → Toast renders "Visualizar detalle técnico" if canViewTechnicalErrors === true
```

### Permission Flag Flow
```
Role.canViewTechnicalErrors (DB) → /auth/me aggregates from roles → AuthContext stores flag
  → AuthContext calls setCanViewTechnicalErrors() → Toast module variable updated
```
