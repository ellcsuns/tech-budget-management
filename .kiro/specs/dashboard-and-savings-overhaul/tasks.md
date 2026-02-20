# Plan de Implementación: Dashboard y Reestructuración de Ahorros

## Visión General

Implementación incremental de mejoras al Dashboard, corrección de bugs, reestructuración de ahorros, trazabilidad de modificaciones, configuración de presupuesto vigente, workflow de revisión, y estandarización de diálogos. Se usa TypeScript tanto en backend como frontend.

## Tareas

- [x] 1. Migración de esquema Prisma: nuevos campos
  - [x] 1.1 Agregar campos de trazabilidad a BudgetLine
    - Agregar `lastModifiedAt DateTime?` y `lastModifiedById String?` al modelo `BudgetLine` en `backend/prisma/schema.prisma`
    - Agregar relación `lastModifiedBy User? @relation("BudgetLineModifier", fields: [lastModifiedById], references: [id])`
    - Agregar relación inversa `modifiedBudgetLines BudgetLine[] @relation("BudgetLineModifier")` en modelo `User`
    - _Requisitos: 7.1_
  - [x] 1.2 Agregar campos mensuales al modelo Saving
    - Agregar `savingM1` a `savingM12` como `Decimal @default(0) @db.Decimal(15, 2)` al modelo `Saving`
    - Cambiar enum `SavingStatus` de `PENDING | APPROVED` a `PENDING | ACTIVE`
    - _Requisitos: 11.1, 11.2, 11.5, 11.6_
  - [x] 1.3 Agregar campos de revisión al modelo Budget
    - Agregar `reviewStatus String?`, `reviewSubmittedAt DateTime?`, `reviewSubmittedById String?` al modelo `Budget`
    - Agregar relación `reviewSubmittedBy User? @relation("BudgetReviewer", fields: [reviewSubmittedById], references: [id])`
    - Agregar relación inversa `reviewedBudgets Budget[] @relation("BudgetReviewer")` en modelo `User`
    - Ejecutar `npx prisma migrate dev --name dashboard-savings-overhaul`
    - _Requisitos: 6.2, 6.3_

- [x] 2. Fix de actualización de transacciones reales
  - [x] 2.1 Corregir TransactionService.updateTransaction
    - En `backend/src/services/TransactionService.ts`, método `updateTransaction()`
    - Eliminar la línea `delete updateData.budgetLineId` para permitir actualizar el budgetLineId
    - Agregar validación: si `data.budgetLineId` se proporciona, verificar que la budget line existe
    - Recalcular conversión USD usando el budgetId de la nueva budget line
    - _Requisitos: 3.1, 3.2, 3.3_
  - [ ]* 2.2 Escribir test de propiedad para actualización de transacción
    - **Propiedad 2: Actualización de transacción con budgetLineId (round-trip)**
    - **Valida: Requisito 3.1**

- [x] 3. Backend: Trazabilidad de modificaciones en BudgetLine
  - [x] 3.1 Actualizar operaciones de BudgetLine para registrar última modificación
    - En `backend/src/services/BudgetService.ts` y rutas de budget-lines
    - Al actualizar planValues de una BudgetLine, setear `lastModifiedAt = new Date()` y `lastModifiedById = userId`
    - Incluir `lastModifiedBy` en los includes de queries que retornan budget lines
    - _Requisitos: 7.1, 7.2_
  - [ ]* 3.2 Escribir test de propiedad para trazabilidad
    - **Propiedad 5: Trazabilidad de modificaciones en líneas presupuestarias**
    - **Valida: Requisito 7.1**

