# Plan de Implementación: Dashboard Popup y Correcciones de Ahorros

## Visión General

Implementación de cuatro mejoras UI: popup de detalle en dashboard con meses verticales, formulario de agregar línea con meses verticales, cálculo automático de monto de ahorro, y filtros en la sección de ahorros. El lenguaje de implementación es TypeScript/React.

## Tareas

- [x] 1. Crear el componente BudgetLineDetailPopup
  - [x] 1.1 Crear `frontend/src/components/BudgetLineDetailPopup.tsx` con la interfaz que recibe `BudgetLine`, `Saving[]` y `onClose`
    - Extraer función pura `calcMonthlyBreakdown(budgetLine, activeSavings)` que retorna un array de 12 objetos con `{ month, budget, committed, real, diff }`
    - Extraer función pura `calcTotals(monthlyBreakdown)` que suma cada columna
    - Renderizar encabezado con código y descripción del gasto
    - Renderizar metadatos: moneda (`budgetLine.currency`), sociedad (`budgetLine.financialCompany`), categoría (`budgetLine.expense.category`)
    - Renderizar tabla vertical con M1-M12 como filas y columnas: Presupuesto, Comprometido, Real, Diferencia
    - Renderizar fila de totales al final
    - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 1.2 Escribir test de propiedad para cálculo de valores mensuales y totales
    - **Propiedad 3: Diferencia mensual correcta** — Para cualquier mes, diff = budget - committed - real
    - **Propiedad 4: Totales como suma de valores mensuales** — Los totales son la suma exacta de cada columna
    - **Propiedad 5: Presupuesto neto con ahorros** — budget = planValue - savingAmount por mes
    - **Valida: Requisitos 1.3, 1.4, 1.5, 2.2**

- [x] 2. Integrar BudgetLineDetailPopup en el Dashboard
  - [x] 2.1 Modificar `frontend/src/components/ExpenseTable.tsx` en modo COMPARISON para que al hacer clic en una fila se abra `BudgetLineDetailPopup` en lugar de `ExpenseDetailPopup`
    - Pasar la `BudgetLine` completa y los `activeSavings` como props al nuevo popup
    - Mantener el comportamiento existente en modo PLAN (sigue abriendo ExpenseDetailPopup)
    - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 3. Checkpoint - Verificar que el popup del dashboard funciona correctamente
  - Asegurar que todos los tests pasan, preguntar al usuario si surgen dudas.

- [x] 4. Modificar el popup de agregar línea presupuestaria
  - [x] 4.1 Modificar el formulario de agregar línea en `frontend/src/pages/BudgetsPage.tsx` para mostrar meses en formato vertical
    - Reemplazar la grilla `grid-cols-6` por un diseño vertical idéntico al popup de edición (`editPopupLine`)
    - Cada fila: etiqueta del mes + campo de entrada numérica
    - Mostrar total calculado al final
    - _Requisitos: 2.1, 2.2, 2.3_

- [x] 5. Corregir el cálculo del monto total de ahorro
  - [x] 5.1 Verificar y asegurar que el backend calcula `totalAmount` como suma de valores mensuales en `backend/src/services/SavingService.ts`
    - El backend ya lo hace correctamente en `createSaving()`, verificar que no hay otro path que establezca totalAmount manualmente
    - _Requisitos: 3.1_

  - [x] 5.2 Modificar el formulario de creación de ahorro en `frontend/src/pages/SavingsPage.tsx`
    - Eliminar cualquier campo editable de monto total
    - Mostrar el total como valor calculado de solo lectura (suma de valores mensuales)
    - _Requisitos: 3.2_

  - [x] 5.3 Modificar el popup de detalle de ahorro en `frontend/src/pages/SavingsPage.tsx`
    - Calcular el total mostrado como suma de savingM1..savingM12 en lugar de usar `saving.totalAmount`
    - _Requisitos: 3.3_

  - [ ]* 5.4 Escribir test de propiedad para invariante de monto total de ahorro
    - **Propiedad 6: Invariante del monto total de ahorro** — totalAmount = sum(savingM1..savingM12)
    - **Valida: Requisitos 3.1, 3.3, 3.4**

- [x] 6. Checkpoint - Verificar correcciones de ahorro
  - Asegurar que todos los tests pasan, preguntar al usuario si surgen dudas.

- [x] 7. Agregar filtros en la sección de ahorros
  - [x] 7.1 Agregar estado de filtros y lógica de filtrado en `frontend/src/pages/SavingsPage.tsx`
    - Agregar estado para filtros: `currencies`, `financialCompanyIds`, `categories`, `technologyDirectionIds`
    - Cargar datos maestros: monedas (de las líneas presupuestarias), categorías de gasto, sociedades financieras, direcciones tecnológicas
    - Implementar función de filtrado que filtra la lista de ahorros por las propiedades de su `budgetLine` asociada
    - Renderizar controles de filtro (botones toggle similares al FilterPanel del dashboard)
    - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ]* 7.2 Escribir test de propiedad para filtrado de ahorros
    - **Propiedad 7: Filtros individuales retornan solo elementos coincidentes** — Todos los ahorros mostrados coinciden con el filtro aplicado
    - **Propiedad 8: Filtros combinados como intersección** — El resultado de filtros combinados es la intersección de filtros individuales
    - **Valida: Requisitos 4.2, 4.3, 4.4, 4.5, 4.6**

- [x] 8. Checkpoint final - Verificar todas las mejoras
  - Asegurar que todos los tests pasan, preguntar al usuario si surgen dudas.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los checkpoints aseguran validación incremental
- Los tests de propiedades validan propiedades universales de correctitud
- Los tests unitarios validan ejemplos específicos y casos borde
