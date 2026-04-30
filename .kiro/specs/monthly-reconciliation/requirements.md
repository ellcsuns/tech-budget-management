# Requirements Document

## Introduction

Monthly Reconciliation ("Conciliación Mensual") is a new module in InvestIQ that requires users to review and reconcile their budget execution versus actual spending at the end of each month. For every budget line assigned to a user's technology direction, the system compares planned (budget) values against real transaction totals month by month. When discrepancies are found — either under-execution or over-execution — the user must take corrective action: confirm savings, redistribute unspent amounts across future months, or adjust forecasts to compensate for overspending. All adjustments flow through the existing change request approval system, and the entire process is tracked with a full audit trail.

## Glossary

- **Reconciliation_Engine**: The backend service responsible for computing monthly budget-vs-actual comparisons, validating reconciliation actions, and persisting reconciliation records.
- **Reconciliation_Page**: The frontend page accessible from the sidebar menu where users perform their monthly reconciliation workflow.
- **Reconciliation_Record**: A persisted record capturing a user's reconciliation decisions for a specific budget line and month, including the decision type and associated amounts.
- **Budget_Line**: An existing entity linking an expense to a budget, financial company, and technology direction, with planned monthly values (planM1–planM12).
- **Planned_Amount**: The computed budget value for a given month on a budget line, incorporating base plan values, approved change requests, and active savings.
- **Actual_Amount**: The sum of REAL-type transaction values for a given budget line and month.
- **Under_Execution**: A state where the Actual_Amount for a closed month is less than the Planned_Amount.
- **Over_Execution**: A state where the Actual_Amount for a closed month is greater than the Planned_Amount.
- **Confirmed_Saving**: A user decision declaring that an under-execution amount represents a genuine saving, which creates a Saving record in the existing savings system.
- **Forecast_Redistribution**: A user decision to spread an under-execution amount across future months via the change request system, without exceeding the total annual allocation for the budget line.
- **Forecast_Adjustment**: A user decision to reduce planned amounts in future months to compensate for over-execution, submitted via the change request system.
- **Closed_Month**: A calendar month that has ended (current month number > month number being reconciled).
- **Reconciliation_Status_Tracker**: The component that monitors which users have completed their monthly reconciliation and which have not.
- **Reminder_Banner**: A UI notification element displayed to users who have pending reconciliation obligations.
- **Change_Request**: An existing entity (BudgetLineChangeRequest) used to propose modifications to budget line plan values, subject to approval workflow.
- **Technology_Direction**: An organizational unit to which users and budget lines are assigned.

## Requirements

### Requirement 1: Monthly Execution Summary Display

**User Story:** As a budget line owner, I want to see a summary of budget vs actual execution for each of my assigned budget lines month by month, so that I can identify discrepancies and take corrective action.

#### Acceptance Criteria

1. WHEN a user navigates to the Reconciliation_Page, THE Reconciliation_Engine SHALL retrieve all Budget_Lines assigned to the user's Technology_Direction for the active budget.
2. THE Reconciliation_Page SHALL display for each Budget_Line a row containing the expense code, short description, financial company, and currency.
3. THE Reconciliation_Page SHALL display for each Budget_Line and each month (M1–M12) the Planned_Amount, the Actual_Amount, and the numeric difference between them.
4. THE Reconciliation_Page SHALL group Budget_Lines and display subtotals of Planned_Amount, Actual_Amount, and difference per month.
5. WHEN the difference for a Closed_Month is negative (Under_Execution), THE Reconciliation_Page SHALL highlight the cell with a visual warning indicator.
6. WHEN the difference for a Closed_Month is positive (Over_Execution), THE Reconciliation_Page SHALL highlight the cell with a visual alert indicator.
7. THE Reconciliation_Page SHALL display a reconciliation status badge per Budget_Line per Closed_Month indicating whether reconciliation has been completed.

### Requirement 2: Under-Execution Handling — Confirmed Saving

**User Story:** As a budget line owner, I want to declare an under-execution as a confirmed saving, so that the system tracks it as a genuine cost reduction.

#### Acceptance Criteria

1. WHEN a Closed_Month shows Under_Execution for a Budget_Line, THE Reconciliation_Page SHALL present the user with an option to declare the difference as a Confirmed_Saving.
2. WHEN the user confirms a saving, THE Reconciliation_Engine SHALL create a Saving record with the under-execution amount assigned to the corresponding month (savingMX field) and status PENDING.
3. WHEN the user confirms a saving, THE Reconciliation_Engine SHALL create a Reconciliation_Record with decision type "SAVING", the Budget_Line identifier, the month number, and the saved amount.
4. IF the under-execution amount exceeds the available budget for that month after accounting for existing savings, THEN THE Reconciliation_Engine SHALL reject the saving and return a descriptive error message.

### Requirement 3: Under-Execution Handling — Forecast Redistribution

**User Story:** As a budget line owner, I want to redistribute unspent budget across future months when the under-execution is not a saving, so that the forecast reflects updated spending expectations.

#### Acceptance Criteria

1. WHEN a Closed_Month shows Under_Execution and the user does not declare a Confirmed_Saving, THE Reconciliation_Page SHALL present a redistribution interface showing the remaining future months and their current Planned_Amounts.
2. THE Reconciliation_Page SHALL allow the user to distribute the under-execution amount across one or more future months by entering specific amounts per month.
3. THE Reconciliation_Engine SHALL validate that the sum of redistributed amounts equals the under-execution amount for the reconciled month.
4. THE Reconciliation_Engine SHALL validate that the new total annual plan (original plan plus redistributions) does not exceed the original total annual allocation for the Budget_Line.
5. WHEN the redistribution is valid, THE Reconciliation_Engine SHALL create a Change_Request with the proposed new monthly plan values and a system-generated comment referencing the reconciliation.
6. WHEN the redistribution is valid, THE Reconciliation_Engine SHALL create a Reconciliation_Record with decision type "REDISTRIBUTION", the Budget_Line identifier, the month number, and the redistribution details.
7. IF the user attempts to redistribute an amount that would cause the annual total to exceed the original allocation, THEN THE Reconciliation_Engine SHALL reject the redistribution and display the maximum redistributable amount.