- [x] 4. Backend: Reestructuración del servicio de ahorros
  - [x] 4.1 Reestructurar SavingService
    - En `backend/src/services/SavingService.ts`:
    - Cambiar `SavingInput` para aceptar `savingM1` a `savingM12` en lugar de `distributionStrategy/targetMonth/customDistribution`
    - Calcular `totalAmount` como suma de savingM1-savingM12
    - Eliminar métodos `calculateMonthlyDistribution` y `validateCustomDistribution`
    - Nuevo método `activateSaving(id: string)` que cambia status a `ACTIVE`
    - Actualizar `createSaving` para usar los nuevos campos
    - Actualizar includes para retornar campos mensuales
    - _Requisitos: 11.1, 11.2, 11.3, 11.5, 11.6_
  - [x] 4.2 Actualizar rutas de ahorros
    - En `backend/src/routes/savingRoutes.ts` (o equivalente):
    - Cambiar endpoint de aprobación por endpoint de activación: `POST /savings/:id/activate`
    - Mantener endpoint de aprobación masiva pero renombrar a activación
    - _Requisitos: 11.5, 11.6_
  - [ ]* 4.3 Escribir tests de propiedad para ahorros
    - **Propiedad 6: Total de ahorro es suma de valores mensuales**
    - **Propiedad 7: Activar ahorro no modifica valores originales (invariante)**
    - **Valida: Requisitos 11.3, 11.6**

- [x] 5. Backend: Enviar presupuesto a revisión y configuración de vigente
  - [x] 5.1 Agregar método submitForReview en BudgetService
    - En `backend/src/services/BudgetService.ts`:
    - Nuevo método `submitForReview(budgetId: string, userId: string)` que actualiza reviewStatus, reviewSubmittedAt, reviewSubmittedById
    - Validar que el presupuesto no esté ya en revisión
    - _Requisitos: 6.1, 6.2, 6.3, 6.4_
  - [x] 5.2 Agregar ruta POST /budgets/:id/submit-review
    - En `backend/src/routes/budgetRoutes.ts`
    - Extraer userId del token de autenticación
    - _Requisitos: 6.2_
  - [ ]* 5.3 Escribir tests de propiedad para revisión y presupuesto vigente
    - **Propiedad 3: Exactamente un presupuesto vigente (invariante)**
    - **Propiedad 4: Envío a revisión registra metadatos**
    - **Valida: Requisitos 5.2, 6.2**

- [x] 6. Checkpoint - Verificar cambios de backend
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Frontend: Tipos actualizados
  - [x] 7.1 Actualizar tipos en frontend/src/types/index.ts
    - Agregar a `BudgetLine`: `lastModifiedAt?: string`, `lastModifiedById?: string`, `lastModifiedBy?: { id: string; username: string; fullName: string }`
    - Actualizar `Saving`: agregar `savingM1` a `savingM12` como `number`, cambiar status a `'PENDING' | 'ACTIVE'`
    - Agregar a `Budget`: `reviewStatus?: string`, `reviewSubmittedAt?: string`, `reviewSubmittedById?: string`, `reviewSubmittedBy?: { id: string; fullName: string }`
    - Agregar interfaz `CompanyTotals` con `companyId, companyCode, budget, committed, real, diff`
    - Actualizar interfaz de filtros del Dashboard para incluir `categories?: string[]`
    - _Requisitos: 7.1, 9.1, 11.2, 6.2, 8.2_

- [x] 8. Frontend: Mejoras al FilterPanel y nomenclatura de meses
  - [x] 8.1 Actualizar FilterPanel para mostrar código de empresa + tooltip
    - En `frontend/src/components/FilterPanel.tsx`:
    - Cambiar `{company.name}` por `{company.code}` en los botones de empresa financiera
    - Agregar `title={company.name}` a cada botón para tooltip
    - _Requisitos: 1.1, 1.2, 1.3_
  - [x] 8.2 Agregar filtro por categoría al FilterPanel
    - Extraer categorías únicas de `budgetLines[].expense?.category`
    - Agregar sección de botones toggle para categorías
    - Agregar prop `categories` al estado de filtros y función `toggleCategory`
    - Ocultar sección si no hay categorías
    - Actualizar `clearFilters` para limpiar categorías
    - _Requisitos: 8.1, 8.2, 8.3, 8.4_
  - [x] 8.3 Cambiar nomenclatura de meses a M1-M12 en ExpenseTable
    - En `frontend/src/components/ExpenseTable.tsx`:
    - Cambiar array `months` de `['Ene', 'Feb', ...]` a `['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12']`
    - _Requisitos: 2.1, 2.2_
  - [ ]* 8.4 Escribir test de propiedad para correctitud de filtros
    - **Propiedad 1: Correctitud de filtros en el Dashboard**
    - **Valida: Requisitos 1.3, 8.2, 8.3**

