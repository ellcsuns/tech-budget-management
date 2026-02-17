# Plan de Implementación: Refactorización de Lógica de Negocio

## Visión General

Refactorización incremental del modelo de datos y lógica de negocio: primero el schema y migración, luego los servicios del backend, y finalmente los cambios en el frontend. Se usa TypeScript en todo el stack.

## Tareas

- [ ] 1. Crear modelo AllowedCurrency y modificar FinancialCompany
  - [x] 1.1 Agregar modelo `AllowedCurrency` al schema de Prisma con campos `id`, `code` (unique, ISO 4217), `name`, timestamps
    - Agregar campo `currencyCode` a `FinancialCompany` con relación a `AllowedCurrency`
    - Crear migración de Prisma
    - _Requisitos: 3.1, 3.2_
  - [~] 1.2 Crear seed de monedas permitidas (USD, EUR, CLP) y actualizar seed de FinancialCompany para incluir currencyCode
    - _Requisitos: 3.1_
  - [ ]* 1.3 Escribir test de propiedad para validación de moneda de empresa financiera
    - **Propiedad 6: Validación de moneda de empresa financiera contra maestro**
    - **Valida: Requisitos 3.2, 3.3**

- [ ] 2. Refactorizar modelo Expense como entidad maestra independiente
  - [~] 2.1 Modificar modelo `Expense` en schema de Prisma: eliminar `budgetId`, `financialCompanyId` y relaciones con Budget/FinancialCompany/Transaction/PlanValue. Cambiar constraint de `code` a `@unique` global
    - _Requisitos: 1.1, 1.5_
  - [~] 2.2 Refactorizar `ExpenseService` para operar sin budgetId ni financialCompanyId
    - Eliminar parámetro `budgetId` de `createExpense`
    - Cambiar validación de unicidad de código a nivel global
    - Modificar `getExpense` para retornar solo datos maestros y tags (sin transacciones ni presupuestos)
    - Actualizar `getAllExpenses` para no incluir transacciones ni planValues
    - _Requisitos: 1.1, 1.2, 1.3_
  - [~] 2.3 Actualizar rutas de expenses en Express para reflejar la nueva interfaz sin budgetId
    - _Requisitos: 1.1_
  - [ ]* 2.4 Escribir tests de propiedad para gasto maestro
    - **Propiedad 1: Independencia del gasto**
    - **Propiedad 2: Unicidad global de código de gasto**
    - **Propiedad 3: Consulta de gasto retorna solo datos maestros**
    - **Valida: Requisitos 1.1, 1.2, 1.3**

- [ ] 3. Crear modelo BudgetLine y servicio
  - [~] 3.1 Agregar modelo `BudgetLine` al schema de Prisma con clave compuesta `@@unique([budgetId, expenseId, financialCompanyId])`, campos planM1-planM12, currency, y relaciones
    - Modificar modelo `Budget` para usar `budgetLines` en lugar de `expenses`
    - Eliminar modelo `PlanValue`
    - Actualizar relaciones de `Saving` y `Deferral` para apuntar a `BudgetLine` en lugar de `Expense`
    - Crear migración de Prisma
    - _Requisitos: 2.1, 2.2, 2.5_
  - [~] 3.2 Crear `BudgetLineService` con métodos: `createBudgetLine`, `getBudgetLinesByBudget`, `updatePlanValues`, `deleteBudgetLine`
    - En `createBudgetLine`: derivar moneda de la empresa financiera, inicializar planM1-planM12 en 0
    - _Requisitos: 2.3, 2.4, 3.4_
  - [~] 3.3 Crear rutas REST para BudgetLine (`/api/budget-lines`)
    - _Requisitos: 2.1_
  - [~] 3.4 Refactorizar `BudgetService` para usar BudgetLine en lugar de la relación directa con Expense
    - Actualizar `createNewVersion` para copiar BudgetLines en lugar de Expenses+PlanValues
    - Actualizar `addExpenseToBudget` y `removeExpenseFromBudget`
    - _Requisitos: 2.1, 2.2_
  - [ ]* 3.5 Escribir tests de propiedad para BudgetLine
    - **Propiedad 4: Unicidad de clave compuesta de línea de presupuesto**
    - **Propiedad 5: Estructura de línea de presupuesto con 12 meses inicializados en cero**
    - **Valida: Requisitos 2.1, 2.2, 2.3, 2.4, 3.4**

- [ ] 4. Checkpoint - Verificar schema y servicios base
  - Asegurar que todas las migraciones se ejecutan correctamente, los tests pasan, preguntar al usuario si hay dudas.

