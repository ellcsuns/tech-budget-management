# Implementation Plan: Expense Management

## Overview

This implementation plan extends the existing ExpenseService with enhanced CRUD operations, custom tagging, and comprehensive search/filter capabilities. The frontend provides an expenses page with a detail modal for managing all expense attributes. Tasks build incrementally from backend enhancements to frontend components.

## Tasks

- [x] 1. Extend ExpenseService with search and filter methods
  - [x] 1.1 Add getAllExpenses method with filter support
    - Extend backend/src/services/ExpenseService.ts
    - Define ExpenseFilters interface
    - Implement query building for searchText, technologyDirectionIds, userAreaIds, financialCompanyId filters
    - Return expenses with related data (financialCompany, tags)
    - _Requirements: 4.1, 4.3, 4.4, 4.5, 4.6_
  
  - [x] 1.2 Add searchExpenses method
    - Implement case-insensitive search across code, shortDescription, longDescription
    - Include tag value matching in search
    - Use PostgreSQL ILIKE for partial matching
    - _Requirements: 4.1, 4.2_
  
  - [ ]* 1.3 Write property test for search text matching
    - **Property 4: Search Text Matching**
    - **Validates: Requirements 4.1**
  
  - [ ]* 1.4 Write property test for filter combination correctness
    - **Property 5: Filter Combination Correctness**
    - **Validates: Requirements 4.6**
  
  - [ ]* 1.5 Write unit tests for search and filter
    - Test search with exact and partial matches
    - Test each filter type individually
    - Test multiple filters combined
    - Test empty results
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

- [x] 2. Implement custom tag management in ExpenseService
  - [x] 2.1 Add custom tag methods
    - Implement addCustomTag() using TagDefinition with naming convention `custom:{expenseId}:{key}`
    - Implement updateCustomTag() to modify existing tag
    - Implement removeCustomTag() to delete tag
    - Implement getExpenseWithTags() to fetch expense with all custom tags
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  
  - [x] 2.2 Add tag validation logic
    - Validate tag key is not empty
    - Validate tag key uniqueness per expense
    - Validate tag value matches valueType (NUMBER, DATE)
    - _Requirements: 3.1, 6.6, 6.7_
  
  - [ ]* 2.3 Write property test for tag key uniqueness
    - **Property 3: Custom Tag Key Uniqueness Per Expense**
    - **Validates: Requirements 3.1, 3.4**
  
  - [ ]* 2.4 Write property test for tag value type consistency
    - **Property 9: Tag Value Type Consistency**
    - **Validates: Requirements 3.3**
  
  - [ ]* 2.5 Write unit tests for tag operations
    - Test adding tags with different value types
    - Test updating existing tags
    - Test removing tags
    - Test duplicate key rejection
    - Test empty key rejection
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 6.6_

