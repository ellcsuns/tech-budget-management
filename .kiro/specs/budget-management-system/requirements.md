# Requirements Document

## Introduction

Este documento especifica las mejoras al sistema de gestión de presupuesto existente. El sistema permite gestionar presupuestos anuales con múltiples versiones, gastos asociados, transacciones comprometidas y reales, y valores planeados. Las mejoras se enfocan en tres áreas principales: navegación y filtros mejorados, edición dinámica de valores planeados con versionamiento automático, y gestión completa de transacciones.

## Glossary

- **System**: El sistema de gestión de presupuesto completo (frontend + backend)
- **UI**: La interfaz de usuario del frontend React
- **Budget**: Un presupuesto anual con una versión específica
- **Expense**: Un gasto asociado a un presupuesto
- **PlanValue**: Valor planeado mensual para un gasto
- **Transaction**: Transacción comprometida (COMMITTED) o real (REAL) asociada a un gasto
- **Filter**: Filtro aplicable a la visualización de datos
- **Budget_Version**: Una versión específica de un presupuesto anual
- **Sidebar**: Menú de navegación lateral izquierdo
- **Toggle_Button**: Botón que alterna entre estados on/off
- **Inline_Editor**: Editor que permite modificar valores directamente en la tabla

## Requirements

### Requirement 1: Navegación con Menú Lateral

**User Story:** Como usuario, quiero acceder a las diferentes secciones del sistema desde un menú lateral izquierdo, para tener una navegación más organizada y accesible.

#### Acceptance Criteria

1. THE UI SHALL display a sidebar on the left side of the screen with navigation options
2. WHEN a user clicks a navigation option in the sidebar, THE System SHALL navigate to the corresponding section
3. THE Sidebar SHALL remain visible across all sections of the application
4. THE Sidebar SHALL highlight the currently active section
5. THE Sidebar SHALL include options for: Dashboard, Budget Planning, Committed Transactions, Real Transactions, Master Data, and Reports

### Requirement 2: Filtros de Moneda como Toggle Buttons

**User Story:** Como usuario, quiero filtrar por monedas usando botones toggle, para poder activar/desactivar múltiples monedas simultáneamente de forma visual e intuitiva.

#### Acceptance Criteria

1. THE UI SHALL display currency filters as toggle buttons instead of dropdown menus
2. WHEN a user clicks a currency toggle button, THE System SHALL toggle that currency filter on or off
3. WHEN multiple currency filters are active, THE System SHALL display data for all active currencies
4. WHEN no currency filters are active, THE System SHALL display data for all currencies
5. THE UI SHALL provide visual feedback indicating which currency filters are active

### Requirement 3: Filtros de Empresa Financiera como Toggle Buttons

**User Story:** Como usuario, quiero filtrar por empresas financieras usando botones toggle, para poder activar/desactivar múltiples empresas simultáneamente de forma visual e intuitiva.

#### Acceptance Criteria

1. THE UI SHALL display financial company filters as toggle buttons instead of dropdown menus
2. WHEN a user clicks a financial company toggle button, THE System SHALL toggle that company filter on or off
3. WHEN multiple financial company filters are active, THE System SHALL display data for all active companies
4. WHEN no financial company filters are active, THE System SHALL display data for all financial companies
5. THE UI SHALL provide visual feedback indicating which financial company filters are active

### Requirement 4: Aplicación Dinámica de Filtros Combinados

**User Story:** Como usuario, quiero que los filtros se apliquen dinámicamente en combinación, para ver resultados filtrados en tiempo real sin necesidad de botones de "aplicar".

#### Acceptance Criteria

1. WHEN a user toggles any filter, THE System SHALL immediately update the displayed data
2. WHEN multiple filters are active, THE System SHALL apply all filters in combination using AND logic
3. THE System SHALL update the data display within 500ms of filter changes
4. WHEN filters result in no matching data, THE UI SHALL display a message indicating no results found
5. THE System SHALL preserve filter state when navigating between sections

