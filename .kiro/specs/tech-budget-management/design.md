# Documento de Diseño: Sistema de Gestión de Presupuesto Tecnológico

## Visión General

El sistema de gestión de presupuesto tecnológico es una aplicación full-stack que permite a organizaciones administrar presupuestos anuales con múltiples versiones, rastrear gastos en estructura jerárquica, y monitorear ejecución presupuestaria a través de valores planificados, comprometidos y reales. El sistema maneja conversión automática de monedas, proporciona visualizaciones tabulares configurables, y mantiene trazabilidad completa de transacciones.

### Características Principales

- Gestión de presupuestos multi-versión por año
- Estructura jerárquica de gastos con metadatos configurables
- Seguimiento de valores Plan, Comprometido y Real con desglose mensual
- Conversión automática de monedas con historial por versión
- Visualizaciones tabulares interactivas con filtros dinámicos
- Sistema de etiquetas configurable para metadatos personalizados
- Gestión de datos maestros (direcciones tecnológicas, áreas de usuario, empresas financieras)

## Arquitectura

### Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Tabla Gastos │  │   Filtros    │  │ Config Datos │      │
│  │              │  │              │  │   Maestros   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Transacciones│  │  Metadatos   │  │Popup Detalle │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Node.js + Express)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Budget     │  │   Expense    │  │ Transaction  │      │
│  │   Service    │  │   Service    │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Currency    │  │ Master Data  │  │   Tagging    │      │
│  │  Converter   │  │   Service    │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │ Prisma ORM
┌─────────────────────────────────────────────────────────────┐
│                  Base de Datos (PostgreSQL)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Budgets    │  │   Expenses   │  │ Transactions │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Conversion  │  │ Master Data  │  │     Tags     │      │
│  │    Rates     │  │    Tables    │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Decisiones Arquitectónicas

1. **Separación Frontend/Backend**: Arquitectura desacoplada permite desarrollo independiente y escalabilidad horizontal
2. **Prisma ORM**: Abstracción de base de datos facilita migraciones y cambios de esquema
3. **PostgreSQL**: Base de datos relacional robusta con soporte completo para transacciones ACID y consultas complejas
4. **React + Tailwind**: Combinación moderna para UI responsiva con desarrollo rápido
5. **Servicios por Dominio**: Cada entidad de negocio tiene su servicio dedicado para separación de responsabilidades

## Componentes e Interfaces

### Backend Services

#### BudgetService

Gestiona operaciones CRUD de presupuestos y coordina con otros servicios.

```typescript
interface BudgetService {
  createBudget(year: number, version: string): Promise<Budget>
  getBudget(id: string): Promise<Budget>
  getBudgetsByYear(year: number): Promise<Budget[]>
  updateBudget(id: string, data: Partial<Budget>): Promise<Budget>
  deleteBudget(id: string): Promise<void>
}

interface Budget {
  id: string
  year: number
  version: string
  expenses: Expense[]
  createdAt: Date
  updatedAt: Date
}
```

#### ExpenseService

Gestiona gastos con metadatos configurables y relaciones jerárquicas.

```typescript
interface ExpenseService {
  createExpense(budgetId: string, data: ExpenseInput): Promise<Expense>
  getExpense(id: string): Promise<Expense>
  getExpensesByBudget(budgetId: string): Promise<Expense[]>
  updateExpense(id: string, data: Partial<ExpenseInput>): Promise<Expense>
  deleteExpense(id: string): Promise<void>
  getExpenseMetadata(id: string): Promise<ExpenseMetadata>
}

interface ExpenseInput {
  code: string
  shortDescription: string
  longDescription: string
  technologyDirections: string[]
  userAreas: string[]
  financialCompanyId: string
  parentExpenseId?: string
  tags: Record<string, any>
}

interface Expense extends ExpenseInput {
  id: string
  budgetId: string
  createdAt: Date
  updatedAt: Date
}

interface ExpenseMetadata {
  expense: Expense
  technologyDirections: MasterDataItem[]
  userAreas: MasterDataItem[]
  financialCompany: FinancialCompany
  tags: TagValue[]
}
```

#### TransactionService

Gestiona transacciones de valores comprometidos y reales.

```typescript
interface TransactionService {
  createTransaction(data: TransactionInput): Promise<Transaction>
  getTransaction(id: string): Promise<Transaction>
  getTransactionsByExpense(expenseId: string): Promise<Transaction[]>
  getTransactionsByMonth(expenseId: string, month: number): Promise<Transaction[]>
  updateTransaction(id: string, data: Partial<TransactionInput>): Promise<Transaction>
  deleteTransaction(id: string): Promise<void>
  getMonthlyCommitted(expenseId: string, month: number): Promise<MonetaryAmount>
  getMonthlyReal(expenseId: string, month: number): Promise<MonetaryAmount>
}

interface TransactionInput {
  expenseId: string
  type: 'COMMITTED' | 'REAL'
  serviceDate: Date
  postingDate: Date
  referenceDocumentNumber: string
  externalPlatformLink: string
  amount: MonetaryAmount
}

interface Transaction extends TransactionInput {
  id: string
  createdAt: Date
  updatedAt: Date
}

interface MonetaryAmount {
  transactionCurrency: string
  transactionValue: number
  usdValue: number
  conversionRate: number
  month: number
}
```

