# Design Document: Expense Management

## Overview

The Expense Management feature provides a comprehensive interface for creating, editing, and organizing expenses with both predefined master data fields and flexible custom tagging. The system extends the existing ExpenseService with enhanced CRUD operations, search/filter capabilities, and a custom tagging system that allows users to add arbitrary key-value metadata to expenses.

## Architecture

The module follows the existing three-tier architecture:

1. **Data Layer**: PostgreSQL with Prisma ORM (existing Expense, TagDefinition, TagValue models)
2. **Service Layer**: Enhanced ExpenseService with search, filter, and tag management
3. **API Layer**: Express REST endpoints for expense operations
4. **Frontend Layer**: React components for expenses page, detail modal, and search/filter UI

The custom tagging system leverages the existing TagDefinition and TagValue models but extends them to support expense-specific custom tags.

## Components and Interfaces

### Backend Service: Enhanced ExpenseService

```typescript
interface ExpenseFilters {
  searchText?: string;
  technologyDirectionIds?: string[];
  userAreaIds?: string[];
  financialCompanyId?: string;
  parentExpenseId?: string;
  hasTag?: { key: string; value?: string };
}

interface CustomTag {
  key: string;
  value: string | number | Date;
  valueType: 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT';
}

interface ExpenseWithTags extends Expense {
  customTags: CustomTag[];
}

class ExpenseService {
  // Existing methods
  async createExpense(budgetId: string, data: ExpenseInput): Promise<Expense>
  async getExpense(id: string): Promise<Expense | null>
  async updateExpense(id: string, data: Partial<ExpenseInput>): Promise<Expense>
  async deleteExpense(id: string): Promise<void>
  
  // New methods for expense management
  async getAllExpenses(filters?: ExpenseFilters): Promise<ExpenseWithTags[]>
  async searchExpenses(searchText: string): Promise<ExpenseWithTags[]>
  
  // Custom tag methods
  async addCustomTag(expenseId: string, tag: CustomTag): Promise<void>
  async updateCustomTag(expenseId: string, tagKey: string, newTag: CustomTag): Promise<void>
  async removeCustomTag(expenseId: string, tagKey: string): Promise<void>
  async getExpenseWithTags(expenseId: string): Promise<ExpenseWithTags>
}
```

### Custom Tag Storage Strategy

Custom tags will be stored using the existing TagDefinition and TagValue models with a special naming convention:

- **TagDefinition**: Create on-demand with name format `custom:{expenseId}:{key}`
- **TagValue**: Store the actual value as JSON
- **inputType**: Set to FREE_TEXT for custom tags
- **Cleanup**: When expense is deleted, cascade delete removes associated TagDefinitions and TagValues

This approach:
- Reuses existing infrastructure
- Maintains referential integrity
- Supports querying and filtering
- Allows future migration to dedicated custom tag tables if needed

### API Endpoints

```
GET    /api/expenses                   - List all expenses with filters
GET    /api/expenses/:id               - Get expense details with tags
POST   /api/expenses                   - Create new expense
PUT    /api/expenses/:id               - Update expense
DELETE /api/expenses/:id               - Delete expense
POST   /api/expenses/:id/tags          - Add custom tag
PUT    /api/expenses/:id/tags/:key     - Update custom tag
DELETE /api/expenses/:id/tags/:key     - Remove custom tag
```

### Frontend Components

```typescript
// Main expenses page
interface ExpensesPageProps {}
const ExpensesPage: React.FC<ExpensesPageProps>

// Search and filter bar
interface SearchFilterBarProps {
  onFilterChange: (filters: ExpenseFilters) => void;
  onClearFilters: () => void;
}
const SearchFilterBar: React.FC<SearchFilterBarProps>

// Expenses table
interface ExpensesTableProps {
  expenses: ExpenseWithTags[];
  onRowClick: (expense: ExpenseWithTags) => void;
}
const ExpensesTable: React.FC<ExpensesTableProps>

// Expense detail modal
interface ExpenseDetailModalProps {
  expense?: ExpenseWithTags;
  mode: 'create' | 'edit' | 'view';
  onSave: (expense: ExpenseInput) => void;
  onClose: () => void;
}
const ExpenseDetailModal: React.FC<ExpenseDetailModalProps>

// Custom tags section
interface CustomTagsSectionProps {
  tags: CustomTag[];
  onAddTag: (tag: CustomTag) => void;
  onUpdateTag: (oldKey: string, newTag: CustomTag) => void;
  onRemoveTag: (key: string) => void;
  readOnly: boolean;
}
const CustomTagsSection: React.FC<CustomTagsSectionProps>
```

## Data Models

### Expense Entity (Existing)

```typescript
interface Expense {
  id: string;
  budgetId: string;
  code: string;
  shortDescription: string;
  longDescription: string;
  technologyDirections: string[]; // Array of IDs
  userAreas: string[]; // Array of IDs
  financialCompanyId: string;
  parentExpenseId?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Custom Tag Entity

```typescript
interface CustomTag {
  key: string;
  value: string | number | Date;
  valueType: 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT';
}
```

### Search and Filter Logic

**Search Text Matching**:
- Match against: code, shortDescription, longDescription
- Match against: custom tag keys and values
- Case-insensitive partial matching
- Use PostgreSQL ILIKE or full-text search

**Filter Combination**:
- All filters are AND conditions
- Array filters (tech directions, user areas) use ANY matching
- Search text is combined with filters using AND

**Query Example**:
```sql
SELECT * FROM Expense e
WHERE 
  (e.code ILIKE '%search%' OR e.shortDescription ILIKE '%search%')
  AND e.financialCompanyId = 'filter-company-id'
  AND e.technologyDirections && ARRAY['tech-id-1', 'tech-id-2']
  AND EXISTS (
    SELECT 1 FROM TagValue tv
    WHERE tv.expenseId = e.id
    AND tv.value::text ILIKE '%tag-search%'
  )
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Code Uniqueness
*For any* two expenses in the system, they should have different expense codes.
**Validates: Requirements 1.2**

