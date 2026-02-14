# Plan de Implementación: Sistema de Gestión de Presupuesto Tecnológico

## Visión General

Este plan implementa un sistema full-stack de gestión de presupuesto tecnológico con estructura jerárquica de gastos, seguimiento de valores planificados/comprometidos/reales, conversión automática de monedas, y visualizaciones tabulares interactivas. La implementación sigue una arquitectura desacoplada con backend Node.js/TypeScript, frontend React/TypeScript, y base de datos PostgreSQL con Prisma ORM.

## Tareas

- [x] 1. Configurar estructura del proyecto y dependencias
  - Crear estructura de directorios (backend/, frontend/, shared/)
  - Inicializar proyecto Node.js con TypeScript para backend
  - Inicializar proyecto React con TypeScript y Tailwind CSS para frontend
  - Configurar Prisma ORM con PostgreSQL
  - Configurar scripts de desarrollo y build
  - _Requisitos: 13.1, 13.2, 15.1, 15.2_

- [ ] 2. Definir esquema de base de datos con Prisma
  - [x] 2.1 Crear schema.prisma con modelos Budget, Expense, Transaction, PlanValue
    - Definir modelo Budget con campos year, version, relaciones
    - Definir modelo Expense con campos base, metadatos, jerarquía
    - Definir modelo Transaction con tipo COMMITTED/REAL
    - Definir modelo PlanValue con valores mensuales
    - Agregar índices y restricciones de unicidad
    - _Requisitos: 1.1, 1.2, 2.1, 3.1, 4.1_

  - [x] 2.2 Crear modelos de conversión de moneda y datos maestros
    - Definir modelo ConversionRate con relación a Budget
    - Definir modelos TechnologyDirection, UserArea, FinancialCompany
    - Definir modelos TagDefinition y TagValue
    - Agregar restricciones de integridad referencial
    - _Requisitos: 5.3, 9.1, 2.5_

  - [ ] 2.3 Ejecutar migración inicial de base de datos
    - Generar migración con Prisma
    - Aplicar migración a base de datos PostgreSQL
    - Verificar creación de tablas e índices
    - _Requisitos: 13.4, 14.1_


- [ ] 3. Implementar servicios backend core
  - [x] 3.1 Implementar BudgetService
    - Crear clase BudgetService con métodos CRUD
    - Implementar createBudget con validación de unicidad year+version
    - Implementar getBudget con carga de expenses relacionados
    - Implementar getBudgetsByYear
    - Implementar inicialización de módulo de conversión al crear presupuesto
    - _Requisitos: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 3.2 Escribir test de propiedad para BudgetService
    - **Propiedad 1: Unicidad de Presupuestos**
    - **Valida: Requisitos 1.1**

  - [ ]* 3.3 Escribir test de propiedad para completitud de gastos
    - **Propiedad 2: Completitud de Gastos en Consulta**
    - **Valida: Requisitos 1.2**

  - [ ]* 3.4 Escribir test de propiedad para independencia de versiones
    - **Propiedad 3: Independencia de Versiones**
    - **Valida: Requisitos 1.3**

  - [x] 3.5 Implementar ExpenseService
    - Crear clase ExpenseService con métodos CRUD
    - Implementar validación de campos requeridos
    - Implementar validación de referencias a datos maestros
    - Implementar soporte para jerarquía padre-hijo
    - Implementar getExpenseMetadata con carga de relaciones
    - _Requisitos: 2.1, 2.2, 2.3, 2.4, 11.1_

  - [ ]* 3.6 Escribir tests de propiedad para ExpenseService
    - **Propiedad 5: Validación de Campos Requeridos de Gasto**
    - **Propiedad 6: Validación de Referencias a Datos Maestros**
    - **Propiedad 7: Validación de Empresa Financiera**
    - **Valida: Requisitos 2.1, 2.2, 2.3, 2.4**

  - [x] 3.7 Implementar PlanValueService
    - Crear clase PlanValueService con métodos CRUD
    - Implementar createPlanValue con validación de 12 meses
    - Implementar getMonthlyPlan para consulta por mes
    - Implementar getTotalPlan con suma de 12 meses
    - Implementar almacenamiento de valores monetarios completos
    - _Requisitos: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 3.8 Escribir tests de propiedad para PlanValueService
    - **Propiedad 10: Estructura de 12 Meses en Valores Plan**
    - **Propiedad 11: Cálculo de Total como Suma Mensual**
    - **Propiedad 12: Estructura Completa de Valores Monetarios**
    - **Valida: Requisitos 3.1, 3.2, 3.3, 3.4**

