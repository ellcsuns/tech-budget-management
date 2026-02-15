# Requirements Document: Savings Module

## Introduction

This feature enables budget managers to register savings that apply to specific expenses in the current budget. Savings can be distributed across months in various ways and remain in a pending state until approved. Upon approval, the system creates a new budget version with all pending savings applied to the corresponding expense plan values.

## Glossary

- **Saving**: A cost reduction record associated with a specific expense in a budget
- **Saving_Service**: The backend service that manages saving operations
- **Budget_Version_Service**: The service that creates new budget versions with savings applied
- **Monthly_Distribution**: The allocation of a saving amount across one or more months
- **Pending_Saving**: A saving that has been registered but not yet approved
- **Approved_Saving**: A saving that has been applied to a budget version
- **Savings_Page**: The frontend interface for managing savings
- **Distribution_Strategy**: The method used to allocate savings across months (EVEN, SINGLE_MONTH, CUSTOM)

## Requirements

### Requirement 1: Savings Registration

**User Story:** As a budget manager, I want to register savings for specific expenses, so that I can track cost reductions before applying them to the budget.

#### Acceptance Criteria

1. WHEN a user creates a new saving, THEN THE Saving_Service SHALL require expenseId, budgetId, totalAmount, and description
2. WHEN a saving is created, THEN THE Saving_Service SHALL generate a unique ID and record the creation timestamp
3. WHEN a saving is created, THEN THE Saving_Service SHALL store the user ID of the creator
4. WHEN a saving is created, THEN THE Saving_Service SHALL set the status to PENDING
5. WHEN a user provides a totalAmount, THEN THE Saving_Service SHALL validate that the amount is greater than zero
6. WHEN multiple savings are registered for the same expense, THEN THE Saving_Service SHALL allow all savings to coexist in PENDING status

### Requirement 2: Monthly Distribution Options

**User Story:** As a budget manager, I want to distribute savings across months in different ways, so that I can accurately reflect when cost reductions occur.

#### Acceptance Criteria

1. WHEN a user selects EVEN distribution, THEN THE Saving_Service SHALL divide the totalAmount equally across all 12 months
2. WHEN a user selects SINGLE_MONTH distribution, THEN THE Saving_Service SHALL apply the full totalAmount to one specified month
3. WHEN a user selects CUSTOM distribution, THEN THE Saving_Service SHALL allow the user to specify amounts for selected months
4. WHEN using CUSTOM distribution, THEN THE Saving_Service SHALL validate that the sum of monthly amounts equals the totalAmount
5. WHEN storing distribution data, THEN THE Saving_Service SHALL save it as JSON in the format {"1": 100, "3": 150, "6": 200}
6. WHEN calculating EVEN distribution, THEN THE Saving_Service SHALL handle remainders by adding them to the first month

### Requirement 3: Savings Approval and Version Creation

**User Story:** As a budget manager, I want to approve pending savings and create a new budget version, so that cost reductions are officially applied to the budget.

#### Acceptance Criteria

1. WHEN a user approves one or more savings, THEN THE Budget_Version_Service SHALL create a new budget version
2. WHEN creating a new version, THEN THE Budget_Version_Service SHALL copy all expenses from the current budget
3. WHEN creating a new version, THEN THE Budget_Version_Service SHALL copy all plan values from the current budget
4. WHEN applying savings, THEN THE Budget_Version_Service SHALL subtract each saving's monthly amounts from the corresponding expense plan values
5. WHEN a new version is created, THEN THE Budget_Version_Service SHALL increment the version number following the format v1.0, v1.1, v1.2
6. WHEN savings are successfully applied, THEN THE Saving_Service SHALL update the status of all approved savings to APPROVED
7. WHEN multiple savings apply to the same expense and month, THEN THE Budget_Version_Service SHALL apply all savings cumulatively

### Requirement 4: Savings Page Interface

**User Story:** As a budget manager, I want to view and manage all savings in one place, so that I can track cost reductions and approve them efficiently.

#### Acceptance Criteria

1. WHEN a user opens the Savings_Page, THEN THE Savings_Page SHALL display a list of all savings with columns for expense code, description, amount, status, and created date
2. WHEN displaying savings, THEN THE Savings_Page SHALL show both PENDING and APPROVED savings
3. WHEN a user clicks "Add New Saving", THEN THE Savings_Page SHALL display a form to create a new saving
4. WHEN a user selects one or more PENDING savings, THEN THE Savings_Page SHALL enable a "Bulk Approve" button
5. WHEN a user clicks "Bulk Approve", THEN THE Savings_Page SHALL display a confirmation dialog
6. WHEN a user confirms bulk approval, THEN THE Savings_Page SHALL send all selected saving IDs to the approval endpoint
7. WHEN a user clicks on a saving row, THEN THE Savings_Page SHALL display detailed information including monthly distribution breakdown

### Requirement 5: Savings Filtering and Search

**User Story:** As a budget manager, I want to filter savings by various criteria, so that I can quickly find specific cost reductions.

#### Acceptance Criteria

1. WHEN a user applies an expense filter, THEN THE Savings_Page SHALL display only savings associated with that expense
2. WHEN a user applies a budget filter, THEN THE Savings_Page SHALL display only savings associated with that budget
3. WHEN a user applies a status filter, THEN THE Savings_Page SHALL display only savings with the selected status (PENDING or APPROVED)
4. WHEN a user applies a date range filter, THEN THE Savings_Page SHALL display only savings created within that range
5. WHEN a user applies a user filter, THEN THE Savings_Page SHALL display only savings created by that user
6. WHEN multiple filters are applied, THEN THE Savings_Page SHALL display savings that match all filter criteria
7. WHEN a user clears filters, THEN THE Savings_Page SHALL display all savings

### Requirement 6: Data Validation

**User Story:** As a budget manager, I want the system to validate saving data, so that I can ensure cost reductions are accurate and properly formatted.

#### Acceptance Criteria

1. WHEN a user enters a totalAmount, THEN THE Saving_Service SHALL validate that the value is numeric and greater than zero
2. WHEN a user selects CUSTOM distribution, THEN THE Saving_Service SHALL validate that at least one month has a non-zero amount
3. WHEN a user selects CUSTOM distribution, THEN THE Saving_Service SHALL validate that the sum of monthly amounts equals the totalAmount
4. WHEN a user enters monthly amounts, THEN THE Saving_Service SHALL validate that all amounts are numeric and non-negative
5. WHEN validation errors exist, THEN THE Savings_Page SHALL display error messages and prevent saving
6. WHEN a user selects an expense, THEN THE Saving_Service SHALL validate that the expense exists in the specified budget

### Requirement 7: Permission-Based Access Control

**User Story:** As a system administrator, I want to restrict savings management to authorized users, so that budget modifications remain secure and controlled.

#### Acceptance Criteria

1. WHEN a user loads the Savings_Page, THEN THE Permission_Service SHALL check if the user has MODIFY permission for BUDGETS menu code
2. WHEN a user lacks MODIFY permission for BUDGETS menu, THEN THE Savings_Page SHALL display savings in read-only mode
3. WHEN a user lacks MODIFY permission for BUDGETS menu, THEN THE Savings_Page SHALL hide the "Add New Saving" and "Bulk Approve" buttons
4. WHEN a user has MODIFY permission for BUDGETS menu, THEN THE Savings_Page SHALL enable all savings management functionality
5. WHEN a user without MODIFY permission attempts to create or approve savings, THEN THE Saving_Service SHALL return an authorization error