### Requirement 5: Edición Inline de Valores Planeados

**User Story:** Como usuario, quiero editar valores planeados directamente en la tabla por mes, para modificar presupuestos de forma rápida e intuitiva.

#### Acceptance Criteria

1. WHEN a user clicks on a plan value cell, THE UI SHALL display an inline editor for that value
2. THE Inline_Editor SHALL allow numeric input with decimal precision
3. WHEN a user enters a value outside the cell, THE UI SHALL validate the input
4. WHEN invalid input is provided, THE System SHALL display an error message and prevent saving
5. THE UI SHALL highlight cells that have been modified but not yet saved
6. WHEN a user presses Enter or clicks outside the editor, THE UI SHALL save the changes locally

### Requirement 6: Creación Automática de Nueva Versión de Presupuesto

**User Story:** Como usuario, quiero que al confirmar cambios en valores planeados se cree automáticamente una nueva versión del presupuesto, para mantener un historial de cambios sin sobrescribir versiones anteriores.

#### Acceptance Criteria

1. WHEN a user confirms plan value changes, THE System SHALL create a new budget version
2. THE System SHALL generate the new version name by incrementing the previous version
3. THE System SHALL copy all expenses from the previous version to the new version
4. THE System SHALL copy all plan values from the previous version to the new version
5. THE System SHALL apply the modified plan values to the new version
6. THE System SHALL preserve the original version unchanged
7. WHEN version creation fails, THE System SHALL rollback all changes and display an error message

### Requirement 7: Agregar Nuevos Gastos a Versión de Presupuesto

**User Story:** Como usuario, quiero agregar gastos existentes a una versión de presupuesto, para incluir gastos que no estaban en la versión anterior.

#### Acceptance Criteria

1. THE UI SHALL provide a button to add new expenses to the current budget version
2. WHEN a user clicks the add expense button, THE UI SHALL display a list of available expenses not currently in the version
3. WHEN a user selects an expense from the list, THE System SHALL add that expense to the current budget version
4. THE System SHALL initialize plan values for the new expense with zero values for all months
5. WHEN adding an expense fails, THE System SHALL display an error message and maintain the current state

### Requirement 8: Eliminar Gastos de Versión de Presupuesto

**User Story:** Como usuario, quiero eliminar gastos de una versión de presupuesto, para excluir gastos que ya no son relevantes en la nueva versión.

#### Acceptance Criteria

1. THE UI SHALL provide a delete button for each expense in the budget version
2. WHEN a user clicks the delete button, THE UI SHALL display a confirmation dialog
3. WHEN a user confirms deletion, THE System SHALL remove the expense from the current budget version
4. THE System SHALL remove all associated plan values for the deleted expense
5. THE System SHALL preserve the expense in the database for other budget versions
6. WHEN deletion fails, THE System SHALL display an error message and maintain the current state

### Requirement 9: Modificar Valores de Gastos Existentes

**User Story:** Como usuario, quiero modificar los valores planeados de gastos existentes mes por mes, para ajustar el presupuesto según necesidades cambiantes.

#### Acceptance Criteria

1. WHEN a user modifies a plan value for an existing expense, THE System SHALL update that specific month's value
2. THE System SHALL recalculate USD values based on the conversion rate for that month
3. THE System SHALL validate that the transaction value is a positive number
4. WHEN multiple months are modified, THE System SHALL track all changes independently
5. THE UI SHALL display the total planned value across all months for each expense

### Requirement 10: Gestión de Transacciones Comprometidas

**User Story:** Como usuario, quiero gestionar transacciones comprometidas (COMMITTED), para registrar y modificar compromisos financieros asociados a gastos.

#### Acceptance Criteria