- [ ] 4. Implementar servicios de transacciones y conversión
  - [x] 4.1 Implementar TransactionService
    - Crear clase TransactionService con métodos CRUD
    - Implementar validación de campos requeridos de transacción
    - Implementar validación de unicidad de referenceDocumentNumber por gasto
    - Implementar getMonthlyCommitted con agregación por mes
    - Implementar getMonthlyReal con agregación por mes
    - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 4.2 Escribir tests de propiedad para TransactionService
    - **Propiedad 13: Validación de Campos Requeridos de Transacción**
    - **Propiedad 14: Unicidad de Número de Documento de Referencia**
    - **Propiedad 15: Agregación Mensual de Transacciones**
    - **Valida: Requisitos 4.1, 4.2, 4.3, 4.4**

  - [x] 4.3 Implementar CurrencyConverterService
    - Crear clase CurrencyConverterService
    - Implementar setConversionRate con validación de unicidad
    - Implementar getConversionRate por budget/currency/month
    - Implementar convertToUSD con aplicación automática de tasa
    - Implementar getConversionHistory
    - _Requisitos: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 4.4 Escribir tests de propiedad para CurrencyConverterService
    - **Propiedad 16: Conversión Automática a USD**
    - **Propiedad 17: Independencia de Tasas por Versión**
    - **Propiedad 18: Completitud de Historial de Conversión**
    - **Valida: Requisitos 5.1, 5.3, 5.4**


- [ ] 5. Implementar servicios de datos maestros y etiquetas
  - [x] 5.1 Implementar MasterDataService
    - Crear clase MasterDataService
    - Implementar CRUD para TechnologyDirection
    - Implementar CRUD para UserArea
    - Implementar CRUD para FinancialCompany
    - Implementar validación de unicidad de códigos
    - Implementar isInUse para prevenir eliminación de datos en uso
    - _Requisitos: 9.1, 9.2, 9.3, 9.4_

  - [ ]* 5.2 Escribir tests de propiedad para MasterDataService
    - **Propiedad 26: Unicidad de Identificadores en Datos Maestros**
    - **Propiedad 27: Actualización de Referencias en Modificación de Datos Maestros**
    - **Propiedad 28: Protección de Eliminación de Datos Maestros en Uso**
    - **Valida: Requisitos 9.2, 9.3, 9.4**

  - [x] 5.3 Implementar TaggingService
    - Crear clase TaggingService
    - Implementar CRUD para TagDefinition
    - Implementar validación de tipos de entrada (FORMAT, FREE_TEXT, SELECT_LIST)
    - Implementar setTagValue con validación de formato
    - Implementar getTagValuesByExpense
    - _Requisitos: 2.5, 11.3, 11.4_

  - [ ]* 5.4 Escribir tests de propiedad para TaggingService
    - **Propiedad 8: Tipos de Etiquetas Configurables**
    - **Propiedad 9: Consistencia de Metadatos por Versión**
    - **Propiedad 36: Validación de Formato en Actualización de Metadatos**
    - **Valida: Requisitos 2.5, 2.6, 11.4**