#### PlanValueService

Gestiona valores planificados con desglose mensual.

```typescript
interface PlanValueService {
  createPlanValue(expenseId: string, data: PlanValueInput): Promise<PlanValue>
  getPlanValue(id: string): Promise<PlanValue>
  getPlanValuesByExpense(expenseId: string): Promise<PlanValue[]>
  updatePlanValue(id: string, data: Partial<PlanValueInput>): Promise<PlanValue>
  deletePlanValue(id: string): Promise<void>
  getMonthlyPlan(expenseId: string, month: number): Promise<MonetaryAmount>
  getTotalPlan(expenseId: string): Promise<MonetaryAmount>
}

interface PlanValueInput {
  expenseId: string
  monthlyValues: MonetaryAmount[]  // Array de 12 elementos
}

interface PlanValue extends PlanValueInput {
  id: string
  total: MonetaryAmount
  createdAt: Date
  updatedAt: Date
}
```

#### CurrencyConverterService

Gestiona conversión de monedas con tasas históricas por versión.

```typescript
interface CurrencyConverterService {
  setConversionRate(budgetId: string, currency: string, month: number, rate: number): Promise<ConversionRate>
  getConversionRate(budgetId: string, currency: string, month: number): Promise<ConversionRate>
  convertToUSD(budgetId: string, amount: number, currency: string, month: number): Promise<number>
  getConversionHistory(budgetId: string): Promise<ConversionRate[]>
}

interface ConversionRate {
  id: string
  budgetId: string
  currency: string
  month: number
  rate: number
  createdAt: Date
  updatedAt: Date
}
```

#### MasterDataService

Gestiona datos maestros configurables (direcciones tecnológicas, áreas de usuario, empresas financieras).

```typescript
interface MasterDataService {
  // Technology Directions
  createTechnologyDirection(data: MasterDataInput): Promise<MasterDataItem>
  getTechnologyDirections(): Promise<MasterDataItem[]>
  updateTechnologyDirection(id: string, data: Partial<MasterDataInput>): Promise<MasterDataItem>
  deleteTechnologyDirection(id: string): Promise<void>
  
  // User Areas
  createUserArea(data: MasterDataInput): Promise<MasterDataItem>
  getUserAreas(): Promise<MasterDataItem[]>
  updateUserArea(id: string, data: Partial<MasterDataInput>): Promise<MasterDataItem>
  deleteUserArea(id: string): Promise<void>
  
  // Financial Companies
  createFinancialCompany(data: FinancialCompanyInput): Promise<FinancialCompany>
  getFinancialCompanies(): Promise<FinancialCompany[]>
  updateFinancialCompany(id: string, data: Partial<FinancialCompanyInput>): Promise<FinancialCompany>
  deleteFinancialCompany(id: string): Promise<void>
  
  // Validation
  isInUse(type: 'TECH_DIRECTION' | 'USER_AREA' | 'FINANCIAL_COMPANY', id: string): Promise<boolean>
}

interface MasterDataInput {
  code: string
  name: string
  description?: string
}

interface MasterDataItem extends MasterDataInput {
  id: string
  createdAt: Date
  updatedAt: Date
}

interface FinancialCompanyInput extends MasterDataInput {
  taxId?: string
}

interface FinancialCompany extends FinancialCompanyInput {
  id: string
  createdAt: Date
  updatedAt: Date
}
```

#### TaggingService

Gestiona sistema de etiquetas configurables para metadatos personalizados.

```typescript
interface TaggingService {
  createTagDefinition(data: TagDefinitionInput): Promise<TagDefinition>
  getTagDefinitions(): Promise<TagDefinition[]>
  updateTagDefinition(id: string, data: Partial<TagDefinitionInput>): Promise<TagDefinition>
  deleteTagDefinition(id: string): Promise<void>
  
  setTagValue(expenseId: string, tagId: string, value: any): Promise<TagValue>
  getTagValue(expenseId: string, tagId: string): Promise<TagValue>
  getTagValuesByExpense(expenseId: string): Promise<TagValue[]>
}

interface TagDefinitionInput {
  name: string
  description?: string
  inputType: 'FORMAT' | 'FREE_TEXT' | 'SELECT_LIST'
  format?: string  // Para inputType FORMAT (ej: regex, date format)
  selectOptions?: string[]  // Para inputType SELECT_LIST
}

interface TagDefinition extends TagDefinitionInput {
  id: string
  createdAt: Date
  updatedAt: Date
}

interface TagValue {
  id: string
  expenseId: string
  tagId: string
  value: any
  createdAt: Date
  updatedAt: Date
}
```

