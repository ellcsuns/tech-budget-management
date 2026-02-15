# Plan de Implementación: Mejoras de Plataforma

## Visión General

Implementación incremental de 5 funcionalidades: i18n, UI/UX con temas y logo, presupuesto vigente por defecto, comparación de presupuestos, y reportes detallados con Excel. Se usa TypeScript tanto en backend (Node/Express/Prisma) como en frontend (React/Vite/Tailwind).

## Tareas

- [ ] 1. Modelos de datos y configuración base
  - [x] 1.1 Crear modelos Prisma Translation y SystemConfig
    - Agregar modelos `Translation` (id, key, es, en, category, timestamps) y `SystemConfig` (id, key, value, timestamps) al schema.prisma
    - Ejecutar `npx prisma migrate dev` para crear las tablas
    - _Requisitos: 2.1, 1.1_
  - [x] 1.2 Crear seed de traducciones iniciales
    - Crear archivo `backend/src/seedTranslations.ts` con todas las traducciones existentes del sistema (menús, etiquetas, botones, mensajes, meses, filtros)
    - Incluir seed de SystemConfig con locale="es" por defecto
    - Integrar en el seed principal existente
    - _Requisitos: 2.5, 1.3_
  - [x] 1.3 Crear TranslationService en backend
    - Implementar `backend/src/services/TranslationService.ts` con métodos: getAll, getByLocale, create, update, delete, search
    - Validar clave única y no vacía en create
    - _Requisitos: 2.1, 2.2, 2.3, 3.2, 3.3_
  - [ ]* 1.4 Escribir property test para TranslationService
    - **Propiedad 1: Round-trip de traducciones**
    - **Propiedad 2: Validación de clave de traducción**
    - **Propiedad 3: Consulta de traducción por locale**
    - **Valida: Requisitos 2.1, 1.4, 3.3, 2.2, 3.4, 2.3**
  - [x] 1.5 Crear ConfigService en backend
    - Implementar `backend/src/services/ConfigService.ts` con métodos: get, set, getLocale, setLocale
    - Validar que locale solo acepte "es" o "en"
    - _Requisitos: 1.1, 1.4_
  - [ ]* 1.6 Escribir property test para ConfigService
    - **Propiedad 18: Configuración de locale solo acepta valores válidos**
    - **Valida: Requisitos 1.1**

- [ ] 2. API REST de traducciones y configuración
  - [x] 2.1 Crear rutas de traducciones
    - Crear `backend/src/routes/translationRoutes.ts` con endpoints: GET /api/translations, POST /api/translations, PUT /api/translations/:id, DELETE /api/translations/:id, GET /api/translations/locale/:locale
    - Incluir paginación y búsqueda en GET /api/translations
    - _Requisitos: 2.1, 2.2, 2.3, 3.2_
  - [x] 2.2 Crear rutas de configuración
    - Crear `backend/src/routes/configRoutes.ts` con endpoints: GET /api/config/:key, PUT /api/config/:key
    - _Requisitos: 1.1, 1.4_
  - [x] 2.3 Registrar rutas en el servidor Express
    - Agregar las nuevas rutas al archivo principal de rutas del servidor
    - _Requisitos: 2.1, 1.1_

- [ ] 3. Checkpoint - Verificar backend i18n y configuración
  - Asegurar que todos los tests pasan, preguntar al usuario si surgen dudas.

- [ ] 4. Sistema i18n en frontend
  - [x] 4.1 Crear I18nContext y provider
    - Crear `frontend/src/contexts/I18nContext.tsx` con: locale, setLocale, función t(), carga de traducciones desde backend
    - Agrupar traducciones en mapa clave-valor indexado por locale
    - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5_
  - [ ]* 4.2 Escribir property tests para función t() y agrupación
    - **Propiedad 4: Clave de traducción inexistente retorna la clave**
    - **Propiedad 5: Búsqueda de traducciones retorna resultados coincidentes**
    - **Propiedad 6: Agrupación de traducciones por locale**
    - **Valida: Requisitos 2.4, 3.2, 4.5**
  - [x] 4.3 Integrar I18nProvider en App.tsx
    - Envolver la aplicación con I18nProvider
    - _Requisitos: 4.1_
  - [x] 4.4 Crear página de administración de traducciones
    - Crear `frontend/src/pages/TranslationsPage.tsx` con tabla paginada, búsqueda, edición inline, creación de nuevas traducciones
    - Agregar ruta y entrada en el menú lateral (sección Administración)
    - _Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [x] 4.5 Migrar textos hardcodeados del Sidebar a claves i18n
    - Reemplazar textos del Sidebar.tsx con llamadas a t()
    - _Requisitos: 4.2_
  - [x] 4.6 Agregar selector de idioma en ConfigurationPage
    - Agregar sección de idioma en la página de configuración con selector es/en
    - _Requisitos: 1.2_

