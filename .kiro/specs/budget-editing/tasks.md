# Implementation Plan: Budget Editing

## Overview

This implementation plan breaks down the budget editing feature into incremental coding tasks. The approach starts with core data structures and state management, then builds up the UI components, integrates permissions and validation, and finally implements the save/version control flow. Each task builds on previous work, with property-based tests integrated throughout to catch errors early.

## Tasks

- [x] 1. Set up types and state management infrastructure
  - Create TypeScript interfaces for BudgetEditState, ExpenseRow, CellEdit, and PlanValueChange
  - Add state hooks to BudgetsPage for managing edit state (editedCells Map, validationErrors Map, hasUnsavedChanges boolean)
  - Implement helper functions: getCellKey(expenseId, month), validateCellValue(value)
  - _Requirements: 1.3, 5.1, 5.4_

- [ ]* 1.1 Write property test for cell key generation
  - **Property: Cell key uniqueness**
  - **Validates: Requirements 1.3**

- [x] 2. Implement budget data loading and display
  - [x] 2.1 Add API method to budgetApi for fetching budget with expenses and plan values
    - Add getBudgetWithDetails(budgetId: string) method to api.ts
    - Method should fetch budget, expenses, and plan values in one call
    - _Requirements: 1.1, 6.2_
  
  - [x] 2.2 Create BudgetSelector component for choosing which budget to edit
    - Dropdown showing available budgets (year + version)
    - On selection, load budget details via getBudgetWithDetails
    - _Requirements: 1.1_
  
  - [x] 2.3 Transform API response into ExpenseRow format with 12-month plan values
    - Map expenses to ExpenseRow interface
    - Ensure each expense has plan values for months 1-12
    - _Requirements: 6.2_

- [ ]* 2.4 Write property test for expense row transformation
  - **Property 23: Total Calculation Correctness**
  - **Validates: Requirements 6.2**

- [x] 3. Build EditableCell component with inline editing
  - [x] 3.1 Create EditableCell component with click-to-edit behavior
    - Implement useState for isEditing and localValue
    - Handle click to enter edit mode, blur to exit
    - Handle Enter key to save, Escape key to cancel
    - _Requirements: 1.1, 1.2, 1.5_
  
  - [x] 3.2 Add visual indicators for edited and error states
    - Apply yellow background when isEdited prop is true
    - Apply red border when error prop exists
    - Show error message tooltip on hover
    - _Requirements: 1.4, 5.2_
  
  - [x] 3.3 Integrate EditableCell with parent state management
    - Call onChange prop with new value on blur/Enter
    - Receive value, isEdited, error, disabled props from parent
    - _Requirements: 1.3, 1.5_

- [ ]* 3.4 Write property tests for EditableCell behavior
  - **Property 1: Cell Edit Mode Activation**
  - **Property 2: Edit Mode Input Display**
  - **Property 5: Edit Mode Exit Preserves Value**
  - **Validates: Requirements 1.1, 1.2, 1.5**

- [x] 4. Implement cell editing logic in BudgetsPage
  - [x] 4.1 Create handleCellEdit function
    - Validate input using validateCellValue helper
    - Store edit in editedCells Map with key "expenseId-month"
    - Store validation error in validationErrors Map if invalid
    - Set hasUnsavedChanges to true
    - _Requirements: 1.3, 5.1, 5.2, 5.4_
  
  - [x] 4.2 Implement validateCellValue function
    - Check if value is numeric using isNaN
    - Check if value >= 0
    - Return { isValid: boolean, error?: string }
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ]* 4.3 Write property tests for validation logic
  - **Property 18: Numeric Input Validation**
  - **Property 19: Non-Numeric Input Error**
  - **Property 20: Valid Input Acceptance**
  - **Validates: Requirements 5.1, 5.2, 5.4**

- [ ]* 4.4 Write property test for multi-cell edit state
  - **Property 3: Multi-Cell Edit State Persistence**
  - **Validates: Requirements 1.3**