### Frontend Components

#### ExpenseTable

Componente principal que muestra tabla de gastos con valores mensuales.

```typescript
interface ExpenseTableProps {
  budgetId: string
  viewMode: 'PLAN' | 'COMPARISON'
  filters: TableFilters
  onExpenseClick: (expenseId: string) => void
}

interface TableFilters {
  currency?: string
  financialCompanyId?: string
  columnFilters: Record<string, string>
  visibleColumns: {
    budget: boolean
    committed: boolean
    real: boolean
  }
}

interface ExpenseTableRow {
  expenseId: string
  code: string
  shortDescription: string
  category: string
  monthlyValues: MonthlyValue[]
  total: number
}

interface MonthlyValue {
  month: number
  budget?: number
  committed?: number
  real?: number
}
```

#### FilterPanel

Panel de filtros para moneda y empresa financiera.

```typescript
interface FilterPanelProps {
  currencies: string[]
  financialCompanies: FinancialCompany[]
  selectedCurrency?: string
  selectedFinancialCompany?: string
  onCurrencyChange: (currency: string | undefined) => void
  onFinancialCompanyChange: (companyId: string | undefined) => void
}
```

#### MasterDataConfig

Sección de configuración de datos maestros.

```typescript
interface MasterDataConfigProps {
  type: 'TECH_DIRECTION' | 'USER_AREA' | 'FINANCIAL_COMPANY'
  items: MasterDataItem[] | FinancialCompany[]
  onAdd: (data: MasterDataInput | FinancialCompanyInput) => Promise<void>
  onUpdate: (id: string, data: Partial<MasterDataInput | FinancialCompanyInput>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}
```

#### TransactionViewer

Visualizador de tablas de transacciones plan y reales.

```typescript
interface TransactionViewerProps {
  expenseId?: string
  viewType: 'PLAN' | 'COMMITTED' | 'REAL'
  transactions: Transaction[] | PlanValue[]
  onSort: (column: string, direction: 'asc' | 'desc') => void
}
```

#### ExpenseMetadataViewer

Visualizador de metadatos completos de un gasto.

```typescript
interface ExpenseMetadataViewerProps {
  expenseId: string
  metadata: ExpenseMetadata
  onUpdate: (field: string, value: any) => Promise<void>
}
```

#### ExpenseDetailPopup

Popup modal con detalles completos de un gasto.

```typescript
interface ExpenseDetailPopupProps {
  expenseId: string
  isOpen: boolean
  onClose: () => void
}
```

## Modelos de Datos

### Esquema Prisma