- [x] 3. Enhance expense CRUD operations
  - [x] 3.1 Update createExpense validation
    - Ensure all required fields validated (code, shortDescription, longDescription, financialCompanyId)
    - Add specific error messages for each missing field
    - _Requirements: 1.1, 1.2, 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [x] 3.2 Update updateExpense method
    - Allow modification of all master data fields
    - Maintain code uniqueness validation
    - Update timestamp on modification
    - _Requirements: 1.3, 1.6_
  
  - [x] 3.3 Update deleteExpense to cascade tags
    - Ensure TagDefinitions with custom:{expenseId}: prefix are deleted
    - Ensure TagValues are deleted (already handled by cascade)
    - _Requirements: 1.4, 1.5_
  
  - [ ]* 3.4 Write property test for code uniqueness
    - **Property 1: Code Uniqueness**
    - **Validates: Requirements 1.2**
  
  - [ ]* 3.5 Write property test for required fields validation
    - **Property 2: Required Fields Validation**
    - **Validates: Requirements 7.1, 7.3, 7.4, 7.5**
  
  - [ ]* 3.6 Write property test for tag deletion cascade
    - **Property 6: Tag Deletion Cascade**
    - **Validates: Requirements 1.5**
  
  - [ ]* 3.7 Write unit tests for CRUD operations
    - Test create with all fields
    - Test create with missing required fields
    - Test update of each field
    - Test delete with confirmation
    - Test code uniqueness enforcement
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 4. Create API endpoints for expense management
  - [x] 4.1 Create expenses router and controller
    - Create backend/src/routes/expenses.ts (if not exists)
    - Create backend/src/controllers/ExpensesController.ts
    - Wire up ExpenseService in controller
    - _Requirements: 1.1_
  
  - [x] 4.2 Implement GET /api/expenses endpoint
    - Extract filter parameters from query string
    - Check VIEW or MODIFY permission for EXPENSES menu
    - Call expenseService.getAllExpenses()
    - Return 200 with expenses array
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 8.1, 8.2_
  
  - [x] 4.3 Implement GET /api/expenses/:id endpoint
    - Extract expense ID from params
    - Check VIEW or MODIFY permission for EXPENSES menu
    - Call expenseService.getExpenseWithTags()
    - Return 200 with expense or 404 if not found
    - _Requirements: 1.1, 8.1, 8.2_
  
  - [x] 4.4 Implement POST /api/expenses endpoint
    - Extract expense data from request body
    - Check MODIFY permission for EXPENSES menu
    - Call expenseService.createExpense()
    - Return 201 with created expense
    - _Requirements: 1.1, 1.2, 8.4, 8.5, 8.6_
  
  - [x] 4.5 Implement PUT /api/expenses/:id endpoint
    - Extract expense ID and data from request
    - Check MODIFY permission for EXPENSES menu
    - Call expenseService.updateExpense()
    - Return 200 with updated expense
    - _Requirements: 1.3, 1.6, 8.4, 8.5, 8.6_
  
  - [x] 4.6 Implement DELETE /api/expenses/:id endpoint
    - Extract expense ID from params
    - Check MODIFY permission for EXPENSES menu
    - Call expenseService.deleteExpense()
    - Return 204 on success
    - _Requirements: 1.4, 1.5, 8.4, 8.5, 8.6_
  
  - [x] 4.7 Implement POST /api/expenses/:id/tags endpoint
    - Extract expense ID and tag data from request
    - Check MODIFY permission for EXPENSES menu
    - Call expenseService.addCustomTag()
    - Return 201 with success
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 8.5, 8.6_
  
  - [x] 4.8 Implement PUT /api/expenses/:id/tags/:key endpoint
    - Extract expense ID, tag key, and new tag data
    - Check MODIFY permission for EXPENSES menu
    - Call expenseService.updateCustomTag()
    - Return 200 with success
    - _Requirements: 3.5, 8.5, 8.6_
  
  - [x] 4.9 Implement DELETE /api/expenses/:id/tags/:key endpoint
    - Extract expense ID and tag key
    - Check MODIFY permission for EXPENSES menu
    - Call expenseService.removeCustomTag()
    - Return 204 on success
    - _Requirements: 3.6, 8.5, 8.6_
  
  - [x] 4.10 Add error handling middleware
    - Handle validation errors (400)
    - Handle authorization errors (401, 403)
    - Handle not found errors (404)
    - Handle duplicate errors (409)
    - Handle database errors (500)
    - _Requirements: 6.7, 8.6_
  
  - [ ]* 4.11 Write integration tests for API endpoints
    - Test each endpoint with valid data
    - Test authorization checks
    - Test validation error responses
    - Test error handling
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [-] 5. Checkpoint - Ensure backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Create frontend types and API client
  - [ ] 6.1 Create TypeScript types for expenses
    - Create frontend/src/types/expense.ts
    - Define Expense, ExpenseInput, ExpenseFilters, CustomTag, ExpenseWithTags types
    - _Requirements: 1.1_
  
  - [ ] 6.2 Create API client methods
    - Create frontend/src/api/expensesApi.ts
    - Implement getAllExpenses(), getExpense(), createExpense(), updateExpense(), deleteExpense()
    - Implement addCustomTag(), updateCustomTag(), removeCustomTag()
    - _Requirements: 1.1, 1.3, 1.4, 3.1, 3.5, 3.6_

- [ ] 7. Implement SearchFilterBar component
  - [ ] 7.1 Create SearchFilterBar component structure
    - Create frontend/src/components/SearchFilterBar.tsx
    - Add search text input with real-time filtering
    - Add filter dropdowns for technology directions, user areas, financial company
    - Add "Clear Filters" button
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.8, 5.1_
  
  - [ ] 7.2 Implement real-time search
    - Use debounced input to trigger search on typing
    - Call onFilterChange callback with updated filters
    - _Requirements: 4.2_
  
  - [ ] 7.3 Implement filter combination logic
    - Allow multiple filters to be applied simultaneously
    - Display matching count
    - _Requirements: 4.6, 4.7_