- [ ] 6. Implementar APIs REST con Express
  - [x] 6.1 Configurar servidor Express con middleware
    - Crear servidor Express con TypeScript
    - Configurar middleware de CORS
    - Configurar middleware de parsing JSON
    - Configurar middleware de manejo de errores global
    - Configurar logging de requests
    - _Requisitos: 13.1_

  - [x] 6.2 Crear endpoints de Budget API
    - POST /api/budgets - crear presupuesto
    - GET /api/budgets/:id - obtener presupuesto
    - GET /api/budgets?year=:year - listar por año
    - PUT /api/budgets/:id - actualizar presupuesto
    - DELETE /api/budgets/:id - eliminar presupuesto
    - _Requisitos: 1.1, 1.2, 1.3_

  - [x] 6.3 Crear endpoints de Expense API
    - POST /api/expenses - crear gasto
    - GET /api/expenses/:id - obtener gasto
    - GET /api/expenses?budgetId=:id - listar por presupuesto
    - GET /api/expenses/:id/metadata - obtener metadatos completos
    - PUT /api/expenses/:id - actualizar gasto
    - DELETE /api/expenses/:id - eliminar gasto
    - _Requisitos: 2.1, 11.1_

  - [x] 6.4 Crear endpoints de Transaction y PlanValue API
    - POST /api/transactions - crear transacción
    - GET /api/transactions?expenseId=:id - listar por gasto
    - GET /api/transactions?expenseId=:id&month=:month - listar por gasto y mes
    - POST /api/plan-values - crear valor plan
    - GET /api/plan-values?expenseId=:id - listar por gasto
    - GET /api/plan-values/:expenseId/monthly/:month - obtener valor mensual
    - _Requisitos: 3.1, 4.1, 10.1, 10.2_

  - [x] 6.5 Crear endpoints de MasterData y Tagging API
    - CRUD endpoints para /api/technology-directions
    - CRUD endpoints para /api/user-areas
    - CRUD endpoints para /api/financial-companies
    - CRUD endpoints para /api/tag-definitions
    - POST /api/expenses/:id/tags - asignar valor de etiqueta
    - GET /api/expenses/:id/tags - obtener etiquetas de gasto
    - _Requisitos: 9.1, 2.5_

  - [x] 6.6 Crear endpoints de Currency Conversion API
    - POST /api/budgets/:id/conversion-rates - configurar tasa
    - GET /api/budgets/:id/conversion-rates - obtener historial
    - GET /api/budgets/:id/conversion-rates/:currency/:month - obtener tasa específica
    - _Requisitos: 5.3, 5.4_

  - [ ]* 6.7 Escribir tests de integración para APIs
    - Test de flujo completo: crear presupuesto → crear gasto → crear transacción
    - Test de validación de errores 400/404/409/422
    - Test de cascade delete
    - _Requisitos: 14.4_


- [ ] 7. Checkpoint - Verificar backend completo
  - Asegurar que todos los tests pasen, preguntar al usuario si surgen dudas.

- [ ] 8. Configurar proyecto frontend React
  - [x] 8.1 Inicializar proyecto React con TypeScript y Tailwind
    - Crear proyecto con Create React App o Vite
    - Configurar TypeScript
    - Configurar Tailwind CSS
    - Configurar estructura de carpetas (components/, services/, hooks/, types/)
    - _Requisitos: 15.1, 15.2_

  - [x] 8.2 Crear cliente API y tipos compartidos
    - Crear servicio de cliente HTTP (axios o fetch)
    - Definir tipos TypeScript para todas las entidades (Budget, Expense, Transaction, etc.)
    - Crear funciones de cliente API para todos los endpoints
    - Configurar manejo de errores centralizado
    - _Requisitos: 13.1_

  - [ ] 8.3 Crear hooks personalizados para gestión de estado
    - Crear useBudget hook para operaciones de presupuesto
    - Crear useExpenses hook para operaciones de gastos
    - Crear useFilters hook para gestión de filtros de tabla
    - Crear useMasterData hook para datos maestros
    - _Requisitos: 6.1, 8.1_