```prisma
// Budget model
model Budget {
  id              String            @id @default(uuid())
  year            Int
  version         String
  expenses        Expense[]
  conversionRates ConversionRate[]
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  @@unique([year, version])
  @@index([year])
}

// Expense model
model Expense {
  id                    String        @id @default(uuid())
  budgetId              String
  budget                Budget        @relation(fields: [budgetId], references: [id], onDelete: Cascade)
  code                  String
  shortDescription      String
  longDescription       String
  technologyDirections  String[]      // Array de IDs
  userAreas             String[]      // Array de IDs
  financialCompanyId    String
  financialCompany      FinancialCompany @relation(fields: [financialCompanyId], references: [id])
  parentExpenseId       String?
  parentExpense         Expense?      @relation("ExpenseHierarchy", fields: [parentExpenseId], references: [id])
  childExpenses         Expense[]     @relation("ExpenseHierarchy")
  transactions          Transaction[]
  planValues            PlanValue[]
  tagValues             TagValue[]
  createdAt             DateTime      @default(now())
  updatedAt             DateTime      @updatedAt
  
  @@unique([budgetId, code])
  @@index([budgetId])
  @@index([financialCompanyId])
}

// Transaction model
model Transaction {
  id                      String   @id @default(uuid())
  expenseId               String
  expense                 Expense  @relation(fields: [expenseId], references: [id], onDelete: Cascade)
  type                    TransactionType
  serviceDate             DateTime
  postingDate             DateTime
  referenceDocumentNumber String
  externalPlatformLink    String
  transactionCurrency     String
  transactionValue        Decimal  @db.Decimal(15, 2)
  usdValue                Decimal  @db.Decimal(15, 2)
  conversionRate          Decimal  @db.Decimal(10, 6)
  month                   Int
  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt
  
  @@unique([expenseId, referenceDocumentNumber])
  @@index([expenseId, month])
  @@index([type])
}

enum TransactionType {
  COMMITTED
  REAL
}

// PlanValue model
model PlanValue {
  id        String              @id @default(uuid())
  expenseId String
  expense   Expense             @relation(fields: [expenseId], references: [id], onDelete: Cascade)
  month     Int
  transactionCurrency String
  transactionValue    Decimal @db.Decimal(15, 2)
  usdValue            Decimal @db.Decimal(15, 2)
  conversionRate      Decimal @db.Decimal(10, 6)
  createdAt DateTime            @default(now())
  updatedAt DateTime            @updatedAt
  
  @@unique([expenseId, month])
  @@index([expenseId])
}

// ConversionRate model
model ConversionRate {
  id        String   @id @default(uuid())
  budgetId  String
  budget    Budget   @relation(fields: [budgetId], references: [id], onDelete: Cascade)
  currency  String
  month     Int
  rate      Decimal  @db.Decimal(10, 6)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([budgetId, currency, month])
  @@index([budgetId, month])
}

// TechnologyDirection model
model TechnologyDirection {
  id          String   @id @default(uuid())
  code        String   @unique
  name        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// UserArea model
model UserArea {
  id          String   @id @default(uuid())
  code        String   @unique
  name        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// FinancialCompany model
model FinancialCompany {
  id          String    @id @default(uuid())
  code        String    @unique
  name        String
  description String?
  taxId       String?
  expenses    Expense[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

// TagDefinition model
model TagDefinition {
  id            String        @id @default(uuid())
  name          String        @unique
  description   String?
  inputType     TagInputType
  format        String?
  selectOptions String[]
  tagValues     TagValue[]
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
}

enum TagInputType {
  FORMAT
  FREE_TEXT
  SELECT_LIST
}

// TagValue model
model TagValue {
  id            String        @id @default(uuid())
  expenseId     String
  expense       Expense       @relation(fields: [expenseId], references: [id], onDelete: Cascade)
  tagId         String
  tagDefinition TagDefinition @relation(fields: [tagId], references: [id], onDelete: Cascade)
  value         Json
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  
  @@unique([expenseId, tagId])
  @@index([expenseId])
  @@index([tagId])
}
```

### Relaciones de Datos

1. **Budget → Expense**: Un presupuesto contiene múltiples gastos (1:N)
2. **Budget → ConversionRate**: Un presupuesto tiene múltiples tasas de conversión por moneda y mes (1:N)
3. **Expense → Transaction**: Un gasto tiene múltiples transacciones (1:N)
4. **Expense → PlanValue**: Un gasto tiene valores plan para cada mes (1:N, máximo 12)
5. **Expense → TagValue**: Un gasto tiene múltiples valores de etiquetas (1:N)
6. **Expense → Expense**: Jerarquía de gastos padre-hijo (1:N recursivo)
7. **FinancialCompany → Expense**: Una empresa financiera está asociada a múltiples gastos (1:N)
8. **TagDefinition → TagValue**: Una definición de etiqueta tiene múltiples valores (1:N)

### Restricciones de Integridad

1. Combinación (year, version) debe ser única por presupuesto
2. Combinación (budgetId, code) debe ser única por gasto
3. Combinación (expenseId, referenceDocumentNumber) debe ser única por transacción
4. Combinación (expenseId, month) debe ser única por valor plan
5. Combinación (budgetId, currency, month) debe ser única por tasa de conversión
6. Combinación (expenseId, tagId) debe ser única por valor de etiqueta
7. Códigos de datos maestros deben ser únicos
8. Mes debe estar en rango 1-12
9. No se puede eliminar datos maestros si están en uso por gastos existentes


## Propiedades de Corrección

*Una propiedad es una característica o comportamiento que debe mantenerse verdadero en todas las ejecuciones válidas de un sistema - esencialmente, una declaración formal sobre lo que el sistema debe hacer. Las propiedades sirven como puente entre especificaciones legibles por humanos y garantías de corrección verificables por máquinas.*

### Propiedad 1: Unicidad de Presupuestos

*Para cualquier* par de presupuestos en el sistema, si tienen el mismo año, entonces deben tener versiones diferentes.

**Valida: Requisitos 1.1**

### Propiedad 2: Completitud de Gastos en Consulta

*Para cualquier* presupuesto con gastos asociados, cuando se consulta el presupuesto, todos los gastos asociados (incluyendo su estructura jerárquica completa) deben ser retornados.

**Valida: Requisitos 1.2**

### Propiedad 3: Independencia de Versiones

*Para cualquier* año con múltiples versiones, los gastos de una versión no deben aparecer en consultas de otras versiones del mismo año.

**Valida: Requisitos 1.3**

### Propiedad 4: Inicialización de Módulo de Conversión