- [ ] 5. Motor de temas mejorado y preview
  - [x] 5.1 Mejorar ThemeContext con preview
    - Actualizar `frontend/src/pages/ConfigurationPage.tsx` para incluir popup de preview al pasar cursor sobre un tema
    - El preview debe mostrar ejemplos de botones, listas, iconos y sidebar con los colores del tema
    - No afectar los colores actuales hasta confirmar selección
    - _Requisitos: 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4_
  - [ ]* 5.2 Escribir property test para persistencia de tema
    - **Propiedad 7: Persistencia de tema round-trip**
    - **Valida: Requisitos 5.3**

- [ ] 6. Iconos outline y logo
  - [x] 6.1 Instalar react-icons y crear componente de iconos
    - Instalar `react-icons` en frontend
    - Crear `frontend/src/components/icons/AppIcon.tsx` como wrapper que aplica estilos outline/degradé según el tema activo
    - _Requisitos: 7.1, 7.2, 7.3_
  - [x] 6.2 Crear logo SVG de la plataforma
    - Crear `frontend/src/components/icons/Logo.tsx` como componente SVG con estilo outline/degradé
    - Integrar en el Sidebar reemplazando el texto "Tech Budget"
    - _Requisitos: 7.4_
  - [x] 6.3 Migrar emojis del Sidebar a iconos outline
    - Reemplazar todos los emojis en Sidebar.tsx con componentes de react-icons (Heroicons outline - hi2)
    - _Requisitos: 7.1_

- [ ] 7. Checkpoint - Verificar i18n, temas e iconos
  - Asegurar que todos los tests pasan, preguntar al usuario si surgen dudas.

- [ ] 8. Presupuesto vigente por defecto
  - [x] 8.1 Crear endpoint de presupuesto vigente en backend
    - Agregar método `getActiveBudget()` en BudgetService que retorna la versión más reciente del año actual (o el más reciente disponible)
    - Crear endpoint GET /api/budgets/active
    - _Requisitos: 8.1, 8.3_
  - [ ]* 8.2 Escribir property test para identificación de presupuesto vigente
    - **Propiedad 8: Identificación del presupuesto vigente**
    - **Valida: Requisitos 8.1, 8.3**
  - [x] 8.3 Crear ActiveBudgetContext en frontend
    - Crear `frontend/src/contexts/ActiveBudgetContext.tsx` que carga el presupuesto vigente al iniciar
    - Mostrar indicador de presupuesto vigente (año y versión) en la interfaz
    - _Requisitos: 8.2, 8.4_
  - [x] 8.4 Integrar presupuesto vigente en páginas existentes
    - Modificar páginas de Gastos, Transacciones, PlanValues, Dashboard, Ahorros, Diferidos para usar el presupuesto vigente automáticamente
    - La sección de Presupuestos mantiene su selector libre
    - _Requisitos: 8.2, 8.5_

- [ ] 9. Comparación de presupuestos
  - [x] 9.1 Crear endpoint de comparación en backend
    - Agregar método `compareBudgets(budgetAId, budgetBId)` en BudgetService
    - Crear endpoint GET /api/budgets/compare?budgetA={id}&budgetB={id}
    - Validar que ambos presupuestos sean del mismo año
    - Retornar datos completos de ambos presupuestos con gastos y plan values
    - _Requisitos: 9.2, 9.4_
  - [x] 9.2 Crear funciones de cálculo de comparación en frontend
    - Crear `frontend/src/utils/budgetComparison.ts` con funciones: calculateSummary, classifyExpenses, calculateCellDifferences, generateDifferenceDescription, getDifferenceColor
    - _Requisitos: 10.1, 10.3, 10.4, 11.2, 11.3, 11.4, 11.5_
  - [ ]* 9.3 Escribir property tests para funciones de comparación
    - **Propiedad 9: Filtro de presupuestos por año**
    - **Propiedad 10: Cálculo de resumen de comparación**
    - **Propiedad 11: Clasificación de gastos en comparación**
    - **Propiedad 12: Cálculo de diferencia por celda**
    - **Propiedad 13: Asignación de color por diferencia**
    - **Propiedad 14: Descripción textual incluye todas las diferencias**
    - **Valida: Requisitos 9.2, 10.1, 10.3, 11.5, 10.4, 11.2, 11.4**
  - [x] 9.4 Crear página de comparación de presupuestos
    - Crear `frontend/src/pages/BudgetComparePage.tsx` con:
      - Selector de año y dos selectores de presupuesto
      - Tarjetas resumen con totales y diferencias
      - Gráfico de barras comparativo mensual
      - Indicadores de gastos nuevos/eliminados/modificados
      - Tabla detallada con valores lado a lado y celdas resaltadas
      - Botón para generar descripción textual de diferencias
    - _Requisitos: 9.1, 9.2, 9.3, 10.1, 10.2, 10.3, 10.4, 11.1, 11.2, 11.3, 11.4, 11.5_
  - [x] 9.5 Agregar entrada en menú y rutas
    - Agregar "Comparar Presupuestos" como opción en el menú de presupuestos del Sidebar
    - Configurar ruta en el router
    - _Requisitos: 9.1_