- [ ] 5. Refactorizar Transaction con compensación y sociedad financiera
  - [~] 5.1 Modificar modelo `Transaction` en schema de Prisma: cambiar `expenseId` por `budgetLineId`, agregar `financialCompanyId`, `compensatedById` (self-relation), `isCompensated`
    - Crear migración
    - _Requisitos: 5.1, 6.1_
  - [~] 5.2 Refactorizar `TransactionService`:
    - Cambiar referencia de `expenseId` a `budgetLineId`
    - Agregar `financialCompanyId` obligatorio en creación
    - Derivar mes desde `postingDate` en lugar de `serviceDate`
    - Implementar lógica de compensación: al crear REAL con `committedTransactionId`, marcar la comprometida como compensada
    - Implementar reversión de compensación al eliminar REAL que compensaba
    - Agregar método `getUncompensatedCommitted(budgetLineId)` para filtrar comprometidas no compensadas
    - Modificar `getMonthlyCommitted` para excluir transacciones compensadas
    - _Requisitos: 4.1, 4.2, 4.3, 5.2, 5.3, 5.4, 5.5, 6.1, 6.4_
  - [~] 5.3 Actualizar rutas de transactions para incluir financialCompanyId y committedTransactionId
    - _Requisitos: 6.1, 5.1_
  - [ ]* 5.4 Escribir tests de propiedad para transacciones y compensación
    - **Propiedad 7: Filtrado de transacciones comprometidas no compensadas y suma mensual**
    - **Propiedad 8: Detección de mes por fecha de imputación**
    - **Propiedad 9: Compensación al crear transacción real**
    - **Propiedad 10: Reversión de compensación (ida y vuelta)**
    - **Propiedad 11: Independencia de moneda de transacción respecto a empresa financiera**
    - **Propiedad 12: Precisión decimal de montos**
    - **Propiedad 13: Validación de empresa financiera en transacciones**
    - **Valida: Requisitos 4.1, 4.2, 4.3, 5.2, 5.3, 5.4, 5.5, 6.2, 6.3, 6.4**

- [ ] 6. Checkpoint - Verificar lógica de compensación
  - Asegurar que todos los tests pasan, la lógica de compensación funciona correctamente, preguntar al usuario si hay dudas.

- [ ] 7. Actualizar tipos del frontend y servicios API
  - [~] 7.1 Actualizar `frontend/src/types/index.ts`: modificar interfaces Expense (sin budgetId, financialCompanyId), agregar BudgetLine, AllowedCurrency, actualizar Transaction (con budgetLineId, financialCompanyId, compensatedById, isCompensated), actualizar FinancialCompany (con currencyCode)
    - _Requisitos: 1.1, 2.1, 5.1, 6.1_
  - [~] 7.2 Actualizar servicios API del frontend para usar las nuevas rutas de budget-lines y los campos modificados de expenses y transactions
    - _Requisitos: 2.1, 1.1_

- [ ] 8. Refactorizar UI de gastos
  - [~] 8.1 Modificar `ExpensesPage.tsx`: eliminar columnas de empresa financiera y moneda de la tabla, eliminar campo de presupuesto y empresa financiera del formulario de creación
    - _Requisitos: 7.1, 7.3, 7.4_
  - [~] 8.2 Modificar `ExpenseDetailPopup.tsx`: eliminar sección de transacciones (committedByMonth, realByMonth, renderTxnTable), mostrar solo datos maestros y tagging
    - _Requisitos: 7.2_

- [ ] 9. Actualizar Dashboard y páginas de transacciones
  - [~] 9.1 Actualizar `Dashboard.tsx` y `ExpenseTable` para usar BudgetLine en lugar de Expense directo, y filtrar comprometidas no compensadas
    - _Requisitos: 4.1, 4.4, 5.3_
  - [~] 9.2 Actualizar `RealTransactionsPage.tsx` para incluir campo de empresa financiera y selector de transacción comprometida a compensar
    - _Requisitos: 5.1, 6.1_
  - [~] 9.3 Actualizar `BudgetsPage.tsx` para trabajar con BudgetLines en lugar de Expenses directos
    - _Requisitos: 2.1, 2.2_

- [ ] 10. Checkpoint final - Verificar integración completa
  - Asegurar que todos los tests pasan, la UI funciona correctamente con el nuevo modelo de datos, preguntar al usuario si hay dudas.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los checkpoints aseguran validación incremental
- Los tests de propiedad validan propiedades universales de correctitud
- Los tests unitarios validan ejemplos específicos y casos borde
- La migración de datos existentes debe planificarse como paso separado antes de desplegar
