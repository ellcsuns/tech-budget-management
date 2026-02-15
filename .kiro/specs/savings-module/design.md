# Design Document: Savings Module

## Overview

The Savings Module enables budget managers to register cost reductions for specific expenses and apply them to create new budget versions. The system supports three distribution strategies (even, single month, custom) and maintains a pending/approved workflow. The architecture extends the existing budget versioning system with a new Saving model and service layer.

## Architecture

The module follows a three-tier architecture:

1. **Data Layer**: PostgreSQL database with Prisma ORM, adding a new Saving model
2. **Service Layer**: SavingService handles CRUD operations and business logic
3. **API Layer**: Express REST endpoints for savings management
4. **Frontend Layer**: React components for the Savings Page interface

The module integrates with the existing BudgetService to create new versions with savings applied.

## Components and Interfaces

### Database Schema

Add new Saving model to Prisma schema:

```prisma
model Saving {
  id                   String          @id @default(uuid())
  expenseId            String
  expense              Expense         @relation(fields: [expenseId], references: [id], onDelete: Cascade)
  budgetId             String
  budget               Budget          @relation(fields: [budgetId], references: [id], onDelete: Cascade)
  totalAmount          Decimal         @db.Decimal(15, 2)
  description          String
  status               SavingStatus    @default(PENDING)
  monthlyDistribution  Json
  createdAt            DateTime        @default(now())
  createdBy            String
  user                 User            @relation(fields: [createdBy], references: [id])
  approvedAt           DateTime?
  
  @@index([budgetId])
  @@index([expenseId])
  @@index([status])
  @@index([createdBy])
}

enum SavingStatus {
  PENDING
  APPROVED
}
```

Update existing models to add relations:

```prisma
model Budget {
  // ... existing fields
  savings Saving[]
}

model Expense {
  // ... existing fields
  savings Saving[]
}

model User {
  // ... existing fields
  savings Saving[]
}
```

### Backend Service: SavingService

```typescript
interface SavingInput {
  expenseId: string;
  budgetId: string;
  totalAmount: number;
  description: string;
  distributionStrategy: 'EVEN' | 'SINGLE_MONTH' | 'CUSTOM';
  targetMonth?: number; // For SINGLE_MONTH
  customDistribution?: Record<number, number>; // For CUSTOM
}

interface MonthlyDistribution {
  [month: number]: number;
}

class SavingService {
  constructor(private prisma: PrismaClient) {}

  async createSaving(data: SavingInput, userId: string): Promise<Saving>
  async getSavings(filters: SavingFilters): Promise<Saving[]>
  async getSavingById(id: string): Promise<Saving | null>
  async approveSavings(savingIds: string[]): Promise<Budget>
  async deleteSaving(id: string): Promise<void>
  
  private calculateMonthlyDistribution(data: SavingInput): MonthlyDistribution
  private validateCustomDistribution(distribution: Record<number, number>, totalAmount: number): void
}
```

### API Endpoints

```
POST   /api/savings                    - Create new saving
GET    /api/savings                    - List savings with filters
GET    /api/savings/:id                - Get saving details
POST   /api/savings/approve            - Approve multiple savings
DELETE /api/savings/:id                - Delete saving
```

### Frontend Components

```typescript
// Main page component
interface SavingsPageProps {}
const SavingsPage: React.FC<SavingsPageProps>

// Form for creating savings
interface SavingFormProps {
  budgetId: string;
  onSave: (saving: Saving) => void;
  onCancel: () => void;
}
const SavingForm: React.FC<SavingFormProps>

// Distribution strategy selector
interface DistributionSelectorProps {
  strategy: DistributionStrategy;
  totalAmount: number;
  onChange: (distribution: MonthlyDistribution) => void;
}
const DistributionSelector: React.FC<DistributionSelectorProps>

// Savings list with filters
interface SavingsListProps {
  savings: Saving[];
  onSelect: (ids: string[]) => void;
  onApprove: (ids: string[]) => void;
}
const SavingsList: React.FC<SavingsListProps>

// Detail view showing monthly breakdown
interface SavingDetailProps {
  saving: Saving;
  onClose: () => void;
}
const SavingDetail: React.FC<SavingDetailProps>
```

## Data Models

### Saving Entity

```typescript
interface Saving {
  id: string;
  expenseId: string;
  budgetId: string;
  totalAmount: number;
  description: string;
  status: 'PENDING' | 'APPROVED';
  monthlyDistribution: Record<number, number>;
  createdAt: Date;
  createdBy: string;
  approvedAt?: Date;
}
```

### Distribution Strategies

**EVEN Distribution**:
- Divide totalAmount by 12
- Handle remainder by adding to month 1
- Example: $1000 → $83.34 for months 1-11, $83.26 for month 12

**SINGLE_MONTH Distribution**:
- Apply full amount to specified month
- Example: $1000 to month 6 → {"6": 1000}

**CUSTOM Distribution**:
- User specifies amount per month
- Must sum to totalAmount
- Example: {"1": 300, "6": 400, "12": 300}

### Approval Process Flow

