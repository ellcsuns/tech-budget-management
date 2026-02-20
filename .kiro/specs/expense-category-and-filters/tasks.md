# Plan de Implementación: Categoría de Gastos y Filtros

## Visión General

Implementación incremental de los nuevos campos (categoría, área responsable), filtros en el Dashboard, popup de detalle de solicitudes de cambio, y corrección del permiso de aprobación para administradores.

## Tareas

- [ ] 1. Actualizar esquema de Prisma y migrar base de datos
  - Agregar campo `category` (String, opcional) al modelo `Expense`
  - Agregar campo `responsibleAreaId` (String, opcional) al modelo `Expense`
  - Agregar relación `responsibleArea` hacia `UserArea` en el modelo `Expense`
  - Agregar relación inversa `expenses` en el modelo `UserArea`
  - Agregar `@@index([responsibleAreaId])` al modelo `Expense`
  - Ejecutar `npx prisma migrate dev` para generar la migración
  - _Requisitos: 1.1, 2.1_

- [ ] 2. Actualizar backend: servicios y rutas de gastos
  - [ ] 2.1 Actualizar ExpenseService para aceptar `category` y `responsibleAreaId` en create/update
    - Incluir `responsibleArea` en los includes de las queries de gastos
    - Agregar filtros por `category` y `responsibleAreaId` en `getAllExpenses`
    - _Requisitos: 1.2, 1.3, 1.4, 1.5, 2.2, 2.3, 2.4, 2.5_
  - [ ] 2.2 Actualizar BudgetService para incluir `responsibleArea` en los includes de `budgetLine.expense`
    - Actualizar queries en `getBudget`, `getActiveBudget`, y métodos que retornan budget lines
    - _Requisitos: 2.4, 3.1_
  - [ ]* 2.3 Escribir test de propiedad para round-trip de categoría y área responsable
    - **Propiedad 1: Round-trip de categoría en gastos**
    - **Propiedad 2: Round-trip de área responsable en gastos**
    - **Valida: Requisitos 1.1-1.4, 2.1-2.3**
  - [ ]* 2.4 Escribir test de propiedad para respuesta de API con área responsable
    - **Propiedad 3: Respuesta de API incluye datos del área responsable**
    - **Valida: Requisito 2.4**

- [ ] 3. Corregir permiso de aprobación para administradores
  - Agregar `APPROVE_BUDGET` al rol Administrador en el seed (`seed.ts`) para el menú `approvals`
  - _Requisitos: 8.1, 8.2, 8.3_

- [ ] 4. Checkpoint - Verificar cambios de backend
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Actualizar tipos del frontend y filtros del Dashboard
  - [ ] 5.1 Actualizar interfaz `Expense` en `frontend/src/types/index.ts`
    - Agregar `category?: string`, `responsibleAreaId?: string`, `responsibleArea?: UserArea`
    - _Requisitos: 1.4, 2.4_
  - [ ] 5.2 Actualizar estado de filtros en `Dashboard.tsx`
    - Agregar `categories` y `responsibleAreaIds` al estado de filtros
    - Pasar nuevos filtros al FilterPanel y ExpenseTable
    - _Requisitos: 4.1, 5.1_
  - [ ] 5.3 Actualizar `FilterPanel.tsx` con nuevos filtros y código de empresa
    - Cambiar botones de empresa financiera de `company.name` a `company.code`
    - Agregar sección de filtro por categoría (extraer categorías únicas de budgetLines)
    - Agregar sección de filtro por área responsable (extraer áreas únicas de budgetLines)
    - Agregar funciones `toggleCategory` y `toggleResponsibleArea`
    - Actualizar `clearFilters` para limpiar los nuevos filtros
    - Ocultar secciones de filtro cuando no hay valores disponibles
    - _Requisitos: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2_
  - [ ] 5.4 Actualizar `ExpenseTable.tsx` para mostrar columna de área responsable
    - Agregar columna "Área Resp." en vista COMPARISON después de la columna "Empresa"
    - Mostrar `expense.responsibleArea?.name` o "-" si no tiene
    - Agregar filtrado por `categories` y `responsibleAreaIds` en `filteredLines`
    - _Requisitos: 3.1, 3.2, 4.2, 5.2_
  - [ ]* 5.5 Escribir test de propiedad para correctitud de filtros
    - **Propiedad 4: Correctitud de filtros por categoría y área responsable**
    - **Propiedad 5: Limpiar filtros restaura todas las líneas**
    - **Valida: Requisitos 4.2, 4.3, 5.2, 5.3**

- [ ] 6. Crear popup de detalle de solicitudes de cambio
  - [ ] 6.1 Crear componente `ChangeRequestDetailPopup.tsx`
    - Popup modal estilizado con overlay oscuro
    - Cabecera con info del gasto: código, descripción, empresa, moneda, estado con badge de color
    - Tabla comparativa mes a mes: columnas Mes, Actual, Propuesto, Diferencia
    - Resaltado visual (bg-yellow-50) en filas donde propuesto ≠ actual
    - Fila de totales con sumas
    - Colores de diferencia: rojo para incremento, verde para decremento
    - Botón de cerrar
    - _Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_
  - [ ] 6.2 Integrar popup en `BudgetsPage.tsx`
    - Agregar estado `selectedMyRequest` para la solicitud seleccionada
    - Hacer filas de "Mis Solicitudes" clickeables para abrir el popup
    - Renderizar `ChangeRequestDetailPopup` cuando hay solicitud seleccionada
    - _Requisitos: 7.1_
  - [ ]* 6.3 Escribir test de propiedad para cálculos de comparación
    - **Propiedad 6: Correctitud de comparación en solicitudes de cambio**
    - **Valida: Requisitos 7.3, 7.5**

- [ ] 7. Actualizar seed con datos de ejemplo
  - Agregar categorías de ejemplo a los gastos existentes en el seed
  - Agregar `responsibleAreaId` de ejemplo a los gastos existentes en el seed
  - _Requisitos: 1.1, 2.1_

- [ ] 8. Checkpoint final - Verificar integración completa
  - Ensure all tests pass, ask the user if questions arise.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los checkpoints aseguran validación incremental
- Los tests de propiedades validan correctitud universal
- Los tests unitarios validan ejemplos específicos y casos borde