### Property 2: Required Fields Validation
*For any* expense creation or update, if any required field (code, shortDescription, longDescription, financialCompanyId) is missing or empty, the operation should fail with a validation error.
**Validates: Requirements 7.1, 7.3, 7.4, 7.5**

### Property 3: Custom Tag Key Uniqueness Per Expense
*For any* expense, all custom tag keys should be unique within that expense (no duplicate keys).
**Validates: Requirements 3.1, 3.4**

### Property 4: Search Text Matching
*For any* search text and expense, if the expense code, short description, long description, or any tag value contains the search text (case-insensitive), then the expense should appear in search results.
**Validates: Requirements 4.1**

### Property 5: Filter Combination Correctness
*For any* combination of filters applied simultaneously, the returned expenses should satisfy all filter criteria (AND logic).
**Validates: Requirements 4.6**

### Property 6: Tag Deletion Cascade
*For any* expense that is deleted, all associated custom tags should also be deleted from the database.
**Validates: Requirements 1.5**

### Property 7: Real-Time Search Updates
*For any* search text modification, the displayed results should update to reflect the new search criteria without requiring a manual refresh action.
**Validates: Requirements 4.2**

### Property 8: Master Data Reference Integrity
*For any* expense, all referenced master data entities (technology directions, user areas, financial company) should exist in their respective tables.
**Validates: Requirements 2.4, 2.5, 2.6**

### Property 9: Tag Value Type Consistency
*For any* custom tag with valueType NUMBER, the stored value should be parseable as a number; for DATE, it should be a valid date.
**Validates: Requirements 3.3**

### Property 10: Permission-Based Access Control
*For any* user without MODIFY permission for EXPENSES menu, all expense modification operations (create, update, delete, tag management) should fail with an authorization error.
**Validates: Requirements 8.6**

## Error Handling

### Validation Errors

- **Empty Required Field**: Return 400 with message "Field {fieldName} is required"
- **Duplicate Code**: Return 409 with message "Expense code already exists"
- **Invalid Reference**: Return 404 with message "{EntityType} not found"
- **Empty Tag Key**: Return 400 with message "Tag key cannot be empty"
- **Invalid Tag Value Type**: Return 400 with message "Tag value does not match specified type"

### Authorization Errors

- **No VIEW Permission**: Return 403 with message "User lacks VIEW permission for EXPENSES"
- **No MODIFY Permission**: Return 403 with message "User lacks MODIFY permission for EXPENSES"
- **Not Authenticated**: Return 401 with message "User not authenticated"

### Business Logic Errors

- **Expense Not Found**: Return 404 with message "Expense not found"
- **Tag Not Found**: Return 404 with message "Tag not found on expense"
- **Duplicate Tag Key**: Return 409 with message "Tag key already exists on this expense"

### Database Errors

- **Transaction Failure**: Rollback and return 500 with message "Database operation failed"
- **Constraint Violation**: Return 409 with message describing the constraint

## Testing Strategy

### Unit Tests

Unit tests should focus on specific examples, edge cases, and error conditions:

- Test expense creation with all required fields
- Test expense creation with missing required fields (each field)
- Test code uniqueness validation
- Test custom tag addition, update, and removal
- Test tag key uniqueness within an expense
- Test search with exact matches and partial matches
- Test each filter type individually (tech direction, user area, financial company)
- Test filter combinations (2-3 filters together)
- Test expense deletion cascades to tags
- Test authorization checks (with/without permissions)
- Test invalid reference IDs (non-existent tech direction, user area, etc.)
- Test tag value type validation (number, date)

### Property-Based Tests

Property-based tests should verify universal properties across all inputs. Each test should run a minimum of 100 iterations and be tagged with the corresponding design property.

**Configuration**: Use fast-check library for TypeScript property-based testing.

**Test Tags**: Each property test must include a comment:
```typescript
// Feature: expense-management, Property 1: Code Uniqueness
```

**Property Test Examples**:

1. **Code Uniqueness** (Property 1)
   - Generate random set of expenses
   - Verify all codes are unique

2. **Required Fields Validation** (Property 2)
   - Generate random expense data with one required field missing
   - Verify creation fails

3. **Custom Tag Key Uniqueness** (Property 3)
   - Generate random expense with tags
   - Attempt to add duplicate tag key
   - Verify operation fails

4. **Search Text Matching** (Property 4)
   - Generate random expenses with various text content
   - Generate random search text
   - Verify all returned expenses contain search text

5. **Filter Combination Correctness** (Property 5)
   - Generate random expenses
   - Apply random filter combinations
   - Verify all returned expenses match all filters

6. **Tag Deletion Cascade** (Property 6)
   - Create expense with tags
   - Delete expense
   - Verify tags are also deleted

7. **Permission-Based Access Control** (Property 10)
   - Generate random user without MODIFY permission
   - Attempt random modification operation
   - Verify operation fails with authorization error

**Test Implementation Requirements**:
- Each correctness property MUST be implemented by a SINGLE property-based test
- Each test MUST run minimum 100 iterations
- Each test MUST be tagged with feature name and property number
- Property tests and unit tests are complementary (both required)