*Para cualquier* presupuesto recién creado, debe existir un módulo de conversión inicializado asociado a ese presupuesto.

**Valida: Requisitos 1.4**

### Propiedad 5: Validación de Campos Requeridos de Gasto

*Para cualquier* intento de crear un gasto sin alguno de los campos requeridos (código, descripción corta, descripción larga, dirección tecnológica, áreas de usuario, empresa financiera), el sistema debe rechazar la creación.

**Valida: Requisitos 2.1**

### Propiedad 6: Validación de Referencias a Datos Maestros

*Para cualquier* gasto con direcciones tecnológicas o áreas de usuario asignadas, todos los IDs referenciados deben existir en las tablas de datos maestros correspondientes.

**Valida: Requisitos 2.2, 2.3**

### Propiedad 7: Validación de Empresa Financiera

*Para cualquier* gasto, la empresa financiera asignada debe existir en la tabla de empresas financieras y debe ser única (no múltiple).

**Valida: Requisitos 2.4**

### Propiedad 8: Tipos de Etiquetas Configurables

*Para cualquier* definición de etiqueta creada, debe tener exactamente uno de los tres tipos de entrada (FORMAT, FREE_TEXT, SELECT_LIST) y los campos correspondientes deben ser válidos según el tipo.

**Valida: Requisitos 2.5**

### Propiedad 9: Consistencia de Metadatos por Versión

*Para cualquier* conjunto de gastos en la misma versión de presupuesto, todos deben tener acceso a las mismas definiciones de etiquetas configurables.

**Valida: Requisitos 2.6**

### Propiedad 10: Estructura de 12 Meses en Valores Plan

*Para cualquier* gasto, los valores plan asociados deben cubrir exactamente 12 meses (1-12), permitiendo valores cero.

**Valida: Requisitos 3.1, 3.3**

### Propiedad 11: Cálculo de Total como Suma Mensual

*Para cualquier* conjunto de valores mensuales (plan, comprometido o real), el total calculado debe ser igual a la suma de los 12 valores mensuales.

**Valida: Requisitos 3.2, 6.2**

### Propiedad 12: Estructura Completa de Valores Monetarios

*Para cualquier* valor monetario almacenado (plan, comprometido o real), debe contener moneda de transacción, valor en moneda original, valor en USD y tasa de conversión aplicada.

**Valida: Requisitos 3.4, 4.5, 5.2**

### Propiedad 13: Validación de Campos Requeridos de Transacción

*Para cualquier* intento de crear una transacción sin alguno de los campos requeridos (ID de gasto, fecha de servicio, fecha de contabilización, número de documento de referencia, enlace a plataforma externa), el sistema debe rechazar la creación.

**Valida: Requisitos 4.1**

### Propiedad 14: Unicidad de Número de Documento de Referencia

*Para cualquier* par de transacciones del mismo gasto, si tienen el mismo número de documento de referencia, el sistema debe rechazar la creación de la segunda transacción.

**Valida: Requisitos 4.2**

### Propiedad 15: Agregación Mensual de Transacciones

*Para cualquier* gasto y mes, el valor comprometido mensual debe ser la suma de todas las transacciones tipo COMMITTED de ese mes, y el valor real mensual debe ser la suma de todas las transacciones tipo REAL de ese mes.

**Valida: Requisitos 4.3, 4.4**

### Propiedad 16: Conversión Automática a USD

*Para cualquier* valor ingresado en moneda de transacción con una tasa de conversión definida para ese mes y versión, el valor en USD almacenado debe ser igual al valor en moneda original multiplicado por la tasa de conversión.

**Valida: Requisitos 5.1**

### Propiedad 17: Independencia de Tasas por Versión

*Para cualquier* par de versiones diferentes, las tasas de conversión de una versión no deben afectar los cálculos de conversión de la otra versión, incluso para la misma moneda y mes.

**Valida: Requisitos 5.3**

### Propiedad 18: Completitud de Historial de Conversión

*Para cualquier* presupuesto, cuando se consulta el historial de conversión, todas las tasas de cambio configuradas para ese presupuesto (por moneda y mes) deben ser retornadas.

**Valida: Requisitos 5.4**

### Propiedad 19: Filtrado de Columnas en Tablas

*Para cualquier* tabla de gastos con filtros de columna aplicados, solo las filas que cumplan todos los criterios de filtro deben ser visibles en la tabla renderizada.

**Valida: Requisitos 6.4, 7.4**

### Propiedad 20: Contenido de Filas en Tabla Comparativa

*Para cualquier* fila de gasto en la tabla comparativa, debe incluir descripción corta y categoría en las columnas correspondientes.

**Valida: Requisitos 7.2**

### Propiedad 21: Visibilidad de Columnas por Checkbox