- [ ] 8. Implement ExpensesTable component
  - [ ] 8.1 Create ExpensesTable component
    - Create frontend/src/components/ExpensesTable.tsx
    - Display columns: Code, Short Description, Tech Directions, User Areas, Financial Company, Tags
    - Show tag count or first few tags in Tags column
    - Add row click handler
    - _Requirements: 5.2, 5.3, 5.4_
  
  - [ ] 8.2 Add pagination
    - Implement pagination controls
    - Allow configurable page size
    - _Requirements: 5.5_

- [ ] 9. Implement CustomTagsSection component
  - [ ] 9.1 Create CustomTagsSection component
    - Create frontend/src/components/CustomTagsSection.tsx
    - Display existing tags as key-value pairs
    - Add "Add Tag" button
    - Show tag input fields when adding
    - Add remove button for each tag
    - _Requirements: 3.1, 3.4, 3.5, 3.6, 3.7, 6.2, 6.3_
  
  - [ ] 9.2 Implement tag value type selector
    - Add dropdown for TEXT, NUMBER, DATE, SELECT
    - Show appropriate input based on type
    - Validate value matches type
    - _Requirements: 3.3_
  
  - [ ] 9.3 Add tag validation
    - Validate tag key is not empty
    - Prevent duplicate keys
    - Validate value matches type
    - Display validation errors
    - _Requirements: 6.6, 6.7_

- [ ] 10. Implement ExpenseDetailModal component
  - [ ] 10.1 Create ExpenseDetailModal component structure
    - Create frontend/src/components/ExpenseDetailModal.tsx
    - Add form fields for all master data (code, descriptions, tech directions, user areas, financial company, parent expense)
    - Render CustomTagsSection
    - Add Save and Cancel buttons
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 6.1, 6.2, 6.6_
  
  - [ ] 10.2 Implement form validation
    - Validate all required fields
    - Display validation errors
    - Disable Save button when invalid
    - _Requirements: 6.5, 6.7, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  
  - [ ] 10.3 Implement save and cancel handlers
    - Call appropriate API method (create or update)
    - Handle success and error responses
    - Close modal on success
    - Display error messages
    - _Requirements: 6.5, 6.6_
  
  - [ ] 10.4 Support create and edit modes
    - Show empty form for create mode
    - Pre-populate form for edit mode
    - Adjust validation for each mode
    - _Requirements: 1.1, 1.3_

- [ ] 11. Implement ExpensesPage component
  - [ ] 11.1 Create ExpensesPage component
    - Create frontend/src/pages/ExpensesPage.tsx
    - Render SearchFilterBar at top
    - Render ExpensesTable below
    - Add "New Expense" button
    - Handle opening/closing ExpenseDetailModal
    - _Requirements: 5.1, 5.2, 5.6_
  
  - [ ] 11.2 Implement permission-based UI
    - Check user permissions on mount
    - Hide "New Expense" button if no MODIFY permission
    - Disable row editing if no MODIFY permission
    - Show read-only indicator if only VIEW permission
    - Show access denied if no VIEW permission
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [ ] 11.3 Implement data fetching and state management
    - Fetch expenses on mount
    - Refetch when filters change
    - Handle loading and error states
    - Update list after create/update/delete
    - _Requirements: 4.1, 4.2, 4.6_
  
  - [ ] 11.4 Add route for ExpensesPage
    - Add /expenses route to frontend router
    - Add navigation menu item
    - _Requirements: 5.1_

- [ ] 12. Implement delete confirmation dialog
  - [ ] 12.1 Create confirmation dialog component
    - Show dialog when delete is triggered
    - Display expense code in confirmation message
    - Add Confirm and Cancel buttons
    - _Requirements: 1.4_
  
  - [ ] 12.2 Wire up delete functionality
    - Call deleteExpense API on confirm
    - Refresh expenses list after deletion
    - Handle errors
    - _Requirements: 1.4, 1.5_

- [ ] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties using fast-check library
- Unit tests validate specific examples and edge cases
- The custom tagging system reuses existing TagDefinition and TagValue models with a naming convention
- Backend implementation should be completed before frontend to enable API testing