- [x] 5. Create BudgetTable component with TotalCell
  - [x] 5.1 Build BudgetTable component structure
    - Render table with columns: Code, Description, Jan-Dec, Total
    - Map expenses to table rows
    - Render EditableCell for each month column
    - _Requirements: 1.1, 1.6_
  
  - [x] 5.2 Create TotalCell component
    - Display calculated total as read-only text
    - Apply gray background to indicate non-editable
    - Format number with currency
    - _Requirements: 1.6, 6.3_
  
  - [x] 5.3 Implement calculateTotal function
    - Sum all 12 monthly values for an expense row
    - Include edited values from editedCells Map
    - Return 0 if no values exist
    - _Requirements: 6.2, 6.4_
  
  - [x] 5.4 Wire up total recalculation on cell edits
    - Call calculateTotal whenever editedCells Map changes
    - Use useMemo to optimize recalculation
    - _Requirements: 6.1, 6.5_

- [ ]* 5.5 Write property tests for total calculation
  - **Property 6: Total Column Read-Only**
  - **Property 22: Total Recalculation on Edit**
  - **Property 23: Total Calculation Correctness**
  - **Validates: Requirements 1.6, 6.1, 6.2, 6.3, 6.5**

- [x] 6. Checkpoint - Ensure basic editing works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Integrate permission checks
  - [x] 7.1 Add permission check in BudgetsPage
    - Import useAuth hook from AuthContext
    - Call hasPermission('BUDGETS', 'MODIFY')
    - Store result in canEdit state variable
    - _Requirements: 4.1, 4.2, 4.4_
  
  - [x] 7.2 Pass canEdit prop to BudgetTable and EditableCell
    - EditableCell should set disabled prop based on canEdit
    - BudgetTable should conditionally render edit controls
    - _Requirements: 4.2, 4.5_
  
  - [x] 7.3 Add visual indicators for disabled state
    - Show lock icon when canEdit is false
    - Apply disabled styling to cells
    - Show tooltip explaining permission requirement
    - _Requirements: 4.3_

- [ ]* 7.4 Write property tests for permission-based control
  - **Property 16: Permission-Based Editing Control**
  - **Property 17: Permission Visual Feedback**
  - **Validates: Requirements 4.2, 4.3, 4.4, 4.5**

- [x] 8. Implement row management (add/remove)
  - [x] 8.1 Create RowManager component with Add Row button
    - Render "Add Row" button (only if canEdit is true)
    - On click, open expense search modal
    - _Requirements: 2.1_
  
  - [x] 8.2 Build expense search modal
    - Input field for search query
    - Filter expenses based on query text (code or description)
    - Display filtered results in a list
    - On selection, call onAddRow callback with expense code
    - _Requirements: 2.1, 2.5_
  
  - [x] 8.3 Implement handleAddRow function in BudgetsPage
    - Call API to get expense details by code
    - Add expense to expenses state array
    - Initialize plan values to 0 for all 12 months
    - Set hasUnsavedChanges to true
    - _Requirements: 2.2, 2.4_
  
  - [x] 8.4 Add remove button to each expense row
    - Render remove button in each row (only if canEdit is true)
    - On click, call handleRemoveRow with expense ID
    - _Requirements: 2.3_
  
  - [x] 8.5 Implement handleRemoveRow function
    - Remove expense from expenses state array
    - Remove any edits for that expense from editedCells Map
    - Set hasUnsavedChanges to true
    - _Requirements: 2.3, 2.4_

- [ ]* 8.6 Write property tests for row management
  - **Property 7: Expense Row Addition**
  - **Property 8: Expense Row Removal**
  - **Property 9: Row Changes Mark Unsaved**
  - **Property 10: Expense Search Filtering**
  - **Validates: Requirements 2.2, 2.3, 2.4, 2.5**

- [x] 9. Implement save button and confirmation dialog
  - [x] 9.1 Create SaveButton component
    - Render button only when hasUnsavedChanges is true
    - Disable button when validationErrors Map is not empty
    - On click, call onSave callback
    - _Requirements: 3.1, 3.2, 5.5_
  
  - [x] 9.2 Create ConfirmationDialog component
    - Modal overlay with message prop
    - Two buttons: "Continue" and "Cancel"
    - Call onConfirm or onCancel callbacks
    - _Requirements: 3.3_
  
  - [x] 9.3 Wire up save flow in BudgetsPage
    - Add showConfirmDialog state
    - On SaveButton click, set showConfirmDialog to true
    - On confirm, call handleSave function
    - _Requirements: 3.3_