*Para cualquier* checkbox de encabezado (Presupuesto/Comprometido/Real), cuando se desactiva, las columnas correspondientes en todos los meses deben ocultarse, y cuando se activa, deben mostrarse.

**Valida: Requisitos 7.3**

### Propiedad 22: Filtrado por Moneda

*Para cualquier* conjunto de gastos con transacciones en diferentes monedas, cuando se aplica un filtro de moneda, solo los gastos que tienen al menos una transacción en esa moneda deben ser visibles.

**Valida: Requisitos 8.1**

### Propiedad 23: Filtrado por Empresa Financiera

*Para cualquier* conjunto de gastos asociados a diferentes empresas financieras, cuando se aplica un filtro de empresa, solo los gastos asociados a esa empresa deben ser visibles.

**Valida: Requisitos 8.2**

### Propiedad 24: Operación AND en Filtros Múltiples

*Para cualquier* conjunto de filtros aplicados simultáneamente (moneda, empresa, columnas), solo los gastos que cumplan TODOS los criterios deben ser visibles.

**Valida: Requisitos 8.3**

### Propiedad 25: Restauración de Vista al Limpiar Filtros

*Para cualquier* tabla con filtros aplicados, cuando se limpian todos los filtros, todos los gastos del presupuesto deben volver a ser visibles.

**Valida: Requisitos 8.4**

### Propiedad 26: Unicidad de Identificadores en Datos Maestros

*Para cualquier* intento de crear un elemento de datos maestros (dirección tecnológica, área de usuario, empresa financiera) con un código que ya existe, el sistema debe rechazar la creación.

**Valida: Requisitos 9.2**

### Propiedad 27: Actualización de Referencias en Modificación de Datos Maestros

*Para cualquier* elemento de datos maestros modificado que está referenciado por gastos existentes, cuando se consultan esos gastos, deben reflejar los valores actualizados del elemento de datos maestros.

**Valida: Requisitos 9.3**

### Propiedad 28: Protección de Eliminación de Datos Maestros en Uso

*Para cualquier* elemento de datos maestros que está referenciado por al menos un gasto existente, el intento de eliminación debe ser rechazado por el sistema.

**Valida: Requisitos 9.4**

### Propiedad 29: Completitud de Tabla de Valores Plan

*Para cualquier* conjunto de valores plan en el sistema, cuando se accede a la sección de valores plan, todos los valores plan deben aparecer en la tabla con sus campos de gasto y mes.

**Valida: Requisitos 10.1**

### Propiedad 30: Completitud de Tabla de Transacciones

*Para cualquier* conjunto de transacciones en el sistema, cuando se accede a la sección de valores reales, todas las transacciones deben aparecer con fecha de servicio, fecha de contabilización, número de documento y enlace externo.

**Valida: Requisitos 10.2**

### Propiedad 31: Filtrado de Transacciones por Gasto

*Para cualquier* gasto seleccionado en el visor de transacciones, solo las transacciones asociadas a ese gasto específico deben ser visibles en la tabla.

**Valida: Requisitos 10.3**

### Propiedad 32: Ordenamiento de Transacciones

*Para cualquier* columna seleccionada para ordenamiento en la tabla de transacciones, las filas deben reordenarse según los valores de esa columna en orden ascendente o descendente según se especifique.

**Valida: Requisitos 10.4**

### Propiedad 33: Completitud de Visualización de Metadatos

*Para cualquier* gasto visualizado (en sección de metadatos o popup de detalle), todos los campos base y todos los campos configurables de etiquetas deben ser mostrados.

**Valida: Requisitos 11.1, 12.2, 12.3**

### Propiedad 34: Visualización de Campos Multi-Selección

*Para cualquier* campo multi-selección (direcciones tecnológicas, áreas de usuario) de un gasto, todos los valores seleccionados deben aparecer listados en la visualización.

**Valida: Requisitos 11.2**

### Propiedad 35: Formato de Etiquetas según Configuración

*Para cualquier* campo de etiqueta mostrado, el valor debe ser renderizado según el formato configurado en la definición de la etiqueta (FORMAT, FREE_TEXT o SELECT_LIST).

**Valida: Requisitos 11.3**

### Propiedad 36: Validación de Formato en Actualización de Metadatos

*Para cualquier* intento de actualizar un metadato con un valor que no cumple el formato configurado para ese campo, el sistema debe rechazar la actualización.

**Valida: Requisitos 11.4**

### Propiedad 37: Apertura de Popup al Click en Gasto

*Para cualquier* gasto en la tabla de gastos, cuando se hace click en él, el popup de detalle debe abrirse mostrando la información de ese gasto específico.

**Valida: Requisitos 12.1**

### Propiedad 38: Preservación de Estado de Filtros al Cerrar Popup

