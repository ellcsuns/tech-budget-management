# Plan de Implementación: UI Translations and Popups

## Visión General

Implementación incremental: primero se registran las claves de traducción faltantes, luego se reemplazan los textos hardcoded componente por componente, después se actualizan los popups de creación, y finalmente se mejora la TranslationsPage.

## Tasks

- [x] 1. Registrar claves de traducción faltantes en el backend
  - [x] 1.1 Crear seed/migration con todas las claves de traducción nuevas organizadas por categoría (table, budget, expense, saving, deferral, common, translations) con valores en español e inglés
    - Insertar en la tabla translations todas las claves listadas en el diseño
    - Asignar cada clave a su categoría correspondiente
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.6, 2.4_

- [x] 2. Reemplazar textos hardcoded en componentes compartidos
  - [x] 2.1 Actualizar `BudgetTable.tsx` para usar `useI18n()` y reemplazar todas las cabeceras, placeholders y tooltips hardcoded por llamadas a `t()`
    - Cabeceras: Código, Descripción, Empresa, Moneda, Área, Categoría, Total, Acc., Última Modif., Modificado por
    - Placeholders: "Filtrar...", "Todas"
    - Mensaje vacío, tooltips de eliminar y columnas de modificación
    - _Requirements: 1.2, 1.3_
  - [x] 2.2 Actualizar `ExpenseTable.tsx` para usar `useI18n()` y reemplazar cabeceras hardcoded por llamadas a `t()`
    - Cabeceras: Código, Descripción, Moneda, Empresa, Ppto, Comp, Real, Dif, Total
    - _Requirements: 1.2, 1.4_
  - [x] 2.3 Actualizar `ConfirmationDialog.tsx` para usar `useI18n()` y reemplazar "Confirmar Acción", "Cancelar", "Continuar"
    - _Requirements: 1.2_

- [x] 3. Reemplazar textos hardcoded en páginas principales
  - [x] 3.1 Actualizar `BudgetsPage.tsx` — reemplazar todos los textos hardcoded restantes en popups, mensajes toast, labels de formularios y textos de estado
    - Popup agregar línea: "Gasto *", "Empresa Financiera *", "Seleccionar gasto...", etc.
    - Popup edición: "Código:", "Descripción:", "Mes", "Actual", "Propuesto", etc.
    - Popup crear presupuesto: "Copiar desde presupuesto", "Sin copia - presupuesto vacío"
    - Popup detalle solicitud: "Detalle de Solicitud de Cambio", "Gasto:", "Empresa:", etc.
    - Mensajes toast y textos de estado
    - _Requirements: 1.2, 1.5_
  - [x] 3.2 Actualizar `DeferralsPage.tsx` — reemplazar mensajes de confirmación y validación hardcoded
    - "¿Estás seguro de eliminar este diferido?", "El mes de inicio debe ser menor al mes de fin", "✓ Línea seleccionada:"
    - _Requirements: 1.2, 1.6_
  - [x] 3.3 Actualizar `SavingsPage.tsx` — reemplazar mensajes toast hardcoded y títulos de botones
    - "Ahorro creado exitosamente", "Ahorro eliminado", "Ahorro activado exitosamente", "Activar", "Eliminar"
    - _Requirements: 1.2_
  - [x] 3.4 Actualizar `TranslationsPage.tsx` — reemplazar textos hardcoded de la propia página por llamadas a `t()`
    - "traducciones", "secciones", "Nueva Traducción", cabeceras de tabla, botones, placeholder de búsqueda
    - Actualizar opciones de categoría en formulario de nueva traducción para incluir todas las secciones funcionales
    - _Requirements: 1.2, 2.2, 2.3_

- [x] 4. Checkpoint - Verificar traducciones
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implementar popup con campos M1-M12 para creación de línea de presupuesto
  - [x] 5.1 Modificar el popup de "Agregar Línea" en `BudgetsPage.tsx` para incluir campos numéricos M1-M12 y total calculado en tiempo real
    - Agregar estado `monthlyValues: number[]` (12 elementos)
    - Agregar grid de inputs numéricos para M1-M12 debajo de los selectores existentes
    - Mostrar total calculado como suma de los 12 valores
    - Deshabilitar botón si no hay gasto o empresa seleccionados
    - Al confirmar, enviar valores mensuales junto con la creación de línea
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  - [ ]* 5.2 Write property test para cálculo de total mensual
    - **Property 4: Monthly total calculation**
    - **Validates: Requirements 3.3**
  - [ ]* 5.3 Write property test para validación del botón de creación
    - **Property 5: Button validation logic**
    - **Validates: Requirements 3.5**

- [x] 6. Implementar popup modal para creación de ahorros
  - [x] 6.1 Convertir el formulario inline de `SavingsPage.tsx` a popup modal
    - Reemplazar el bloque `{showForm && (...)}` por un overlay modal con la misma estructura
    - Mantener toda la lógica de formulario existente (selector de línea, descripción, M1-M12, total)
    - Usar el patrón de modal existente en la app (fixed inset-0, bg-black bg-opacity-50)
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 7. Implementar popup modal para creación de diferidos
  - [x] 7.1 Convertir el formulario inline de `DeferralsPage.tsx` a popup modal
    - Reemplazar el bloque `{showForm && (...)}` por un overlay modal
    - Mantener toda la lógica existente (buscador de línea, descripción, monto, mes inicio/fin)
    - Usar el patrón de modal consistente con el resto de la app
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 8. Mejorar agrupación en TranslationsPage
  - [x] 8.1 Verificar que TranslationsPage muestra todas las secciones funcionales requeridas y que el formulario de nueva traducción permite seleccionar todas las categorías
    - Asegurar que las categorías incluyen: budgets, compare_budgets, savings, deferrals, dashboard, expenses, menu, common, transactions, table, translations
    - _Requirements: 2.1, 2.2, 2.3_
  - [ ]* 8.2 Write property test para correctitud del agrupamiento de traducciones
    - **Property 2: Translation grouping correctness**
    - **Validates: Requirements 2.1**
  - [ ]* 8.3 Write property test para consistencia clave-categoría
    - **Property 3: Key-category consistency**
    - **Validates: Requirements 2.4**

- [x] 9. Checkpoint final
  - Ensure all tests pass, ask the user if questions arise.

## Notas

- Tasks marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada task referencia requisitos específicos para trazabilidad
- Los checkpoints aseguran validación incremental
- Property tests validan propiedades universales de correctitud
- Unit tests validan ejemplos específicos y edge cases