- [x] 9. Frontend: Dashboard basado en presupuesto vigente + totales por empresa
  - [x] 9.1 Refactorizar Dashboard para usar presupuesto vigente
    - En `frontend/src/pages/Dashboard.tsx`:
    - Reemplazar `budgetApi.getAll()` + búsqueda de activo por `budgetApi.getActive()`
    - Manejar caso de no encontrar presupuesto vigente con mensaje informativo
    - Agregar estado `categories` a los filtros y pasarlo al FilterPanel
    - Aplicar filtro de categorías en la lógica de filtrado
    - _Requisitos: 4.1, 4.2, 4.3, 8.2_
  - [x] 9.2 Implementar totales agrupados por empresa financiera
    - Calcular `CompanyTotals[]` a partir de las líneas filtradas
    - Mostrar indicadores (presupuesto, comprometido, real, diferencia) por cada empresa
    - Usar `company.code` como etiqueta de cada grupo
    - _Requisitos: 9.1, 9.2, 9.3_
  - [ ]* 9.3 Escribir test de propiedad para totales por empresa
    - **Propiedad 9: Totales por empresa financiera**
    - **Valida: Requisitos 9.1, 9.2**

- [x] 10. Frontend: Integración de ahorros en Dashboard
  - [x] 10.1 Cargar ahorros activos en el Dashboard
    - En `frontend/src/pages/Dashboard.tsx`:
    - Cargar ahorros activos del presupuesto vigente usando `savingsApi.getAll({ budgetId, status: 'ACTIVE' })`
    - Calcular valor consolidado por línea y mes: `planMx - sum(savingMx de ahorros activos para esa línea)`
    - _Requisitos: 11.7_
  - [x] 10.2 Mostrar valores consolidados y colorear celdas con ahorro
    - En `frontend/src/components/ExpenseTable.tsx`:
    - Recibir prop `activeSavings` con los ahorros activos
    - En vista COMPARISON, mostrar valor consolidado en lugar del original cuando hay ahorro
    - Aplicar clase CSS diferente (ej: `bg-amber-50 text-amber-800`) a celdas afectadas por ahorro
    - _Requisitos: 11.7, 11.8_
  - [x] 10.3 Mostrar desglose de ahorro en popup de detalle
    - En `frontend/src/components/ExpenseDetailPopup.tsx`:
    - Agregar sección/tab "Ahorros" que muestre desglose por mes (original, ahorro, consolidado)
    - Mostrar info de última modificación de la línea (lastModifiedAt, lastModifiedBy)
    - _Requisitos: 11.9, 7.2_
  - [ ]* 10.4 Escribir test de propiedad para valor consolidado
    - **Propiedad 8: Valor consolidado en Dashboard (original - ahorro)**
    - **Valida: Requisito 11.7**

- [x] 11. Checkpoint - Verificar integración Dashboard
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Frontend: Reestructuración de SavingsPage
  - [x] 12.1 Reemplazar formulario de ahorro por inputs M1-M12
    - En `frontend/src/pages/SavingsPage.tsx`:
    - Eliminar selector de `distributionStrategy`, `targetMonth`, `customDistribution`
    - Agregar 12 inputs numéricos (M1-M12) para ingresar valores mensuales
    - Calcular y mostrar total automáticamente como suma de M1-M12
    - Actualizar `handleCreateSaving` para enviar `savingM1`-`savingM12`
    - _Requisitos: 11.2, 11.3_
  - [x] 12.2 Agregar popup de detalle de ahorro
    - Crear componente `SavingDetailPopup` o modal inline
    - Al hacer click en un ahorro, mostrar popup con valores M1-M12, total, estado, usuario
    - _Requisitos: 11.4_
  - [x] 12.3 Agregar botón "Activar" y reemplazar popup nativo
    - Agregar botón "Activar" en ahorros con status PENDING
    - Llamar a `savingsApi.activate(id)` (nuevo endpoint)
    - Reemplazar `confirm()` nativo en `handleDeleteSaving` por `ConfirmationDialog`
    - Agregar endpoint `activate` al `savingsApi` en `frontend/src/services/api.ts`
    - _Requisitos: 11.5, 11.6, 10.1_