*Para cualquier* popup de detalle abierto con filtros activos en la tabla, cuando se cierra el popup, los filtros deben permanecer activos y la tabla debe mantener el mismo estado de filtrado.

**Valida: Requisitos 12.4**

### Propiedad 39: Atomicidad de Operaciones Múltiples

*Para cualquier* operación que involucre múltiples escrituras a la base de datos (por ejemplo, crear presupuesto con gastos), si alguna parte falla, todas las escrituras deben revertirse (rollback) para mantener consistencia.

**Valida: Requisitos 14.4**

## Manejo de Errores

### Estrategia General

El sistema implementa manejo de errores en tres capas:

1. **Validación en Frontend**: Validación inmediata de entrada de usuario antes de enviar al backend
2. **Validación en Backend**: Validación de reglas de negocio y restricciones de datos
3. **Manejo de Errores de Base de Datos**: Captura y traducción de errores de base de datos a mensajes comprensibles

### Tipos de Errores

#### Errores de Validación (400 Bad Request)

- Campos requeridos faltantes
- Formatos de datos inválidos
- Valores fuera de rango (ej: mes no entre 1-12)
- Referencias a entidades inexistentes
- Violaciones de unicidad

**Respuesta de Error:**
```typescript
{
  error: "VALIDATION_ERROR",
  message: "Descripción legible del error",
  fields: {
    fieldName: "Mensaje específico del campo"
  }
}
```

#### Errores de Integridad Referencial (409 Conflict)

- Intento de eliminar datos maestros en uso
- Violación de restricciones de clave foránea
- Duplicación de identificadores únicos

**Respuesta de Error:**
```typescript
{
  error: "INTEGRITY_ERROR",
  message: "No se puede eliminar el elemento porque está en uso",
  references: ["expense-1", "expense-2"]
}
```

#### Errores de Recurso No Encontrado (404 Not Found)

- Consulta de entidad inexistente
- Acceso a presupuesto/gasto/transacción eliminado

**Respuesta de Error:**
```typescript
{
  error: "NOT_FOUND",
  message: "El recurso solicitado no existe",
  resourceType: "Budget",
  resourceId: "abc-123"
}
```

#### Errores de Conversión de Moneda (422 Unprocessable Entity)

- Tasa de conversión no configurada para moneda/mes
- Moneda no soportada

**Respuesta de Error:**
```typescript
{
  error: "CONVERSION_ERROR",
  message: "No hay tasa de conversión configurada",
  currency: "EUR",
  month: 3,
  budgetId: "budget-123"
}
```

#### Errores de Servidor (500 Internal Server Error)

- Errores inesperados de base de datos
- Fallos de conexión
- Errores de lógica no capturados

**Respuesta de Error:**
```typescript
{
  error: "INTERNAL_ERROR",
  message: "Error interno del servidor",
  requestId: "req-xyz-789"  // Para rastreo en logs
}
```

### Manejo de Errores en Frontend

```typescript
// Ejemplo de manejo de errores en componente React
const handleCreateExpense = async (data: ExpenseInput) => {
  try {
    const expense = await expenseService.createExpense(budgetId, data);
    showSuccessMessage("Gasto creado exitosamente");
    return expense;
  } catch (error) {
    if (error.status === 400) {
      // Mostrar errores de validación en formulario
      setFieldErrors(error.fields);
    } else if (error.status === 409) {
      // Mostrar mensaje de conflicto
      showErrorMessage(error.message);
    } else if (error.status === 422) {
      // Error de conversión de moneda
      showErrorMessage(`Error de conversión: ${error.message}`);
    } else {
      // Error genérico
      showErrorMessage("Ocurrió un error inesperado. Por favor intente nuevamente.");
    }
    throw error;
  }
};
```

### Logging y Monitoreo

- Todos los errores 500 se registran con stack trace completo
- Errores 400/409/422 se registran con contexto de usuario y datos de entrada
- Métricas de tasa de error por endpoint
- Alertas automáticas para errores críticos

## Estrategia de Testing

### Enfoque Dual de Testing

El sistema utiliza un enfoque complementario que combina:

1. **Tests Unitarios**: Verifican ejemplos específicos, casos edge y condiciones de error
2. **Tests Basados en Propiedades**: Verifican propiedades universales a través de múltiples entradas generadas

Ambos tipos de tests son necesarios para cobertura completa. Los tests unitarios capturan bugs concretos y casos específicos, mientras que los tests de propiedades verifican corrección general a través de randomización.

### Balance de Tests Unitarios

Los tests unitarios son útiles para:
- Ejemplos específicos que demuestran comportamiento correcto
- Puntos de integración entre componentes
- Casos edge y condiciones de error

