# Design Document: Budget Editing

## Overview

The budget editing feature transforms the BudgetsPage from a read-only list view into an interactive budget editor with inline cell editing, row management, and version control. The design leverages React's state management for tracking edits, integrates with the existing AuthContext for permission checks, and uses the existing backend endpoint for creating new budget versions.

The architecture follows a component-based approach where the main BudgetsPage orchestrates multiple sub-components: BudgetTable (displays the grid), EditableCell (handles individual cell editing), and RowManager (handles adding/removing rows). All changes are tracked in memory until the user explicitly saves, at which point a new budget version is created via the existing API.

## Architecture

### High-Level Component Structure

```
BudgetsPage (Container)
├── BudgetSelector (Select budget to edit)
├── BudgetTable (Main editing grid)
│   ├── EditableCell[] (Individual editable cells)
│   ├── TotalCell[] (Read-only calculated totals)
│   └── RowActions (Add/Remove row buttons)
├── SaveButton (Appears when changes exist)
└── ConfirmationDialog (Version creation confirmation)
```

### State Management

The BudgetsPage component maintains the following state:

```typescript
interface BudgetEditState {
  selectedBudget: Budget | null;
  expenses: ExpenseRow[];
  editedCells: Map<string, CellEdit>; // key: "expenseId-month"
  hasUnsavedChanges: boolean;
  validationErrors: Map<string, string>;
  isLoading: boolean;
  isSaving: boolean;
}

interface ExpenseRow {
  id: string;
  code: string;
  description: string;
  planValues: PlanValue[]; // 12 months
  isNew: boolean; // Track if row was added in this session
}

interface CellEdit {
  expenseId: string;
  month: number;
  value: number;
  currency: string;
  isValid: boolean;
}
```

### Permission Integration

The design integrates with the existing AuthContext:

```typescript
const { hasPermission } = useAuth();
const canEdit = hasPermission('BUDGETS', 'MODIFY');
```

All editing functionality is conditionally rendered based on this permission check.

## Components and Interfaces

### 1. BudgetsPage (Main Container)

**Responsibilities:**
- Load budget data and expenses
- Manage edit state and validation
- Coordinate save operations
- Handle permission checks

**Key Methods:**
```typescript
loadBudgetDetails(budgetId: string): Promise<void>
handleCellEdit(expenseId: string, month: number, value: string): void
validateCell(value: string): { isValid: boolean; error?: string }
handleSave(): Promise<void>
handleAddRow(expenseCode: string): Promise<void>
handleRemoveRow(expenseId: string): void
calculateTotal(expenseRow: ExpenseRow): number
```

**Data Flow:**
1. User selects a budget → loadBudgetDetails() fetches expenses and plan values
2. User edits cell → handleCellEdit() validates and stores in editedCells map
3. User clicks save → handleSave() calls API with planValueChanges array
4. API returns new version → reload budget details with new version

### 2. BudgetTable Component

**Props:**
```typescript
interface BudgetTableProps {
  expenses: ExpenseRow[];
  editedCells: Map<string, CellEdit>;
  validationErrors: Map<string, string>;
  canEdit: boolean;
  onCellEdit: (expenseId: string, month: number, value: string) => void;
  onRemoveRow: (expenseId: string) => void;
}
```

**Rendering Logic:**
- Renders a table with 14 columns: Expense Code, Description, Jan-Dec (12 months), Total
- Each cell is either an EditableCell (if canEdit) or plain text
- Total column always renders as TotalCell (read-only)
- Each row has a remove button (if canEdit)

### 3. EditableCell Component

**Props:**
```typescript
interface EditableCellProps {
  value: number;
  isEdited: boolean;
  error?: string;
  disabled: boolean;
  onChange: (value: string) => void;
}
```

**Behavior:**
- Displays value as text by default
- On click, converts to input field
- On blur or Enter key, exits edit mode
- Shows yellow background if isEdited is true
- Shows red border if error exists
- Validates input on change

**Implementation:**
```typescript
const [isEditing, setIsEditing] = useState(false);
const [localValue, setLocalValue] = useState(value.toString());

const handleBlur = () => {
  setIsEditing(false);
  onChange(localValue);
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    handleBlur();
  } else if (e.key === 'Escape') {
    setLocalValue(value.toString());
    setIsEditing(false);
  }
};
```

### 4. TotalCell Component

**Props:**
```typescript
interface TotalCellProps {
  total: number;
  currency: string;
}
```

**Behavior:**
- Displays calculated total
- Always read-only
- Styled differently to indicate non-editable state (gray background)

### 5. RowManager Component

**Props:**
```typescript
interface RowManagerProps {
  budgetId: string;
  onAddRow: (expenseCode: string) => void;
}
```

**Behavior:**
- Renders "Add Row" button
- On click, shows expense search modal
- Search modal queries existing expenses from the system
- User selects expense → calls onAddRow with expense code

### 6. ConfirmationDialog Component

**Props:**
```typescript
interface ConfirmationDialogProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}
```

