# Implementation Plan: Savings Module

## Overview

This implementation plan breaks down the Savings Module into discrete coding tasks. Each task builds on previous steps, starting with database schema updates, then backend services, API endpoints, and finally frontend components. Testing tasks are included as optional sub-tasks to validate functionality incrementally.

## Tasks

- [-] 1. Update database schema and generate Prisma client
  - Add Saving model to schema.prisma with all fields (id, expenseId, budgetId, totalAmount, description, status, monthlyDistribution, createdAt, createdBy, approvedAt)
  - Add SavingStatus enum (PENDING, APPROVED)
  - Add savings relation to Budget, Expense, and User models
  - Run prisma migrate dev to create migration
  - Run prisma generate to update client
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 2. Implement SavingService with distribution logic
  - [ ] 2.1 Create SavingService class with constructor
    - Create backend/src/services/SavingService.ts
    - Define SavingInput and MonthlyDistribution interfaces
    - Implement constructor accepting PrismaClient
    - _Requirements: 1.1_
  
  - [ ] 2.2 Implement distribution calculation methods
    - Implement calculateMonthlyDistribution() for EVEN strategy
    - Implement calculateMonthlyDistribution() for SINGLE_MONTH strategy
    - Implement calculateMonthlyDistribution() for CUSTOM strategy
    - Implement validateCustomDistribution() method
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  
  - [ ]* 2.3 Write property test for EVEN distribution
    - **Property 2: EVEN Distribution Correctness**
    - **Validates: Requirements 2.1, 2.6**
  
  - [ ]* 2.4 Write property test for SINGLE_MONTH distribution
    - **Property 3: SINGLE_MONTH Distribution Isolation**
    - **Validates: Requirements 2.2**
  
  - [ ]* 2.5 Write property test for CUSTOM distribution validation
    - **Property 1: Distribution Sum Consistency**
    - **Validates: Requirements 2.4**
  
  - [ ] 2.6 Implement createSaving method
    - Validate totalAmount > 0
    - Calculate monthly distribution based on strategy
    - Create saving record with PENDING status
    - Store userId as createdBy
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.1, 6.2, 6.3, 6.4_
  
  - [ ]* 2.7 Write unit tests for createSaving validation
    - Test negative amount rejection
    - Test zero amount rejection
    - Test invalid expense ID
    - Test invalid budget ID
    - _Requirements: 1.5, 6.1, 6.6_

- [ ] 3. Implement savings approval and version creation
  - [ ] 3.1 Implement approveSavings method in SavingService
    - Validate all savings exist and are PENDING
    - Group savings by budgetId
    - Aggregate monthly distributions per expense
    - Build planValueChanges array with negative amounts
    - Call BudgetService.createNewVersion()
    - Update savings status to APPROVED
    - Set approvedAt timestamp
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_
  
  - [ ]* 3.2 Write property test for version creation with savings
    - **Property 5: Version Creation with Savings**
    - **Validates: Requirements 3.4**
  
  - [ ]* 3.3 Write property test for multiple savings cumulative application
    - **Property 6: Multiple Savings Cumulative Application**
    - **Validates: Requirements 3.7**
  
  - [ ]* 3.4 Write property test for approval idempotence
    - **Property 4: Approval Idempotence**
    - **Validates: Requirements 3.6**
  
  - [ ]* 3.5 Write unit tests for approval error cases
    - Test approving already-approved savings
    - Test approving non-existent savings
    - Test version creation failure rollback
    - _Requirements: 3.6_

- [ ] 4. Implement savings query and filter methods
  - [ ] 4.1 Implement getSavings method with filters
    - Accept filters: expenseId, budgetId, status, dateRange, createdBy
    - Build Prisma where clause from filters
    - Return savings with related expense and budget data
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
  
  - [ ] 4.2 Implement getSavingById method
    - Fetch saving with related data
    - Return null if not found
    - _Requirements: 4.7_
  
  - [ ] 4.3 Implement deleteSaving method
    - Validate saving exists
    - Delete saving record
    - _Requirements: 1.6_
  
  - [ ]* 4.4 Write property test for filter combination correctness
    - **Property 10: Filter Combination Correctness**
    - **Validates: Requirements 5.6**
  
  - [ ]* 4.5 Write unit tests for query methods
    - Test getSavings with each filter type
    - Test getSavings with multiple filters
    - Test getSavingById with valid/invalid IDs
    - Test deleteSaving with valid/invalid IDs
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.7_