```
1. User selects pending savings
2. System validates all savings exist and are PENDING
3. System groups savings by budgetId
4. For each budget:
   a. Aggregate all monthly distributions
   b. Create planValueChanges array
   c. Call BudgetService.createNewVersion()
5. Update all savings status to APPROVED
6. Set approvedAt timestamp
7. Return new budget version
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Distribution Sum Consistency
*For any* saving with CUSTOM distribution strategy, the sum of all monthly distribution values should equal the totalAmount.
**Validates: Requirements 2.4**

### Property 2: EVEN Distribution Correctness
*For any* saving with EVEN distribution strategy, the sum of all 12 monthly values should equal the totalAmount within a tolerance of 0.01.
**Validates: Requirements 2.1, 2.6**

### Property 3: SINGLE_MONTH Distribution Isolation
*For any* saving with SINGLE_MONTH distribution strategy, exactly one month should have a non-zero value equal to totalAmount, and all other months should be zero.
**Validates: Requirements 2.2**

### Property 4: Approval Idempotence
*For any* set of savings that have been approved, attempting to approve them again should result in no changes to the database state.
**Validates: Requirements 3.6**

### Property 5: Version Creation with Savings
*For any* budget with pending savings, when approved, the new budget version should have plan values reduced by the exact monthly distribution amounts for each corresponding expense.
**Validates: Requirements 3.4**

### Property 6: Multiple Savings Cumulative Application
*For any* expense with multiple pending savings, when all are approved together, the total reduction in plan values should equal the sum of all savings' monthly distributions for each month.
**Validates: Requirements 3.7**

### Property 7: Status Transition Validity
*For any* saving, the status should only transition from PENDING to APPROVED, never in reverse or to any other state.
**Validates: Requirements 1.4, 3.6**

### Property 8: Positive Amount Validation
*For any* saving creation attempt, if totalAmount is less than or equal to zero, the operation should fail with a validation error.
**Validates: Requirements 1.5**

### Property 9: Monthly Distribution Non-Negative
*For any* saving with any distribution strategy, all monthly distribution values should be greater than or equal to zero.
**Validates: Requirements 6.4**

### Property 10: Filter Combination Correctness
*For any* combination of filters (expense, budget, status, date range, user), the returned savings should satisfy all filter criteria simultaneously.
**Validates: Requirements 5.6**

## Error Handling

### Validation Errors

- **Invalid Amount**: Return 400 with message "Total amount must be greater than zero"
- **Distribution Mismatch**: Return 400 with message "Sum of monthly distributions must equal total amount"
- **Invalid Month**: Return 400 with message "Month must be between 1 and 12"
- **Expense Not Found**: Return 404 with message "Expense not found in specified budget"
- **Budget Not Found**: Return 404 with message "Budget not found"

### Authorization Errors

- **Insufficient Permissions**: Return 403 with message "User lacks MODIFY permission for BUDGETS"
- **Invalid User**: Return 401 with message "User not authenticated"

### Business Logic Errors

- **Already Approved**: Return 409 with message "Saving has already been approved"
- **Version Creation Failed**: Return 500 with message "Failed to create budget version" and rollback all changes

### Database Errors

- **Transaction Failure**: Rollback all changes and return 500 with message "Database transaction failed"
- **Constraint Violation**: Return 409 with message describing the constraint violation

## Testing Strategy

### Unit Tests

Unit tests should focus on specific examples, edge cases, and error conditions:

- Test EVEN distribution with amounts that divide evenly (e.g., $1200 ÷ 12)
- Test EVEN distribution with remainders (e.g., $1000 ÷ 12)
- Test SINGLE_MONTH distribution for each month (1-12)
- Test CUSTOM distribution validation (sum matches, sum doesn't match)
- Test authorization checks (with/without MODIFY permission)
- Test error cases (negative amounts, invalid months, non-existent expenses)
- Test approval of already-approved savings
- Test filter combinations (expense + status, date range + user)

### Property-Based Tests

Property-based tests should verify universal properties across all inputs. Each test should run a minimum of 100 iterations and be tagged with the corresponding design property.

**Configuration**: Use fast-check library for TypeScript property-based testing.

**Test Tags**: Each property test must include a comment:
```typescript
// Feature: savings-module, Property 1: Distribution Sum Consistency
```

**Property Test Examples**:

1. **Distribution Sum Consistency** (Property 1)
   - Generate random totalAmount and random custom distribution
   - Verify sum equals totalAmount

2. **EVEN Distribution Correctness** (Property 2)
   - Generate random totalAmount
   - Calculate EVEN distribution
   - Verify sum equals totalAmount within tolerance

3. **Version Creation with Savings** (Property 5)
   - Generate random budget with expenses and plan values
   - Generate random savings with distributions
   - Apply savings and verify plan values reduced correctly

4. **Multiple Savings Cumulative Application** (Property 6)
   - Generate random expense with multiple savings
   - Apply all savings
   - Verify cumulative reduction matches sum of all distributions

5. **Filter Combination Correctness** (Property 10)
   - Generate random set of savings
   - Apply random filter combinations
   - Verify all returned savings match all filter criteria

**Test Implementation Requirements**:
- Each correctness property MUST be implemented by a SINGLE property-based test
- Each test MUST run minimum 100 iterations
- Each test MUST be tagged with feature name and property number
- Property tests and unit tests are complementary (both required)