- [ ] 9. Implementar componentes de visualización de tablas
  - [x] 9.1 Crear componente ExpenseTable para vista plan
    - Implementar tabla con columnas: Gasto, Categoría, 12 meses, Total
    - Implementar cálculo de total como suma de 12 meses
    - Implementar renderizado de celdas vacías para meses sin valor
    - Implementar click en fila para abrir popup de detalle
    - Aplicar estilos con Tailwind CSS
    - _Requisitos: 6.1, 6.2, 6.3, 12.1_

  - [ ]* 9.2 Escribir tests de propiedad para ExpenseTable
    - **Propiedad 11: Cálculo de Total como Suma Mensual**
    - **Propiedad 37: Apertura de Popup al Click en Gasto**
    - **Valida: Requisitos 6.2, 12.1**

  - [ ] 9.3 Crear componente ComparisonTable para vista comparativa
    - Implementar tabla con columnas agrupadas por mes (Presupuesto/Comprometido/Real)
    - Implementar checkboxes de encabezado para mostrar/ocultar columnas
    - Implementar renderizado de descripción corta y categoría
    - Aplicar estilos responsivos con Tailwind CSS
    - _Requisitos: 7.1, 7.2, 7.3_

  - [ ]* 9.4 Escribir tests de propiedad para ComparisonTable
    - **Propiedad 20: Contenido de Filas en Tabla Comparativa**
    - **Propiedad 21: Visibilidad de Columnas por Checkbox**
    - **Valida: Requisitos 7.2, 7.3**

- [ ] 10. Implementar sistema de filtros
  - [ ] 10.1 Crear componente FilterPanel
    - Implementar dropdown de selección de moneda
    - Implementar dropdown de selección de empresa financiera
    - Implementar botón de limpiar filtros
    - Implementar aplicación de filtros con operación AND
    - _Requisitos: 8.1, 8.2, 8.3_

  - [ ]* 10.2 Escribir tests de propiedad para filtros
    - **Propiedad 22: Filtrado por Moneda**
    - **Propiedad 23: Filtrado por Empresa Financiera**
    - **Propiedad 24: Operación AND en Filtros Múltiples**
    - **Propiedad 25: Restauración de Vista al Limpiar Filtros**
    - **Valida: Requisitos 8.1, 8.2, 8.3, 8.4**

  - [ ] 10.3 Implementar filtros de columna en tablas
    - Agregar inputs de filtro en encabezados de columna
    - Implementar lógica de filtrado por columna
    - Integrar con FilterPanel para filtrado combinado
    - _Requisitos: 6.4, 7.4_

  - [ ]* 10.4 Escribir tests de propiedad para filtros de columna
    - **Propiedad 19: Filtrado de Columnas en Tablas**
    - **Valida: Requisitos 6.4, 7.4**


- [ ] 11. Implementar componentes de detalle y metadatos
  - [ ] 11.1 Crear componente ExpenseDetailPopup
    - Implementar modal con overlay
    - Mostrar todos los campos base del gasto
    - Mostrar todos los campos configurables de etiquetas
    - Implementar botón de cierre
    - Preservar estado de filtros al cerrar
    - _Requisitos: 12.1, 12.2, 12.3, 12.4_

  - [ ]* 11.2 Escribir tests de propiedad para ExpenseDetailPopup
    - **Propiedad 33: Completitud de Visualización de Metadatos**
    - **Propiedad 38: Preservación de Estado de Filtros al Cerrar Popup**
    - **Valida: Requisitos 12.2, 12.3, 12.4**

  - [ ] 11.3 Crear componente ExpenseMetadataViewer
    - Implementar visualización de campos multi-selección
    - Implementar renderizado de etiquetas según formato configurado
    - Implementar formulario de edición de metadatos
    - Implementar validación de formato en actualización
    - _Requisitos: 11.1, 11.2, 11.3, 11.4_

  - [ ]* 11.4 Escribir tests de propiedad para ExpenseMetadataViewer
    - **Propiedad 34: Visualización de Campos Multi-Selección**
    - **Propiedad 35: Formato de Etiquetas según Configuración**
    - **Valida: Requisitos 11.2, 11.3**