Evitar escribir demasiados tests unitarios - los tests basados en propiedades manejan la cobertura de múltiples entradas. Enfocarse en casos que realmente agregan valor.

### Configuración de Tests Basados en Propiedades

**Librería**: fast-check (para TypeScript/JavaScript)

**Configuración**:
- Mínimo 100 iteraciones por test de propiedad (debido a randomización)
- Cada test debe referenciar su propiedad del documento de diseño
- Formato de tag: `Feature: tech-budget-management, Property {número}: {texto de propiedad}`

**Ejemplo de Test de Propiedad:**

```typescript
import fc from 'fast-check';

describe('Budget Management Properties', () => {
  // Feature: tech-budget-management, Property 1: Unicidad de Presupuestos
  it('should ensure budget uniqueness by year and version', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2020, max: 2030 }),
        fc.string({ minLength: 1, maxLength: 10 }),
        async (year, version) => {
          // Crear primer presupuesto
          const budget1 = await budgetService.createBudget(year, version);
          
          // Intentar crear segundo presupuesto con mismo año y versión
          await expect(
            budgetService.createBudget(year, version)
          ).rejects.toThrow();
          
          // Limpiar
          await budgetService.deleteBudget(budget1.id);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: tech-budget-management, Property 11: Cálculo de Total como Suma Mensual
  it('should calculate total as sum of 12 monthly values', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.float({ min: 0, max: 100000 }), { minLength: 12, maxLength: 12 }),
        async (monthlyValues) => {
          const expenseId = await createTestExpense();
          
          // Crear valores plan
          const planValue = await planValueService.createPlanValue(expenseId, {
            expenseId,
            monthlyValues: monthlyValues.map((value, index) => ({
              transactionCurrency: 'USD',
              transactionValue: value,
              usdValue: value,
              conversionRate: 1.0,
              month: index + 1
            }))
          });
          
          // Verificar que el total sea la suma
          const expectedTotal = monthlyValues.reduce((sum, val) => sum + val, 0);
          expect(planValue.total.usdValue).toBeCloseTo(expectedTotal, 2);
          
          // Limpiar
          await cleanupTestData(expenseId);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Tests Unitarios de Ejemplo

```typescript
describe('Expense Service', () => {
  it('should create expense with all required fields', async () => {
    const expenseData = {
      code: 'EXP-001',
      shortDescription: 'Software Licenses',
      longDescription: 'Annual software licenses for development team',
      technologyDirections: ['tech-dir-1'],
      userAreas: ['user-area-1'],
      financialCompanyId: 'company-1',
      tags: {}
    };
    
    const expense = await expenseService.createExpense(budgetId, expenseData);
    
    expect(expense.code).toBe('EXP-001');
    expect(expense.shortDescription).toBe('Software Licenses');
  });
  
  it('should reject expense creation with missing required fields', async () => {
    const incompleteData = {
      code: 'EXP-002',
      // Falta shortDescription
      longDescription: 'Test',
      technologyDirections: [],
      userAreas: [],
      financialCompanyId: 'company-1',
      tags: {}
    };
    
    await expect(
      expenseService.createExpense(budgetId, incompleteData)
    ).rejects.toThrow('shortDescription is required');
  });
});
```

### Tests de Integración

```typescript
describe('Budget to Expense Integration', () => {
  it('should cascade delete expenses when budget is deleted', async () => {
    const budget = await budgetService.createBudget(2024, 'v1');
    const expense = await expenseService.createExpense(budget.id, testExpenseData);
    
    await budgetService.deleteBudget(budget.id);
    
    await expect(
      expenseService.getExpense(expense.id)
    ).rejects.toThrow('NOT_FOUND');
  });
});
```

### Cobertura de Testing

**Objetivo de Cobertura**:
- Servicios de Backend: 90%+ cobertura de líneas
- Componentes de Frontend: 80%+ cobertura de líneas
- Propiedades de Corrección: 100% implementadas como tests

**Áreas Críticas para Testing**:
1. Conversión de monedas (alta complejidad, crítico para negocio)
2. Cálculos de agregación mensual (propenso a errores de lógica)
3. Validación de integridad referencial (crítico para consistencia de datos)
4. Filtrado y ordenamiento de tablas (alta complejidad de UI)
5. Manejo de jerarquía de gastos (recursión puede causar bugs)

### Estrategia de Testing por Capa

**Backend Services**:
- Tests de propiedades para lógica de negocio core
- Tests unitarios para casos edge y validaciones
- Tests de integración para flujos completos

**Frontend Components**:
- Tests unitarios para renderizado y interacciones
- Tests de propiedades para lógica de filtrado y ordenamiento
- Tests de integración para flujos de usuario completos

**Base de Datos**:
- Tests de migración para cambios de esquema
- Tests de integridad referencial
- Tests de performance para consultas complejas
