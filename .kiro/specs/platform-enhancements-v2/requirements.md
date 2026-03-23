# Requirements Document

## Introduction

This document specifies two platform enhancements for InvestIQ:

1. **Technical Error Detail with Role-Based Permission**: Expose full technical error information (stack traces, error codes, exception chains) in the UI behind a role-configurable permission. Users with the permission see a "Visualizar detalle técnico" option on error toasts.

2. **Month Label Standardization (M1–M12)**: Replace all month abbreviation labels (Ene, Feb, Mar…) across the entire application with a numeric format (M1, M2, M3… M12) for consistency and language neutrality.

## Glossary

- **Error_Handler**: The Express middleware (`errorHandler.ts`) that catches unhandled errors and formats JSON error responses.
- **Toast_Component**: The frontend `ToastContainer` component that displays transient notification messages at the bottom of the screen.
- **Auth_Context**: The React context (`AuthContext.tsx`) that provides authentication state and permission checks to the frontend.
- **Role_Management_Page**: The admin page (`RoleManagementPage.tsx`) where administrators configure roles and their permissions.
- **API_Gateway**: The Express backend that serves all `/api/*` endpoints.
- **Month_Label**: A short textual representation of a calendar month used in table headers, charts, and data displays across the application.
- **Technical_Details**: The full error chain including stack trace, error code, and metadata produced when an API operation fails.
- **Seed_Translations**: The backend script (`seedTranslations.ts`) that populates the Translation table with default i18n key-value pairs.

## Requirements

### Requirement 1: Backend Error Response Enhancement

**User Story:** As a developer or power user, I want API error responses to include full technical details, so that I can diagnose issues without checking server logs.

#### Acceptance Criteria

1. WHEN an error is caught, THE Error_Handler SHALL include a `technicalDetails` object in the JSON response containing the `stack` trace, `code` (if available), and `meta` (if available).
2. THE Error_Handler SHALL continue to return the existing `error`, `message`, and `details` fields unchanged.
3. WHEN the error has no stack trace, THE Error_Handler SHALL set the `technicalDetails.stack` field to null.
4. WHEN the error has no error code, THE Error_Handler SHALL set the `technicalDetails.code` field to null.

### Requirement 2: Role-Based Permission for Technical Error Viewing

**User Story:** As an administrator, I want to control which roles can see technical error details, so that sensitive stack traces are only visible to authorized users.

#### Acceptance Criteria

1. THE Role model in Prisma SHALL include a boolean field `canViewTechnicalErrors` with a default value of `false`.
2. WHEN an administrator creates or edits a role on the Role_Management_Page, THE Role_Management_Page SHALL display a checkbox labeled "Puede ver errores técnicos" / "Can view technical errors" in the role form.
3. WHEN the checkbox is checked and the form is submitted, THE API_Gateway SHALL persist the `canViewTechnicalErrors` value as `true` for that role.
4. WHEN the checkbox is unchecked and the form is submitted, THE API_Gateway SHALL persist the `canViewTechnicalErrors` value as `false` for that role.

### Requirement 3: Expose Permission Flag to Frontend

**User Story:** As a frontend developer, I want the authenticated user's `canViewTechnicalErrors` flag available in the Auth_Context, so that the UI can conditionally render technical detail options.

#### Acceptance Criteria

1. WHEN the `/api/auth/me` endpoint responds, THE API_Gateway SHALL include a `canViewTechnicalErrors` boolean field derived from the user's assigned roles.
2. IF any of the user's roles has `canViewTechnicalErrors` set to `true`, THEN THE API_Gateway SHALL return `canViewTechnicalErrors` as `true`.
3. THE Auth_Context SHALL store and expose the `canViewTechnicalErrors` flag from the `/api/auth/me` response.
4. THE Auth_Context SHALL default `canViewTechnicalErrors` to `false` when the flag is not present in the response.

### Requirement 4: Expandable Technical Details in Toast

**User Story:** As a user with technical error viewing permission, I want to expand error toasts to see full technical details, so that I can understand and report the root cause of failures.

#### Acceptance Criteria

1. WHEN an error toast is displayed and the user has `canViewTechnicalErrors` set to `true`, THE Toast_Component SHALL render a clickable text "Visualizar detalle técnico" below the error message.
2. WHEN the user clicks "Visualizar detalle técnico", THE Toast_Component SHALL expand to show the full technical details (stack trace, error code, metadata) in a scrollable, monospaced text area.
3. WHEN the user does not have `canViewTechnicalErrors` set to `true`, THE Toast_Component SHALL display only the error message text without the "Visualizar detalle técnico" option.
4. WHEN the technical details section is expanded, THE Toast_Component SHALL remain visible until the user explicitly dismisses the toast by clicking on it.
5. THE `showToast` function SHALL accept an optional `technicalDetails` parameter to pass technical error information.

### Requirement 5: Frontend API Error Interception

**User Story:** As a frontend developer, I want API errors to automatically extract and forward technical details to the toast system, so that the technical detail display works for all API calls without per-call changes.

#### Acceptance Criteria

1. WHEN an API call returns an error response containing a `technicalDetails` field, THE API_Gateway client (Axios interceptor) SHALL extract the `technicalDetails` and pass them to the `showToast` function.
2. WHEN an API call returns an error response without a `technicalDetails` field, THE API_Gateway client SHALL call `showToast` with only the error message.

### Requirement 6: Month Label Format Change to M1–M12

**User Story:** As a user, I want all month column headers to display M1, M2, M3… M12 instead of Ene, Feb, Mar… Dic, so that the labels are consistent and language-neutral across the application.

#### Acceptance Criteria

1. THE `MONTH_NAMES` constant in `formatters.ts` SHALL contain the values `['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12']`.
2. THE hardcoded month arrays in `BudgetTable.tsx`, `BudgetLineDetailPopup.tsx`, `ExpenseDetailPopup.tsx`, `ExpenseTable.tsx`, `ApprovalsPage.tsx`, `BudgetsPage.tsx`, `CommittedTransactionsPage.tsx`, `RealTransactionsPage.tsx`, `SavingsPage.tsx`, and `DeferralsPage.tsx` SHALL each contain the values `['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12']`.
3. THE Seed_Translations entries for keys `month.short.1` through `month.short.12` SHALL use `M1` through `M12` for both the `es` and `en` values.
4. THE `OnboardingSplash.tsx` component SHALL replace any month abbreviation text (ENE, FEB, etc.) in SVG illustrations with the corresponding M1–M12 labels.
