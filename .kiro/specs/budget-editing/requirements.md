# Requirements Document: Budget Editing

## Introduction

This feature enables budget managers to edit budget plan values directly within the budget page interface. Users can modify existing budget cells, add or remove expense rows, and save changes as new budget versions. The system enforces permission-based access control and validates all input data before persisting changes.

## Glossary

- **Budget_Editor**: The frontend component that enables inline editing of budget cells
- **Budget_Cell**: An individual editable field representing a plan value for a specific expense and month
- **Plan_Value**: The projected budget amount for an expense in a given month
- **Budget_Version**: A snapshot of budget data at a specific point in time (format: v1.0, v1.1, v1.2)
- **Expense_Row**: A row in the budget table representing a single expense item
- **Permission_Service**: The authorization system that checks user access rights
- **Version_Service**: The backend service that creates new budget versions
- **Total_Column**: A calculated read-only column showing the sum of all monthly values for an expense

## Requirements

### Requirement 1: Inline Cell Editing

**User Story:** As a budget manager, I want to click on budget cells to edit plan values, so that I can quickly update projections without navigating to separate forms.

#### Acceptance Criteria

1. WHEN a user with MODIFY permission for BUDGETS menu clicks on a Budget_Cell, THEN THE Budget_Editor SHALL enable editing mode for that cell
2. WHEN a Budget_Cell is in editing mode, THEN THE Budget_Editor SHALL display a text input field with the current value
3. WHEN a user edits multiple Budget_Cells before saving, THEN THE Budget_Editor SHALL maintain all edited values in memory
4. WHEN a Budget_Cell has unsaved changes, THEN THE Budget_Editor SHALL display a visual indicator with yellow background color
5. WHEN a user clicks outside an edited Budget_Cell, THEN THE Budget_Editor SHALL preserve the edited value and exit editing mode
6. WHEN a user views the Total_Column, THEN THE Budget_Editor SHALL display calculated sums as read-only fields

### Requirement 2: Row Management

**User Story:** As a budget manager, I want to add and remove expense rows in the budget, so that I can adjust the budget structure to match current needs.

#### Acceptance Criteria

1. WHEN a user with MODIFY permission clicks an "Add Row" button, THEN THE Budget_Editor SHALL display a search interface for existing expenses
2. WHEN a user selects an expense from the search results, THEN THE Budget_Editor SHALL add a new Expense_Row to the budget table
3. WHEN a user clicks a "Remove" button on an Expense_Row, THEN THE Budget_Editor SHALL remove that row from the display
4. WHEN an Expense_Row is added or removed, THEN THE Budget_Editor SHALL mark the budget as having unsaved changes
5. WHEN searching for expenses, THEN THE Budget_Editor SHALL filter results based on user input text

### Requirement 3: Save and Version Control

**User Story:** As a budget manager, I want to save my changes as a new budget version, so that I can track the history of budget modifications.

#### Acceptance Criteria

1. WHEN there are unsaved changes in the budget, THEN THE Budget_Editor SHALL display a "Save" button
2. WHEN there are no unsaved changes, THEN THE Budget_Editor SHALL hide the "Save" button
3. WHEN a user clicks the "Save" button, THEN THE Budget_Editor SHALL display a confirmation dialog with the message "This will create a new budget version. Continue?"
4. WHEN a user confirms the save action, THEN THE Version_Service SHALL create a new version via POST /api/budgets/:budgetId/new-version endpoint
5. WHEN the Version_Service creates a new version, THEN THE Budget_Editor SHALL send planValueChanges as an array of objects containing expenseId, month, transactionValue, and transactionCurrency
6. WHEN a new version is successfully created, THEN THE Budget_Editor SHALL display the new version as the active budget
7. WHEN a new version is created, THEN THE Version_Service SHALL increment the version number following the format v1.0, v1.1, v1.2

### Requirement 4: Permission-Based Access Control

**User Story:** As a system administrator, I want to restrict budget editing to authorized users, so that budget data remains secure and controlled.

#### Acceptance Criteria

1. WHEN a user loads the budget page, THEN THE Permission_Service SHALL check if the user has MODIFY permission for BUDGETS menu code
2. WHEN a user lacks MODIFY permission for BUDGETS menu, THEN THE Budget_Editor SHALL render all Budget_Cells as read-only
3. WHEN a user lacks MODIFY permission for BUDGETS menu, THEN THE Budget_Editor SHALL display a lock icon or disabled state indicator
4. WHEN a user has MODIFY permission for BUDGETS menu, THEN THE Budget_Editor SHALL enable all editing functionality
5. WHEN a user without MODIFY permission attempts to edit a cell, THEN THE Budget_Editor SHALL prevent the action and maintain read-only state

### Requirement 5: Data Validation

**User Story:** As a budget manager, I want the system to validate my input, so that I can ensure budget data is accurate and properly formatted.

#### Acceptance Criteria

1. WHEN a user enters a value in a Budget_Cell, THEN THE Budget_Editor SHALL validate that the value is numeric
2. WHEN a user enters a non-numeric value, THEN THE Budget_Editor SHALL display an error message and prevent saving
3. WHEN a user enters a negative value, THEN THE Budget_Editor SHALL display an error message indicating values must be >= 0
4. WHEN a user enters a valid numeric value >= 0, THEN THE Budget_Editor SHALL accept the value and clear any error messages
5. WHEN validation errors exist, THEN THE Budget_Editor SHALL disable the "Save" button until all errors are resolved

### Requirement 6: Total Column Auto-Calculation

**User Story:** As a budget manager, I want the total column to automatically update when I edit monthly values, so that I can see the impact of my changes immediately.

#### Acceptance Criteria

1. WHEN a user edits any monthly Budget_Cell value in an Expense_Row, THEN THE Budget_Editor SHALL recalculate the Total_Column for that row
2. WHEN calculating the Total_Column, THEN THE Budget_Editor SHALL sum all monthly plan values for the Expense_Row
3. WHEN the Total_Column is displayed, THEN THE Budget_Editor SHALL render it as read-only and prevent direct editing
4. WHEN an Expense_Row has no monthly values, THEN THE Budget_Editor SHALL display zero in the Total_Column
5. WHEN monthly values are edited, THEN THE Budget_Editor SHALL update the Total_Column immediately without requiring a save action