**Behavior:**
- Modal overlay with message
- Two buttons: "Continue" and "Cancel"
- Blocks interaction with background until dismissed

## Data Models

### Frontend Types

```typescript
interface Budget {
  id: string;
  year: number;
  version: string;
  createdAt: string;
}

interface Expense {
  id: string;
  budgetId: string;
  code: string;
  shortDescription: string;
  longDescription: string;
  planValues: PlanValue[];
}

interface PlanValue {
  id: string;
  expenseId: string;
  month: number; // 1-12
  transactionValue: number;
  transactionCurrency: string;
  usdValue: number;
  conversionRate: number;
}

interface PlanValueChange {
  expenseId: string;
  month: number;
  transactionValue: number;
  transactionCurrency: string;
}
```

### API Request/Response

**Create New Version Request:**
```typescript
POST /api/budgets/:budgetId/new-version
{
  planValueChanges: [
    {
      expenseId: "expense-123",
      month: 1,
      transactionValue: 5000,
      transactionCurrency: "USD"
    },
    // ... more changes
  ]
}
```

**Response:**
```typescript
{
  id: "new-budget-id",
  year: 2024,
  version: "v1.1",
  createdAt: "2024-01-15T10:30:00Z",
  expenses: [...],
  conversionRates: [...]
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Cell Edit Mode Activation
*For any* budget cell with user having MODIFY permission, clicking the cell should enable editing mode for that specific cell.
**Validates: Requirements 1.1**

### Property 2: Edit Mode Input Display
*For any* budget cell in editing mode, the rendered output should contain a text input field displaying the current cell value.
**Validates: Requirements 1.2**

### Property 3: Multi-Cell Edit State Persistence
*For any* sequence of cell edits before saving, all edited values should be preserved in the application state without loss.
**Validates: Requirements 1.3**

### Property 4: Edited Cell Visual Indicator
*For any* budget cell with unsaved changes, the cell should display with a yellow background color.
**Validates: Requirements 1.4**

### Property 5: Edit Mode Exit Preserves Value
*For any* edited budget cell, triggering a blur event should preserve the edited value and exit editing mode.
**Validates: Requirements 1.5**

### Property 6: Total Column Read-Only
*For any* total column cell, the cell should never enter edit mode regardless of user interactions.
**Validates: Requirements 1.6, 6.3**

### Property 7: Expense Row Addition
*For any* expense selected from search results, the expense should appear as a new row in the budget table.
**Validates: Requirements 2.2**

### Property 8: Expense Row Removal
*For any* expense row in the budget table, clicking the remove button should remove that row from the display.
**Validates: Requirements 2.3**

### Property 9: Row Changes Mark Unsaved
*For any* row addition or removal operation, the budget should be marked as having unsaved changes.
**Validates: Requirements 2.4**

### Property 10: Expense Search Filtering
*For any* expense list and search query text, the filtered results should only include expenses matching the query.
**Validates: Requirements 2.5**

### Property 11: Save Button Visibility
*For any* budget state, the save button should be visible if and only if there are unsaved changes.
**Validates: Requirements 3.1, 3.2**

### Property 12: API Call Structure
*For any* save confirmation, the API call should use POST method to /api/budgets/:budgetId/new-version endpoint.
**Validates: Requirements 3.4**

### Property 13: Plan Value Changes Payload Structure
*For any* set of cell edits, the API payload should contain a planValueChanges array where each element has expenseId, month, transactionValue, and transactionCurrency fields.
**Validates: Requirements 3.5**

### Property 14: New Version Display
*For any* successful version creation, the UI should update to display the newly created version as the active budget.
**Validates: Requirements 3.6**

### Property 15: Version Number Increment
*For any* existing budget version, creating a new version should increment the minor version number following the pattern v{major}.{minor+1}.
**Validates: Requirements 3.7**

### Property 16: Permission-Based Editing Control
*For any* user, all editing functionality (cell editing, row management, save button) should be enabled if and only if the user has MODIFY permission for BUDGETS menu code.
**Validates: Requirements 4.2, 4.4, 4.5**

### Property 17: Permission Visual Feedback
*For any* user without MODIFY permission for BUDGETS menu, the UI should display lock icons or disabled state indicators on editing controls.
**Validates: Requirements 4.3**

### Property 18: Numeric Input Validation
*For any* cell input value, the validation should accept the value if and only if it is numeric.
**Validates: Requirements 5.1**

### Property 19: Non-Numeric Input Error
*For any* non-numeric cell input, the system should display an error message and prevent saving.
**Validates: Requirements 5.2**

### Property 20: Valid Input Acceptance
*For any* numeric input value >= 0, the system should accept the value and clear any existing error messages for that cell.
**Validates: Requirements 5.4**

### Property 21: Save Disabled With Errors
*For any* budget state with validation errors, the save button should be disabled.
**Validates: Requirements 5.5**

### Property 22: Total Recalculation on Edit
*For any* monthly cell edit in an expense row, the total column for that row should immediately recalculate to reflect the new sum.
**Validates: Requirements 6.1, 6.5**

### Property 23: Total Calculation Correctness
*For any* expense row, the total column value should equal the sum of all 12 monthly plan values.
**Validates: Requirements 6.2**

## Error Handling

### Validation Errors

**Client-Side Validation:**
- Non-numeric input: Display inline error "Value must be a number"
- Negative value: Display inline error "Value must be greater than or equal to 0"
- Empty value: Treat as 0 (valid)

**Error State Management:**
```typescript
interface ValidationError {
  cellKey: string; // "expenseId-month"
  message: string;
}