- [ ] 12. Implementar visualizadores de transacciones
  - [ ] 12.1 Crear componente TransactionViewer
    - Implementar tabla de valores plan con columnas: Gasto, Mes, Moneda, Valor
    - Implementar tabla de transacciones con columnas: Fecha Servicio, Fecha Contabilización, Documento, Enlace
    - Implementar filtrado por gasto seleccionado
    - Implementar ordenamiento por columna
    - _Requisitos: 10.1, 10.2, 10.3, 10.4_

  - [ ]* 12.2 Escribir tests de propiedad para TransactionViewer
    - **Propiedad 29: Completitud de Tabla de Valores Plan**
    - **Propiedad 30: Completitud de Tabla de Transacciones**
    - **Propiedad 31: Filtrado de Transacciones por Gasto**
    - **Propiedad 32: Ordenamiento de Transacciones**
    - **Valida: Requisitos 10.1, 10.2, 10.3, 10.4**

- [ ] 13. Implementar sección de configuración de datos maestros
  - [ ] 13.1 Crear componente MasterDataConfig
    - Implementar tabla CRUD para direcciones tecnológicas
    - Implementar tabla CRUD para áreas de usuario
    - Implementar tabla CRUD para empresas financieras
    - Implementar validación de unicidad de códigos
    - Implementar prevención de eliminación de datos en uso
    - Mostrar mensajes de error de integridad referencial
    - _Requisitos: 9.1, 9.2, 9.3, 9.4_

  - [ ]* 13.2 Escribir tests unitarios para MasterDataConfig
    - Test de creación exitosa de elemento
    - Test de rechazo por código duplicado
    - Test de prevención de eliminación de elemento en uso
    - _Requisitos: 9.2, 9.4_

  - [ ] 13.3 Crear componente TagDefinitionConfig
    - Implementar formulario de creación de definición de etiqueta
    - Implementar selección de tipo de entrada (FORMAT, FREE_TEXT, SELECT_LIST)
    - Implementar campos condicionales según tipo
    - Implementar lista de definiciones existentes
    - _Requisitos: 2.5_

- [ ] 14. Implementar sección de configuración de tasas de cambio
  - [ ] 14.1 Crear componente ExchangeRateConfig
    - Implementar tabla de tasas por moneda y mes
    - Implementar formulario de ingreso de nueva tasa
    - Implementar validación de unicidad (budget, currency, month)
    - Mostrar historial de tasas configuradas
    - _Requisitos: 5.3, 5.4_

  - [ ]* 14.2 Escribir tests unitarios para ExchangeRateConfig
    - Test de configuración exitosa de tasa
    - Test de rechazo por tasa duplicada
    - Test de visualización de historial completo
    - _Requisitos: 5.3, 5.4_


- [ ] 15. Implementar navegación y layout principal
  - [x] 15.1 Crear componente Layout principal
    - Implementar barra de navegación con secciones
    - Implementar sidebar con menú de navegación
    - Implementar área de contenido principal
    - Aplicar diseño responsivo con Tailwind CSS
    - _Requisitos: 15.3, 15.4_

  - [ ] 15.2 Configurar enrutamiento con React Router
    - Configurar rutas para Dashboard (tabla de gastos)
    - Configurar rutas para Configuración de Datos Maestros
    - Configurar rutas para Visualización de Transacciones
    - Configurar rutas para Configuración de Metadatos
    - Configurar rutas para Configuración de Tasas de Cambio
    - _Requisitos: 17.2, 17.4, 17.5, 17.6_

  - [x] 15.3 Crear componente Dashboard
    - Integrar ExpenseTable o ComparisonTable según modo seleccionado
    - Integrar FilterPanel
    - Implementar selector de modo de vista (Plan/Comparación)
    - Implementar selector de presupuesto (año/versión)
    - _Requisitos: 6.1, 7.1, 8.1, 17.2_

