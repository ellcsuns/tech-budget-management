# Plan de Implementación: Restricción de Edición de Meses y Compensación Parcial

## Visión General

Implementación en dos partes: (1) restricción de meses pasados en popups de presupuesto, (2) compensación parcial de transacciones comprometidas. Se implementa primero el backend de compensación parcial (schema + service), luego el frontend de ambas funcionalidades.

## Tareas

- [x] 1. Restricción de edición de meses en BudgetsPage
  - [x] 1.1 Agregar lógica de mes actual y función `isMonthDisabled` en `BudgetsPage.tsx`
    - Crear constante `currentMonth = new Date().getMonth() + 1`
    - Crear función `isMonthDisabled(monthNumber: number) => monthNumber < currentMonth`
    - _Requirements: 1.1, 2.1_
  - [x] 1.2 Deshabilitar inputs de meses pasados en el popup de edición (Change Request)
    - Agregar `disabled={isMonthDisabled(i + 1)}` a cada input de mes en el popup de edición
    - Aplicar estilos de solo lectura: `bg-gray-100 text-gray-400 cursor-not-allowed`
    - Asegurar que los valores originales se preservan para meses deshabilitados al enviar
    - _Requirements: 1.2, 1.3, 1.4_
  - [x] 1.3 Deshabilitar inputs de meses pasados en el popup de agregar línea presupuestaria
    - Agregar `disabled={isMonthDisabled(i + 1)}` a cada input de mes en el popup de agregar
    - Forzar valor 0 para meses deshabilitados
    - Aplicar mismos estilos de solo lectura
    - _Requirements: 2.2, 2.3, 2.4_
  - [ ]* 1.4 Escribir property test para función isMonthDisabled
    - **Property 1: Función de deshabilitación de meses**
    - **Validates: Requirements 1.2, 2.2**

- [x] 2. Migración de schema para compensación parcial
  - [x] 2.1 Modificar modelo Transaction en Prisma schema
    - Eliminar `@unique` de `compensatedById`
    - Agregar campo `compensatedAmount Decimal @default(0) @db.Decimal(15, 2)`
    - Eliminar relación inversa `compensates Transaction? @relation("Compensation")`
    - Cambiar relación a: `compensatedBy Transaction? @relation("Compensation", fields: [compensatedById], references: [id])`
    - Agregar `compensatingTransactions Transaction[] @relation("Compensation")` para la relación inversa 1:N
    - _Requirements: 3.1, 3.2_
  - [x] 2.2 Crear migración y script de datos existentes
    - Generar migración con `npx prisma migrate dev`
    - Agregar SQL de migración de datos: `UPDATE "Transaction" SET "compensatedAmount" = "transactionValue" WHERE "isCompensated" = true AND type = 'COMMITTED'`
    - _Requirements: 3.1, 3.2_

- [x] 3. Actualizar TransactionService para compensación parcial
  - [x] 3.1 Modificar `createTransaction` para acumular compensatedAmount
    - Cambiar validación: en lugar de `if (committed.isCompensated)`, validar `compensatedAmount >= transactionValue`
    - Dentro de la transacción de BD: sumar valor de la real al `compensatedAmount` de la comprometida
    - Calcular `isCompensated = (newCompensatedAmount >= transactionValue)`
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [x] 3.2 Modificar `deleteTransaction` para restar compensatedAmount
    - Restar valor de la real del `compensatedAmount` de la comprometida
    - Usar `Math.max(0, ...)` para garantizar no negatividad
    - Recalcular `isCompensated`
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 3.3 Actualizar `getMonthlyCommitted` para usar saldo pendiente
    - Cambiar query para traer todas las comprometidas del mes (no solo `isCompensated: false`)
    - Calcular total como suma de `(transactionValue - compensatedAmount)` por transacción
    - _Requirements: 8.1, 9.2_
  - [ ]* 3.4 Escribir property tests para lógica de compensación
    - **Property 3: Invariante de isCompensated**
    - **Property 4: Acumulación de compensación (round-trip)**
    - **Property 5: compensatedAmount no negativo**
    - **Property 6: Rechazo de compensación sobre comprometida completa**
    - **Validates: Requirements 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3**

- [ ] 4. Checkpoint - Verificar backend
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Actualizar tipo Transaction en frontend
  - [x] 5.1 Agregar campo `compensatedAmount` a la interfaz Transaction en los tipos del frontend
    - Agregar `compensatedAmount: number` a la interfaz Transaction
    - _Requirements: 3.1_

- [x] 6. Actualizar página de transacciones comprometidas
  - [x] 6.1 Agregar columnas Compensado, Pendiente y badge triestado en `CommittedTransactionsPage.tsx`
    - Agregar columna "Compensado" mostrando `compensatedAmount`
    - Agregar columna "Pendiente" mostrando `transactionValue - compensatedAmount`
    - Agregar badge: "No" (amarillo) si `compensatedAmount === 0`, "Parcial" (naranja) si parcial, "Sí" (verde) si completa
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  - [ ]* 6.2 Escribir property test para badge triestado
    - **Property 8: Badge triestado de compensación**
    - **Validates: Requirements 7.3, 7.4, 7.5**

- [x] 7. Actualizar página de transacciones reales (picker de comprometidas)
  - [x] 7.1 Modificar picker de comprometidas en `RealTransactionsPage.tsx`
    - Mostrar saldo pendiente junto al valor original en cada opción del picker
    - Pre-llenar campo de valor con saldo pendiente al seleccionar comprometida
    - Mostrar advertencia si el monto ingresado excede el saldo pendiente
    - _Requirements: 10.1, 10.2, 10.3_

- [x] 8. Actualizar Dashboard y ExpenseTable
  - [x] 8.1 Modificar cálculo de comprometido en `ExpenseTable.tsx`
    - Cambiar filtro de committed: en lugar de `!t.isCompensated`, incluir todas las comprometidas
    - Calcular total como suma de `(transactionValue - compensatedAmount)` por transacción
    - Aplicar misma lógica en totales por empresa financiera
    - _Requirements: 8.1, 8.2_
  - [ ]* 8.2 Escribir property test para cálculo de totales
    - **Property 9: Cálculo de totales de comprometido usando saldo pendiente**
    - **Validates: Requirements 8.1, 8.2, 9.2**

- [x] 9. Actualizar popup de detalle de línea presupuestaria
  - [x] 9.1 Modificar `BudgetLineDetailPopup.tsx` para mostrar compensación
    - Agregar columnas Compensado y Pendiente en tabla de comprometidas
    - Calcular total mensual de comprometido usando saldo pendiente
    - _Requirements: 9.1, 9.2_

- [x] 10. Checkpoint final
  - Ensure all tests pass, ask the user if questions arise.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los checkpoints aseguran validación incremental
- Los property tests validan propiedades universales de correctitud
- Los unit tests validan ejemplos específicos y edge cases