- [x] 13. Frontend: Configuración de presupuesto vigente
  - [x] 13.1 Agregar sección de presupuesto vigente en ConfigurationPage
    - En `frontend/src/pages/ConfigurationPage.tsx`:
    - Cargar lista de presupuestos con `budgetApi.getAll()`
    - Mostrar presupuesto vigente actual con indicador visual (badge verde)
    - Agregar selector dropdown para cambiar presupuesto vigente
    - Botón "Establecer como Vigente" con `ConfirmationDialog` antes de ejecutar
    - Llamar a `budgetApi.setActive(id)` al confirmar
    - _Requisitos: 5.1, 5.2, 5.3, 5.4_

- [x] 14. Frontend: Enviar presupuesto a revisión y columnas colapsables
  - [x] 14.1 Agregar botón "Enviar a Revisión" en BudgetsPage
    - En `frontend/src/pages/BudgetsPage.tsx`:
    - Agregar botón "Enviar a Revisión" junto a los botones de acción del presupuesto
    - Deshabilitar si `selectedBudget.reviewStatus` ya tiene valor
    - Mostrar badge con estado de revisión si aplica
    - Agregar `budgetApi.submitForReview(id)` al `frontend/src/services/api.ts`
    - Llamar al endpoint al hacer click, con `ConfirmationDialog`
    - _Requisitos: 6.1, 6.2, 6.3, 6.4_
  - [x] 14.2 Agregar columnas colapsables de última modificación en BudgetTable
    - En `frontend/src/components/BudgetTable.tsx`:
    - Agregar estado `showModificationColumns` (default: false)
    - Agregar botón toggle en el header para expandir/colapsar
    - Cuando expandido, mostrar columnas "Última Modif." y "Modificado por"
    - Formatear fecha y mostrar `lastModifiedBy?.fullName`
    - _Requisitos: 7.3, 7.4_

- [x] 15. Frontend: Reemplazo de popups nativos restantes
  - [x] 15.1 Reemplazar confirm() en RealTransactionsPage
    - En `frontend/src/pages/RealTransactionsPage.tsx`:
    - Agregar estado `showDeleteDialog` y `deleteTargetId`
    - Reemplazar `if (!confirm(...)) return;` por apertura de `ConfirmationDialog`
    - Importar y renderizar `ConfirmationDialog`
    - _Requisitos: 10.1, 10.3_
  - [x] 15.2 Reemplazar confirm() en ExpenseDetailPopup
    - En `frontend/src/components/ExpenseDetailPopup.tsx`:
    - Reemplazar `confirm()` en `handleDeleteTag` por `ConfirmationDialog`
    - Agregar estado para controlar el diálogo
    - _Requisitos: 10.1, 10.3_
  - [x] 15.3 Buscar y reemplazar cualquier otro uso de confirm()/alert()
    - Hacer grep en todo el frontend por `confirm(` y `alert(`
    - Reemplazar cada ocurrencia por `ConfirmationDialog` o `showToast`
    - _Requisitos: 10.1, 10.2, 10.3_

- [x] 16. Frontend: Actualizar API service
  - [x] 16.1 Agregar endpoints faltantes en api.ts
    - En `frontend/src/services/api.ts`:
    - Agregar `savingsApi.activate: (id: string) => api.post(\`/savings/${id}/activate\`)`
    - Agregar `budgetApi.submitForReview: (id: string) => api.post(\`/budgets/${id}/submit-review\`)`
    - _Requisitos: 6.2, 11.5_

- [x] 17. Checkpoint final - Verificar integración completa
  - Ensure all tests pass, ask the user if questions arise.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los checkpoints aseguran validación incremental
- Los tests de propiedades validan correctitud universal
- El fix de transacciones (tarea 2) es prioritario por ser un bug existente
- La tarea 16 (api.ts) puede ejecutarse en paralelo con las tareas de backend