- [ ] 16. Implementar manejo de errores en frontend
  - [ ] 16.1 Crear componente ErrorBoundary
    - Implementar captura de errores de React
    - Mostrar mensaje de error amigable
    - Implementar logging de errores
    - _Requisitos: 15.3_

  - [ ] 16.2 Crear sistema de notificaciones
    - Implementar componente Toast para mensajes de éxito/error
    - Integrar con respuestas de API
    - Mostrar mensajes específicos según tipo de error (400/404/409/422/500)
    - _Requisitos: 15.3_

  - [ ] 16.3 Implementar validación de formularios
    - Crear hook useFormValidation
    - Implementar validación en tiempo real
    - Mostrar mensajes de error por campo
    - _Requisitos: 2.1, 4.1, 9.2_

- [ ] 17. Crear datos de prueba (seed)
  - [x] 17.1 Crear script de seed para base de datos
    - Crear presupuestos de ejemplo (2023, 2024 con múltiples versiones)
    - Crear datos maestros (direcciones tecnológicas, áreas, empresas)
    - Crear gastos con jerarquía y metadatos
    - Crear valores plan para todos los meses
    - Crear transacciones comprometidas y reales
    - Crear tasas de conversión para múltiples monedas
    - _Requisitos: 17.1, 17.2_

  - [ ] 17.2 Ejecutar seed y verificar datos
    - Ejecutar script de seed
    - Verificar datos en base de datos
    - Verificar visualización en frontend
    - _Requisitos: 17.1_

- [ ] 18. Checkpoint - Verificar funcionalidad completa
  - Asegurar que todos los tests pasen, preguntar al usuario si surgen dudas.

- [ ] 19. Configurar despliegue en AWS EC2
  - [ ] 19.1 Preparar aplicación para producción
    - Configurar variables de entorno
    - Crear build de producción de frontend
    - Configurar servidor Express para servir frontend estático
    - Configurar logging de producción
    - _Requisitos: 16.1, 16.2_

  - [ ] 19.2 Configurar instancia EC2
    - Crear instancia EC2 con Ubuntu
    - Instalar Node.js y PostgreSQL
    - Configurar security groups (puertos 80, 443, 5432)
    - Configurar dominio y certificado SSL (opcional)
    - _Requisitos: 16.1, 16.3_

  - [ ] 19.3 Desplegar aplicación
    - Clonar repositorio en EC2
    - Instalar dependencias
    - Ejecutar migraciones de Prisma
    - Ejecutar seed de datos
    - Iniciar aplicación con PM2
    - Configurar reinicio automático
    - _Requisitos: 16.1, 16.4_

  - [ ]* 19.4 Configurar monitoreo
    - Configurar logs de aplicación
    - Configurar métricas de salud
    - Configurar alertas para errores críticos
    - _Requisitos: 16.4_

- [ ] 20. Checkpoint final - Verificar despliegue
  - Asegurar que la aplicación funciona correctamente en producción, preguntar al usuario si surgen dudas.


## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los checkpoints aseguran validación incremental
- Los tests de propiedad validan propiedades de corrección universales
- Los tests unitarios validan ejemplos específicos y casos edge
- La configuración de fast-check debe usar mínimo 100 iteraciones por test de propiedad
- Cada test de propiedad debe incluir tag: `Feature: tech-budget-management, Property {número}: {texto}`
- El sistema asume datos pre-cargados para el MVP (sin interfaces de carga de transacciones)
- Todas las interfaces y mensajes deben estar en español

## Dependencias Clave

**Backend:**
- Node.js 18+
- TypeScript 5+
- Express 4+
- Prisma 5+
- PostgreSQL 14+
- fast-check (para property-based testing)

**Frontend:**
- React 18+
- TypeScript 5+
- Tailwind CSS 3+
- React Router 6+
- Axios o Fetch API

**Infraestructura:**
- AWS EC2 (Ubuntu)
- PM2 (process manager)
- Nginx (opcional, para reverse proxy)