1. THE UI SHALL provide a dedicated section for managing committed transactions
2. THE UI SHALL display all committed transactions in a table with columns: expense, service date, posting date, reference number, currency, value, month
3. THE UI SHALL provide a button to add new committed transactions
4. WHEN a user adds a committed transaction, THE System SHALL validate that the expense exists in the current budget
5. THE System SHALL calculate USD value based on the conversion rate for the transaction month
6. THE UI SHALL allow editing existing committed transactions inline
7. THE UI SHALL provide a delete button for each committed transaction
8. WHEN a user deletes a committed transaction, THE System SHALL remove it from the database after confirmation

### Requirement 11: Gestión de Transacciones Reales

**User Story:** Como usuario, quiero gestionar transacciones reales (REAL), para registrar y modificar gastos reales asociados a gastos presupuestados.

#### Acceptance Criteria

1. THE UI SHALL provide a dedicated section for managing real transactions
2. THE UI SHALL display all real transactions in a table with columns: expense, service date, posting date, reference number, currency, value, month
3. THE UI SHALL provide a button to add new real transactions
4. WHEN a user adds a real transaction, THE System SHALL validate that the expense exists in the current budget
5. THE System SHALL calculate USD value based on the conversion rate for the transaction month
6. THE UI SHALL allow editing existing real transactions inline
7. THE UI SHALL provide a delete button for each real transaction
8. WHEN a user deletes a real transaction, THE System SHALL remove it from the database after confirmation

### Requirement 12: Validación de Asociación Gasto-Transacción

**User Story:** Como usuario del sistema, quiero que todas las transacciones estén asociadas a gastos válidos, para mantener la integridad referencial de los datos.

#### Acceptance Criteria

1. WHEN a user creates a transaction, THE System SHALL validate that the expense ID exists in the database
2. WHEN a user creates a transaction, THE System SHALL validate that the expense belongs to the current budget version
3. IF the expense does not exist, THEN THE System SHALL reject the transaction and display an error message
4. IF the expense does not belong to the current budget, THEN THE System SHALL reject the transaction and display an error message
5. THE System SHALL enforce referential integrity at the database level through foreign key constraints

### Requirement 13: Validación de Datos de Transacciones

**User Story:** Como usuario del sistema, quiero que los datos de transacciones sean validados, para prevenir errores de entrada y mantener la calidad de los datos.

#### Acceptance Criteria

1. WHEN a user enters a transaction value, THE System SHALL validate that it is a positive number
2. WHEN a user enters a service date, THE System SHALL validate that it is a valid date
3. WHEN a user enters a posting date, THE System SHALL validate that it is a valid date
4. WHEN a user enters a reference document number, THE System SHALL validate that it is unique for that expense
5. WHEN a user enters a month, THE System SHALL validate that it is between 1 and 12
6. WHEN validation fails, THE System SHALL display specific error messages indicating which fields are invalid

### Requirement 14: Cálculo Automático de Valores en USD

**User Story:** Como usuario, quiero que los valores en USD se calculen automáticamente, para evitar errores manuales y mantener consistencia en las conversiones.

#### Acceptance Criteria

1. WHEN a user enters a transaction value in any currency, THE System SHALL automatically calculate the USD value
2. THE System SHALL use the conversion rate defined for that currency and month in the budget
3. WHEN no conversion rate exists for a currency-month combination, THE System SHALL display an error message
4. THE System SHALL store both the original currency value and the USD value
5. THE System SHALL recalculate USD values when conversion rates are updated

### Requirement 15: Persistencia de Estado de Filtros

**User Story:** Como usuario, quiero que los filtros que aplico se mantengan al navegar entre secciones, para no tener que reconfigurarlos constantemente.

#### Acceptance Criteria

1. WHEN a user applies filters in one section, THE System SHALL preserve those filters when navigating to other sections
2. THE System SHALL store filter state in browser session storage
3. WHEN a user closes and reopens the browser, THE System SHALL restore the last used filters
4. THE UI SHALL provide a "Clear All Filters" button to reset all filters to default state
5. WHEN filters are cleared, THE System SHALL remove the stored filter state