- [ ]* 9.4 Write property tests for save button visibility
  - **Property 11: Save Button Visibility**
  - **Property 21: Save Disabled With Errors**
  - **Validates: Requirements 3.1, 3.2, 5.5**

- [x] 10. Implement save and version creation
  - [x] 10.1 Add createNewVersion method to budgetApi
    - POST to /api/budgets/:budgetId/new-version
    - Send planValueChanges array in request body
    - Return new budget with updated version
    - _Requirements: 3.4, 3.5_
  
  - [x] 10.2 Implement handleSave function
    - Build planValueChanges array from editedCells Map
    - Each change should have: expenseId, month, transactionValue, transactionCurrency
    - Call budgetApi.createNewVersion with changes
    - _Requirements: 3.4, 3.5_
  
  - [x] 10.3 Handle successful save response
    - Update selectedBudget with new version
    - Reload budget details to get fresh data
    - Clear editedCells and validationErrors Maps
    - Set hasUnsavedChanges to false
    - Show success toast notification
    - _Requirements: 3.6_
  
  - [x] 10.4 Add error handling for save failures
    - Network errors: Show toast, keep unsaved changes
    - Permission errors (403): Show toast, disable editing
    - Version conflicts: Show dialog with refresh option
    - Validation errors: Display specific messages
    - _Requirements: Error Handling section_

- [ ]* 10.5 Write property tests for save flow
  - **Property 12: API Call Structure**
  - **Property 13: Plan Value Changes Payload Structure**
  - **Property 14: New Version Display**
  - **Validates: Requirements 3.4, 3.5, 3.6**

- [x] 11. Verify backend version increment logic
  - [x] 11.1 Review BudgetService.getNextVersion method
    - Verify it correctly parses version strings (v1.0, v1.1, etc.)
    - Verify it increments minor version number
    - Verify it handles edge cases (no existing versions, malformed versions)
    - _Requirements: 3.7_
  
  - [x] 11.2 Add unit tests for getNextVersion if missing
    - Test: v1.0 → v1.1
    - Test: v1.9 → v1.10
    - Test: No existing versions → v1.0
    - Test: Malformed version → v1.0
    - _Requirements: 3.7_

- [ ]* 11.3 Write property test for version increment
  - **Property 15: Version Number Increment**
  - **Validates: Requirements 3.7**

- [x] 12. Add browser refresh warning for unsaved changes
  - [x] 12.1 Implement beforeunload event listener
    - Add listener when hasUnsavedChanges becomes true
    - Remove listener when hasUnsavedChanges becomes false
    - Show browser confirmation: "You have unsaved changes"
    - _Requirements: Error Handling section_

- [x] 13. Checkpoint - Ensure all functionality works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Add visual polish and UX improvements
  - [x] 14.1 Add loading states
    - Show spinner while loading budget details
    - Show spinner on save button while saving
    - Disable all inputs during save operation
    - _Requirements: UX improvement_
  
  - [x] 14.2 Add success/error toast notifications
    - Success: "Budget version {version} created successfully"
    - Error: Specific error messages from API
    - Use existing toast notification system if available
    - _Requirements: Error Handling section_
  
  - [x] 14.3 Improve table styling and responsiveness
    - Add hover effects on editable cells
    - Ensure table is scrollable horizontally on small screens
    - Add sticky header for long expense lists
    - _Requirements: UX improvement_

- [x] 15. Final integration testing
  - [ ]* 15.1 Write integration tests for complete editing flow
    - Test: Load budget → edit cells → save → verify new version
    - Test: Add row → edit values → remove row → verify state
    - Test: Enter invalid values → verify save blocked → fix → verify save enabled
    - _Requirements: All requirements_
  
  - [ ]* 15.2 Write integration tests for permission scenarios
    - Test: User with permission can edit
    - Test: User without permission sees read-only view
    - Test: Permission changes during session
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 16. Final checkpoint - Complete feature verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based and integration tests
- Each property test should run minimum 100 iterations
- Use fast-check library for property-based testing in TypeScript
- The existing backend endpoint POST /api/budgets/:budgetId/new-version is already implemented
- Permission checking uses existing AuthContext.hasPermission method
- Focus on incremental progress - each task should result in working, testable code