// Store in Map for O(1) lookup
const validationErrors = new Map<string, string>();
```

### API Errors

**Network Errors:**
- Show toast notification: "Failed to save budget. Please check your connection."
- Keep unsaved changes in state
- Allow user to retry

**Permission Errors (403):**
- Show toast notification: "You don't have permission to modify this budget."
- Disable all editing controls
- Reload page to refresh permissions

**Version Conflict Errors:**
- Show dialog: "This budget has been modified by another user. Please refresh and try again."
- Provide "Refresh" button to reload current state

**Validation Errors from Backend:**
- Display specific error messages from API response
- Highlight affected cells
- Prevent further save attempts until resolved

### Edge Cases

**Concurrent Edits:**
- Frontend doesn't handle concurrent editing by multiple users
- Last save wins (backend creates new version)
- Users should coordinate to avoid conflicts

**Large Budgets:**
- Render optimization: virtualize table rows if > 100 expenses
- Debounce total calculations (100ms) to avoid excessive re-renders

**Browser Refresh with Unsaved Changes:**
- Show browser confirmation dialog: "You have unsaved changes. Are you sure you want to leave?"
- Use beforeunload event listener

## Testing Strategy

### Unit Tests

Unit tests focus on specific examples, edge cases, and component behavior:

**Component Tests:**
- EditableCell: Test edit mode toggle, blur behavior, keyboard shortcuts (Enter, Escape)
- TotalCell: Test formatting, read-only enforcement
- RowManager: Test search modal open/close, expense selection
- ConfirmationDialog: Test confirm/cancel actions

**Edge Cases:**
- Empty budget (no expenses)
- Single expense with all zero values
- Expense with mixed currencies
- Very large numbers (> 1 billion)
- Decimal values with many digits

**Error Conditions:**
- Invalid API responses
- Network timeouts
- Missing permission data
- Malformed budget data

### Property-Based Tests

Property-based tests verify universal properties across all inputs. Each test should run a minimum of 100 iterations with randomized inputs.

**Test Configuration:**
- Library: fast-check (for TypeScript/JavaScript)
- Iterations: 100 minimum per property
- Tag format: `// Feature: budget-editing, Property {N}: {property text}`

**Property Test Implementation:**
Each correctness property (1-23) should be implemented as a single property-based test. Tests should:
- Generate random budget states, cell values, and user actions
- Execute the operation under test
- Assert the property holds for all generated inputs
- Reference the design document property number in a comment

**Example Property Test Structure:**
```typescript
// Feature: budget-editing, Property 3: Multi-Cell Edit State Persistence
test('editing multiple cells preserves all values', () => {
  fc.assert(
    fc.property(
      fc.array(fc.record({
        expenseId: fc.uuid(),
        month: fc.integer({ min: 1, max: 12 }),
        value: fc.float({ min: 0, max: 1000000 })
      })),
      (edits) => {
        const state = createInitialState();
        edits.forEach(edit => {
          handleCellEdit(state, edit.expenseId, edit.month, edit.value);
        });
        // Assert all edits are in state
        edits.forEach(edit => {
          const key = `${edit.expenseId}-${edit.month}`;
          expect(state.editedCells.get(key)?.value).toBe(edit.value);
        });
      }
    ),
    { numRuns: 100 }
  );
});
```

**Generator Strategies:**
- Budget states: Random number of expenses (0-50), random plan values
- Cell edits: Random expense IDs, months (1-12), values (0-1000000)
- User permissions: Random boolean for MODIFY permission
- Search queries: Random strings, partial matches, special characters
- Version numbers: Random valid version strings (v1.0 - v99.99)

**Coverage Goals:**
- All 23 correctness properties implemented as property tests
- Edge cases (negative values, non-numeric input, empty budgets) covered by generators
- Integration points (API calls, permission checks) mocked and verified

### Integration Tests

**API Integration:**
- Test full save flow: edit cells → save → verify API call → verify new version loaded
- Test row management: add row → verify API call → remove row → verify state
- Test permission integration: mock different permission states → verify UI behavior

**End-to-End Scenarios:**
- Complete editing session: load budget → edit multiple cells → add row → save → verify new version
- Permission denial: load without permission → verify read-only state → attempt edit → verify blocked
- Validation flow: enter invalid values → verify errors → correct values → verify save enabled