- [ ] 5. Create API endpoints for savings
  - [ ] 5.1 Create savings router and controller
    - Create backend/src/routes/savings.ts
    - Create backend/src/controllers/SavingsController.ts
    - Wire up SavingService in controller
    - _Requirements: 1.1_
  
  - [ ] 5.2 Implement POST /api/savings endpoint
    - Extract saving data from request body
    - Get userId from session
    - Check MODIFY permission for BUDGETS menu
    - Call savingService.createSaving()
    - Return 201 with created saving
    - _Requirements: 1.1, 1.2, 1.3, 7.4, 7.5_
  
  - [ ] 5.3 Implement GET /api/savings endpoint
    - Extract filter parameters from query string
    - Check VIEW or MODIFY permission for BUDGETS menu
    - Call savingService.getSavings()
    - Return 200 with savings array
    - _Requirements: 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
  
  - [ ] 5.4 Implement GET /api/savings/:id endpoint
    - Extract saving ID from params
    - Check VIEW or MODIFY permission for BUDGETS menu
    - Call savingService.getSavingById()
    - Return 200 with saving or 404 if not found
    - _Requirements: 4.7_
  
  - [ ] 5.5 Implement POST /api/savings/approve endpoint
    - Extract saving IDs from request body
    - Check MODIFY permission for BUDGETS menu
    - Call savingService.approveSavings()
    - Return 200 with new budget version
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 7.4, 7.5_
  
  - [ ] 5.6 Implement DELETE /api/savings/:id endpoint
    - Extract saving ID from params
    - Check MODIFY permission for BUDGETS menu
    - Call savingService.deleteSaving()
    - Return 204 on success
    - _Requirements: 1.6, 7.4, 7.5_
  
  - [ ] 5.7 Add error handling middleware
    - Handle validation errors (400)
    - Handle authorization errors (401, 403)
    - Handle not found errors (404)
    - Handle business logic errors (409)
    - Handle database errors (500)
    - _Requirements: 6.5, 7.5_
  
  - [ ]* 5.8 Write integration tests for API endpoints
    - Test each endpoint with valid data
    - Test authorization checks
    - Test validation error responses
    - Test error handling
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 6. Checkpoint - Ensure backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Create frontend types and API client
  - [ ] 7.1 Create TypeScript types for savings
    - Create frontend/src/types/saving.ts
    - Define Saving, SavingInput, SavingFilters, DistributionStrategy types
    - _Requirements: 1.1_
  
  - [ ] 7.2 Create API client methods
    - Create frontend/src/api/savingsApi.ts
    - Implement createSaving(), getSavings(), getSavingById(), approveSavings(), deleteSaving()
    - _Requirements: 1.1, 4.1, 4.7, 3.1_

- [ ] 8. Implement SavingForm component
  - [ ] 8.1 Create SavingForm component structure
    - Create frontend/src/components/SavingForm.tsx
    - Add form fields: expense selector, totalAmount, description
    - Add distribution strategy selector
    - _Requirements: 1.1, 1.2, 1.5, 2.1, 2.2, 2.3_
  
  - [ ] 8.2 Implement DistributionSelector component
    - Create frontend/src/components/DistributionSelector.tsx
    - Add radio buttons for EVEN, SINGLE_MONTH, CUSTOM
    - Show month selector for SINGLE_MONTH
    - Show 12 input fields for CUSTOM
    - Calculate and display distribution preview
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [ ] 8.3 Add form validation
    - Validate totalAmount > 0
    - Validate expense selected
    - Validate CUSTOM distribution sums to totalAmount
    - Display validation errors
    - Disable submit button when invalid
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ] 8.4 Implement form submission
    - Call createSaving API on submit
    - Show success message
    - Call onSave callback
    - Handle errors and display messages
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 9. Implement SavingsList component
  - [ ] 9.1 Create SavingsList component structure
    - Create frontend/src/components/SavingsList.tsx
    - Display table with columns: expense code, description, amount, status, created date
    - Add checkboxes for row selection
    - _Requirements: 4.1, 4.2_
  
  - [ ] 9.2 Add filter controls
    - Add expense filter dropdown
    - Add budget filter dropdown
    - Add status filter dropdown
    - Add date range picker
    - Add user filter dropdown
    - Add clear filters button
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
  
  - [ ] 9.3 Implement bulk approve functionality
    - Show "Bulk Approve" button when PENDING savings selected
    - Display confirmation dialog on click
    - Call approveSavings API on confirm
    - Refresh list after approval
    - _Requirements: 4.3, 4.4, 4.5, 4.6_
  
  - [ ] 9.4 Add row click handler for detail view
    - Open SavingDetail modal on row click
    - Pass saving data to modal
    - _Requirements: 4.7_

- [ ] 10. Implement SavingDetail component
  - [ ] 10.1 Create SavingDetail modal component
    - Create frontend/src/components/SavingDetail.tsx
    - Display all saving fields
    - Show monthly distribution breakdown table
    - Add close button
    - _Requirements: 4.7_
  
  - [ ] 10.2 Format monthly distribution display
    - Show table with Month and Amount columns
    - Display only months with non-zero amounts
    - Show total at bottom
    - _Requirements: 4.7_

- [ ] 11. Implement SavingsPage component
  - [ ] 11.1 Create SavingsPage component
    - Create frontend/src/pages/SavingsPage.tsx
    - Add "Add New Saving" button at top
    - Render SavingsList component
    - Handle opening/closing SavingForm modal
    - _Requirements: 4.1, 4.3_
  
  - [ ] 11.2 Implement permission-based UI
    - Check user permissions on mount
    - Hide "Add New Saving" button if no MODIFY permission
    - Hide "Bulk Approve" button if no MODIFY permission
    - Show read-only indicator if no MODIFY permission
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [ ] 11.3 Add route for SavingsPage
    - Add /savings route to frontend router
    - Add navigation menu item
    - _Requirements: 4.1_

- [ ] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties using fast-check library
- Unit tests validate specific examples and edge cases
- Backend implementation should be completed before frontend to enable API testing
