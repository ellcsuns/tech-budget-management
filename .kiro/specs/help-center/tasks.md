# Tareas de Implementación — Centro de Ayuda (Help Center)

## Resumen

Implementar una página de Centro de Ayuda frontend-only con documentación navegable de todos los módulos de InvestIQ. Incluye barra de búsqueda con debounce, tabla de contenidos con scroll tracking, secciones por módulo, e infografías SVG inline. Todo el contenido usa i18n. El único cambio backend es agregar claves de traducción a `seedTranslations.ts`.

## Tareas

- [x] 1. Agregar claves de traducción al backend
  - [x] 1.1 Agregar clave `menu.help` (es: "Ayuda", en: "Help") con categoría `menu` en `backend/src/seedTranslations.ts`
  - [x] 1.2 Agregar claves generales del Help Center: `help.title`, `help.searchPlaceholder`, `help.searchAriaLabel`, `help.noResults` con categoría `help`
  - [x] 1.3 Agregar claves de la sección Budget Calculation: `help.section.budgetCalc.title`, `help.section.budgetCalc.description1` a `description7` (concepto de presupuesto, fórmula computado, transacciones comprometidas/reales, varianza, tipos de cambio)
    - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_
  - [x] 1.4 Agregar claves de las secciones de módulos: Dashboard, Presupuestos, Comparar Presupuestos, Ahorros, Diferidos, Aprobaciones, Gastos, Transacciones, Tipos de Cambio, Reportes, Reportes Detallados, Configuración, Datos Maestros, Usuarios y Roles, Traducciones, Auditoría — cada una con `.title` y `.description1` a `.descriptionN`
    - _Requisitos: 5.1-5.4, 6.1-6.5, 7.1-7.3, 8.1-8.4, 9.1-9.3, 10.1-10.4, 11.1-11.3, 12.1-12.5, 13.1-13.3, 14.1-14.3, 15.1-15.3, 16.1-16.4, 17.1-17.3, 19.1, 19.3_
  - [x] 1.5 Agregar claves para textos de infografías SVG: `help.infographic.budgetFlow.*`, `help.infographic.transactionFlow.*`, `help.infographic.approvalFlow.*`, `help.infographic.rolesPermissions.*`, `help.infographic.dashboard.*`, `help.infographic.budgetLine.*`, `help.infographic.savingsEffect.*`
    - _Requisitos: 18.1, 18.4, 19.1, 19.3_

- [x] 2. Checkpoint — Verificar traducciones
  - Asegurar que todas las claves de traducción están correctamente definidas en ES y EN, pedir al usuario si hay dudas.

- [x] 3. Crear componentes helper del Help Center
  - [x] 3.1 Crear `frontend/src/components/help/HelpSearchBar.tsx` — input con ícono de lupa (HiOutlineMagnifyingGlass), placeholder localizado `t('help.searchPlaceholder')`, `aria-label` localizado con `t('help.searchAriaLabel')`, emite `onChange` en cada keystroke
    - _Requisitos: 2.1, 2.5, 20.4_
  - [x] 3.2 Crear `frontend/src/components/help/HelpTableOfContents.tsx` — componente `<nav>` que lista secciones, resalta la sección activa con `text-accent font-semibold border-l-2 border-accent`, ejecuta `scrollIntoView({ behavior: 'smooth' })` al hacer clic, en mobile se muestra como dropdown colapsable
    - _Requisitos: 3.1, 3.2, 3.3, 3.4, 20.1, 20.2, 20.3_
  - [x] 3.3 Crear `frontend/src/components/help/HelpSection.tsx` — wrapper `<section>` con `id={section.id}` y `ref` para IntersectionObserver, título como `<h2>`, párrafos de contenido como `<p>`, renderiza infographic opcional
    - _Requisitos: 20.2_