### Requirement 4: Over-Execution Handling — Forecast Adjustment

**User Story:** As a budget line owner, I want to adjust future month forecasts when actual spending exceeds the budget, so that the total annual spending stays within the allocated amount.

#### Acceptance Criteria

1. WHEN a Closed_Month shows Over_Execution for a Budget_Line, THE Reconciliation_Page SHALL present a forecast adjustment interface showing the remaining future months and their current Planned_Amounts.
2. THE Reconciliation_Page SHALL allow the user to reduce planned amounts in one or more future months to compensate for the over-execution.
3. THE Reconciliation_Engine SHALL validate that the total reduction across future months equals or exceeds the over-execution amount.
4. THE Reconciliation_Engine SHALL validate that no individual future month's Planned_Amount is reduced below zero.
5. WHEN the adjustment is valid, THE Reconciliation_Engine SHALL create a Change_Request with the proposed reduced monthly plan values and a system-generated comment referencing the reconciliation.
6. WHEN the adjustment is valid, THE Reconciliation_Engine SHALL create a Reconciliation_Record with decision type "ADJUSTMENT", the Budget_Line identifier, the month number, and the adjustment details.
7. IF the remaining future months do not have sufficient planned budget to compensate for the over-execution, THEN THE Reconciliation_Engine SHALL display a warning indicating the shortfall amount and allow the user to proceed with a partial adjustment.

### Requirement 5: Monthly Reconciliation Obligation Tracking

**User Story:** As a system administrator, I want to track which users have completed their monthly reconciliation and which have not, so that I can ensure compliance with the reconciliation process.

#### Acceptance Criteria

1. THE Reconciliation_Status_Tracker SHALL maintain a record per user per Closed_Month indicating whether reconciliation has been completed for all assigned Budget_Lines.
2. WHEN a user completes reconciliation for all Budget_Lines assigned to their Technology_Direction for a given Closed_Month, THE Reconciliation_Status_Tracker SHALL mark that user-month combination as complete.
3. THE Reconciliation_Page SHALL display a status overview showing each Closed_Month and whether the current user has completed reconciliation.
4. WHEN an administrator views the reconciliation tracking section, THE Reconciliation_Status_Tracker SHALL display a matrix of users versus months with completion status indicators.
5. THE Reconciliation_Status_Tracker SHALL compute completion status based on the existence of Reconciliation_Records for every assigned Budget_Line for the given month.

### Requirement 6: Pending Reconciliation Reminders

**User Story:** As a budget line owner, I want to receive reminders when I have pending monthly reconciliations, so that I do not forget to complete the process on time.

#### Acceptance Criteria

1. WHEN a user logs in and has at least one Closed_Month without completed reconciliation, THE Reminder_Banner SHALL display a notification on the Reconciliation_Page indicating the number of pending months.
2. THE Reminder_Banner SHALL display the specific months that require reconciliation action.
3. WHEN the user completes reconciliation for all pending months, THE Reminder_Banner SHALL no longer display.
4. THE Reconciliation_Page SHALL display a persistent reminder section at the top of the page listing all pending reconciliation obligations.

### Requirement 7: Reconciliation Audit Trail

**User Story:** As an auditor, I want a complete record of all reconciliation decisions, so that I can review who reconciled, when, and what decisions were made.

#### Acceptance Criteria

1. THE Reconciliation_Engine SHALL record in each Reconciliation_Record the user identifier, timestamp, Budget_Line identifier, month number, decision type (SAVING, REDISTRIBUTION, or ADJUSTMENT), and the monetary amounts involved.
2. THE Reconciliation_Engine SHALL log each reconciliation action to the existing AuditLog system with entity type "RECONCILIATION" and relevant details.
3. WHEN a user views the reconciliation history for a Budget_Line, THE Reconciliation_Page SHALL display all past Reconciliation_Records ordered by month and creation date.
4. THE Reconciliation_Page SHALL display for each historical record the decision type, amounts, the user who performed the reconciliation, and the timestamp.
5. WHEN a reconciliation action creates a Change_Request, THE Reconciliation_Record SHALL store the Change_Request identifier for cross-reference.

### Requirement 8: New Sidebar Menu Section

**User Story:** As a user, I want to access the monthly reconciliation feature from a dedicated section in the sidebar menu, so that I can easily find and use the reconciliation workflow.

#### Acceptance Criteria

1. THE Reconciliation_Page SHALL be accessible from a new menu item in the sidebar with label key "menu.reconciliation" and fallback text "Conciliación Mensual".
2. THE Reconciliation_Page SHALL use a distinct icon in the sidebar that differentiates it from other menu sections.
3. THE Reconciliation_Page SHALL be protected by a new menu code "monthly-reconciliation" in the permission system.
4. WHEN the user does not have VIEW permission for the "monthly-reconciliation" menu code, THE sidebar SHALL not display the reconciliation menu item.
5. THE Reconciliation_Page SHALL support both Spanish and English translations using the existing i18n system.
6. THE Reconciliation_Page SHALL support dark mode consistent with the existing application theme.
7. WHEN the user has pending reconciliation obligations, THE sidebar menu item SHALL display a badge with the count of pending months.
