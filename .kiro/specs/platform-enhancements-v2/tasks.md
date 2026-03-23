# Tasks

## Feature 1: Technical Error Detail with Role-Based Permission

- [x] 1. Add `canViewTechnicalErrors` field to Prisma Role model
  - [x] 1.1 Add `canViewTechnicalErrors Boolean @default(false)` to the Role model in `backend/prisma/schema.prisma`
  - [x] 1.2 Run `npx prisma migrate dev --name add-can-view-technical-errors` to generate and apply migration

- [x] 2. Update backend error handler to include technical details
  - [x] 2.1 Modify `backend/src/middleware/errorHandler.ts` to build a `technicalDetails` object (`stack`, `code`, `meta`) and include it in every error JSON response

- [x] 3. Update backend Role CRUD to support `canViewTechnicalErrors`
  - [x] 3.1 Add `canViewTechnicalErrors?: boolean` to `CreateRoleDTO` and `UpdateRoleDTO` in `backend/src/services/RoleService.ts`
  - [x] 3.2 Pass `canViewTechnicalErrors` through to Prisma `create` and `update` calls in `RoleService.createRole` and `RoleService.updateRole`
  - [x] 3.3 Extract `canViewTechnicalErrors` from `req.body` in POST and PUT handlers in `backend/src/routes/roleRoutes.ts`

- [x] 4. Update `/auth/me` to return `canViewTechnicalErrors` flag
  - [x] 4.1 Add `canViewTechnicalErrors: boolean` to `UserWithPermissions` interface in `backend/src/services/UserService.ts`
  - [x] 4.2 In `getUserWithPermissions`, derive `canViewTechnicalErrors` by checking if any of the user's roles has the flag set to `true`, and include it in the return object

- [x] 5. Update frontend AuthContext to expose `canViewTechnicalErrors`
  - [x] 5.1 Add `canViewTechnicalErrors: boolean` to the `AuthContextType` interface in `frontend/src/contexts/AuthContext.tsx`
  - [x] 5.2 Add state for `canViewTechnicalErrors`, populate from `/auth/me` response and login response, default to `false`
  - [x] 5.3 Expose `canViewTechnicalErrors` in the context provider value

- [x] 6. Update Toast component to support expandable technical details
  - [x] 6.1 Add a module-level `canViewTechnicalErrors` variable and a `setCanViewTechnicalErrors` export function in `frontend/src/components/Toast.tsx`
  - [x] 6.2 Extend `ToastMessage` interface with optional `technicalDetails` field (object with `stack`, `code`, `meta`)
  - [x] 6.3 Update `showToast` function signature to accept optional third parameter `technicalDetails`
  - [x] 6.4 Render "Visualizar detalle técnico" clickable text on error toasts when `canViewTechnicalErrors` is true and `technicalDetails` exists
  - [x] 6.5 On click, expand to show technical details in a scrollable monospaced `<pre>` block and cancel auto-dismiss
  - [x] 6.6 Call `setCanViewTechnicalErrors` from AuthContext when the flag value changes (in `useEffect`)

- [x] 7. Update frontend API interceptor to forward technical details to toast
  - [x] 7.1 In `frontend/src/services/api.ts`, update or add Axios response error interceptor to extract `technicalDetails` from error response data and pass to `showToast`

- [x] 8. Update RoleManagementPage to show `canViewTechnicalErrors` checkbox
  - [x] 8.1 Add `canViewTechnicalErrors` to the `Role` interface and `formData` state in `frontend/src/pages/RoleManagementPage.tsx`
  - [x] 8.2 Add a checkbox "Puede ver errores técnicos" in the role edit/create form
  - [x] 8.3 Include `canViewTechnicalErrors` in the submit payload and populate from role data on edit

## Feature 2: Month Label Standardization (M1–M12)

- [x] 9. Update all frontend hardcoded month arrays to M1–M12
  - [x] 9.1 Change `MONTH_NAMES` in `frontend/src/utils/formatters.ts` to `['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12']`
  - [x] 9.2 Change `MONTHS` in `frontend/src/components/BudgetTable.tsx` to M1–M12
  - [x] 9.3 Change `MONTHS` in `frontend/src/components/BudgetLineDetailPopup.tsx` to M1–M12
  - [x] 9.4 Change `MONTHS` in `frontend/src/components/ExpenseDetailPopup.tsx` to M1–M12
  - [x] 9.5 Change `months` in `frontend/src/components/ExpenseTable.tsx` to M1–M12
  - [x] 9.6 Change `MONTHS` in `frontend/src/pages/ApprovalsPage.tsx` to M1–M12
  - [x] 9.7 Change `MONTHS` in `frontend/src/pages/BudgetsPage.tsx` to M1–M12
  - [x] 9.8 Change `months` in `frontend/src/pages/CommittedTransactionsPage.tsx` to M1–M12
  - [x] 9.9 Change `months` in `frontend/src/pages/RealTransactionsPage.tsx` to M1–M12
  - [x] 9.10 Change `MONTHS` in `frontend/src/pages/SavingsPage.tsx` to M1–M12
  - [x] 9.11 Change `MONTHS` in `frontend/src/pages/DeferralsPage.tsx` to M1–M12

- [x] 10. Update seed translations for month.short keys
  - [x] 10.1 In `backend/src/seedTranslations.ts`, change `month.short.1` through `month.short.12` to use `M1` through `M12` for both `es` and `en` values

- [x] 11. Update OnboardingSplash SVG month labels
  - [x] 11.1 In `frontend/src/components/OnboardingSplash.tsx`, replace any month abbreviation text (ENE, FEB, MAR, etc.) in SVG elements with M1, M2, M3, etc.