- [ ] 10. Checkpoint - Verificar presupuesto vigente y comparación
  - Asegurar que todos los tests pasan, preguntar al usuario si surgen dudas.

- [ ] 11. Reportes detallados
  - [x] 11.1 Crear definiciones de reportes
    - Crear `frontend/src/config/reportDefinitions.ts` con las 10 definiciones de reportes incluyendo nombre, descripción, filtros y columnas
    - _Requisitos: 12.1, 12.2, 12.3_
  - [x] 11.2 Crear endpoints de reportes en backend
    - Crear `backend/src/services/ReportService.ts` con métodos para generar datos de cada tipo de reporte
    - Crear `backend/src/routes/reportRoutes.ts` con endpoint GET /api/reports/:type que acepta filtros como query params
    - Implementar los 10 reportes: executive-summary, budget-execution, plan-vs-real, by-financial-company, by-tech-direction, by-user-area, detailed-transactions, variance-analysis, savings-deferrals, annual-projection
    - _Requisitos: 12.2, 13.1, 13.4_
  - [ ]* 11.3 Escribir property test para filtrado de reportes
    - **Propiedad 15: Filtro de reportes produce subconjunto correcto**
    - **Valida: Requisitos 13.1**
  - [x] 11.4 Crear página de reportes detallados
    - Crear `frontend/src/pages/DetailedReportsPage.tsx` con:
      - Listado de 10 reportes con nombre y descripción
      - Panel de filtros dinámico según el reporte seleccionado
      - Tabla de resultados con columnas apropiadas
      - Mensaje de "sin resultados" cuando no hay datos
    - _Requisitos: 12.1, 12.2, 12.3, 13.1, 13.2, 13.3, 13.4_
  - [x] 11.5 Implementar exportación a Excel
    - Instalar librería `xlsx` en frontend
    - Crear `frontend/src/utils/excelExport.ts` con función para generar XLSX con encabezados, formato numérico y nombre de reporte
    - Integrar botón "Descargar Excel" en DetailedReportsPage
    - Nombrar archivos con formato "reporte_{nombre}_{fecha}.xlsx"
    - _Requisitos: 14.1, 14.2, 14.3, 14.4, 14.5_
  - [ ]* 11.6 Escribir property tests para generación Excel
    - **Propiedad 16: Round-trip de generación Excel**
    - **Propiedad 17: Nombre de archivo Excel sigue convención**
    - **Valida: Requisitos 14.1, 14.2, 14.3, 14.4**
  - [x] 11.7 Agregar entrada en menú y rutas
    - Agregar "Reportes Detallados" como opción en el menú del Sidebar
    - Configurar ruta en el router
    - _Requisitos: 12.1_

- [ ] 12. Integración final y migración de textos
  - [x] 12.1 Migrar textos restantes a i18n
    - Reemplazar textos hardcodeados en las páginas principales (Dashboard, Expenses, Transactions, PlanValues, Reports, Configuration, etc.) con llamadas a t()
    - _Requisitos: 4.2_
  - [x] 12.2 Aplicar iconos outline en todas las páginas
    - Reemplazar emojis restantes en todas las páginas y componentes con iconos de react-icons
    - _Requisitos: 7.1_
  - [x] 12.3 Verificar que el tema se aplica correctamente en todos los componentes
    - Asegurar que los colores del tema se aplican a botones, headers, sidebar, iconos en todas las páginas
    - _Requisitos: 5.1, 5.4_

- [ ] 13. Checkpoint final - Verificar integración completa
  - Asegurar que todos los tests pasan, preguntar al usuario si surgen dudas.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los checkpoints aseguran validación incremental
- Los property tests validan propiedades universales de correctitud
- Los unit tests validan ejemplos específicos y casos borde
- Se usa TypeScript en todo el stack (backend y frontend)
- La librería de PBT recomendada es `fast-check` para TypeScript con Vitest