- [x] 4. Crear componentes de infografías SVG
  - [x] 4.1 Crear `frontend/src/components/help/infographics/BudgetFlowInfographic.tsx` — SVG inline con `viewBox`, responsive (width="100%"), colores del tema via CSS variables, textos localizados con `t()`, ilustra flujo Plan → Ahorros/Diferidos → Valor Computado → Comprometido → Real
    - _Requisitos: 4.6, 18.1, 18.2, 18.3, 18.4_
  - [x] 4.2 Crear `frontend/src/components/help/infographics/TransactionFlowInfographic.tsx` — SVG inline que ilustra compensación entre transacciones comprometidas y reales
    - _Requisitos: 12.4, 18.1, 18.2, 18.3, 18.4_
  - [x] 4.3 Crear `frontend/src/components/help/infographics/ApprovalFlowInfographic.tsx` — SVG inline que ilustra flujo de estados de Change Request: PENDING → APPROVED/REJECTED
    - _Requisitos: 10.3, 18.1, 18.2, 18.3, 18.4_
  - [x] 4.4 Crear `frontend/src/components/help/infographics/RolesPermissionsInfographic.tsx` — SVG inline que ilustra relación usuarios → roles → permisos → módulos
    - _Requisitos: 16.3, 18.1, 18.2, 18.3, 18.4_
  - [x] 4.5 Crear `frontend/src/components/help/infographics/DashboardInfographic.tsx` — SVG inline que representa layout del Dashboard con KPIs y gráficos
    - _Requisitos: 5.3, 18.1, 18.3, 18.4_
  - [x] 4.6 Crear `frontend/src/components/help/infographics/BudgetLineInfographic.tsx` — SVG inline que ilustra estructura de una línea presupuestaria (gasto, compañía, moneda, M1-M12)
    - _Requisitos: 6.4, 18.1, 18.3, 18.4_
  - [x] 4.7 Crear `frontend/src/components/help/infographics/SavingsEffectInfographic.tsx` — SVG inline que muestra efecto de un ahorro sobre valores mensuales
    - _Requisitos: 8.3, 18.1, 18.3, 18.4_

- [x] 5. Crear la página principal HelpPage.tsx
  - [x] 5.1 Crear `frontend/src/pages/HelpPage.tsx` con estado `searchQuery`, `debouncedQuery` (debounce 300ms), array de `HelpSectionDef[]` con las 17 secciones definidas en el diseño, filtrado case-insensitive de secciones basado en textos traducidos
    - _Requisitos: 2.2, 2.3, 2.6, 4.1_
  - [x] 5.2 Implementar IntersectionObserver para trackear sección activa y actualizar `activeSectionId` en la tabla de contenidos
    - _Requisitos: 3.3_
  - [x] 5.3 Implementar layout responsive: en `lg+` tabla de contenidos sticky a la izquierda (w-64) + contenido a la derecha; en pantallas pequeñas tabla de contenidos colapsable arriba + contenido full-width
    - _Requisitos: 20.1_
  - [x] 5.4 Mostrar mensaje localizado "No se encontraron resultados para '[término]'" cuando el filtrado no produce resultados
    - _Requisitos: 2.4_

- [x] 6. Integrar ruta y navegación
  - [x] 6.1 Agregar ruta `/help` en `frontend/src/App.tsx`: importar HelpPage, agregar `<Route path="/help" element={<ProtectedRoute><Layout><HelpPage /></Layout></ProtectedRoute>} />` sin menuCode ni permissionType
    - _Requisitos: 1.2, 1.3_
  - [x] 6.2 Agregar enlace al Help Center en `frontend/src/components/Sidebar.tsx`: agregar `HiOutlineQuestionMarkCircle` al import, insertar Link a `/help` justo antes del bloque de logout (fuera del array `menuItems`), con label `t('menu.help') || 'Ayuda'`
    - _Requisitos: 1.1, 1.4_

- [x] 7. Checkpoint — Verificar integración completa
  - Asegurar que la ruta `/help` funciona, el enlace aparece en el Sidebar para todos los usuarios, la búsqueda filtra correctamente, la tabla de contenidos navega con scroll suave, y las infografías se renderizan. Pedir al usuario si hay dudas.

- [ ]* 8. Tests opcionales
  - [ ]* 8.1 Write property test for search filtering
    - **Property 1: El filtrado de búsqueda retorna exactamente las secciones que coinciden**
    - **Validates: Requirements 2.2, 2.3, 3.4**
  - [ ]* 8.2 Write property test for translation key prefixes
    - **Property 4: Las claves de traducción usan el prefijo help.***
    - **Validates: Requirement 19.3**
  - [ ]* 8.3 Write property test for semantic HTML elements
    - **Property 6: Las secciones usan elementos HTML semánticos**
    - **Validates: Requirement 20.2**
  - [ ]* 8.4 Write unit tests for HelpSearchBar (aria-label, placeholder, onChange)
    - _Requisitos: 2.5, 20.4_
  - [ ]* 8.5 Write unit tests for Sidebar help link visibility
    - _Requisitos: 1.1, 1.4_
  - [ ]* 8.6 Write unit tests for HelpTableOfContents (scroll, keyboard navigation, active highlight)
    - _Requisitos: 3.1, 3.2, 3.3, 20.3_

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los checkpoints aseguran validación incremental
- No se requieren cambios en modelos de datos ni migraciones — solo traducciones en el backend
