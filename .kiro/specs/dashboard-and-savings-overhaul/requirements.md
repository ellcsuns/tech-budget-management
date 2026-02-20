# Documento de Requisitos: Dashboard y Reestructuración de Ahorros

## Introducción

Este documento cubre un conjunto amplio de mejoras al sistema de gestión presupuestaria, incluyendo: mejoras de filtros y visualización en el Dashboard, corrección de bugs en transacciones reales, reestructuración completa del módulo de ahorros, trazabilidad de modificaciones en líneas de presupuesto, configuración de presupuesto vigente, workflow de envío a revisión, y reemplazo de popups nativos del navegador por componentes estilizados.

## Glosario

- **Sistema**: La aplicación de gestión presupuestaria (backend Node.js + Prisma + PostgreSQL, frontend React + TypeScript + Tailwind)
- **Dashboard**: Página principal que muestra resumen y detalle de líneas presupuestarias del presupuesto vigente
- **Presupuesto_Vigente**: El presupuesto marcado con `isActive = true` en la base de datos
- **Línea_Presupuestaria**: Registro `BudgetLine` que vincula un gasto con un presupuesto y una empresa financiera
- **Empresa_Financiera**: Entidad `FinancialCompany` con campos `code` y `name`
- **Panel_de_Filtros**: Componente `FilterPanel` que permite filtrar líneas presupuestarias
- **Transacción_Real**: Registro `Transaction` de tipo `REAL`
- **Ahorro**: Registro `Saving` que representa una reducción planificada sobre una línea presupuestaria
- **Popup_Detalle**: Componente modal estilizado que muestra información detallada al hacer click en una línea del Dashboard
- **Tabla_Presupuestos**: Componente `BudgetTable` que muestra las líneas presupuestarias en la sección de presupuestos
- **Página_Configuración**: Página `ConfigurationPage` para ajustes del sistema
- **Diálogo_Confirmación**: Componente `ConfirmationDialog` existente para reemplazar popups nativos
- **Categoría**: Campo de clasificación del gasto (definido en el spec `expense-category-and-filters`)

## Requisitos

### Requisito 1: Filtro de sociedades financieras por código en el Dashboard

**Historia de Usuario:** Como usuario del sistema, quiero que el filtro de sociedades financieras muestre el código en lugar del nombre, para identificar las empresas de forma más concisa y rápida.

#### Criterios de Aceptación

1. THE Panel_de_Filtros SHALL mostrar el campo `code` de cada Empresa_Financiera en los botones de filtro en lugar del campo `name`
2. WHEN el usuario pasa el cursor sobre un botón de filtro de Empresa_Financiera, THE Panel_de_Filtros SHALL mostrar un tooltip con el nombre completo (`name`) de la Empresa_Financiera
3. WHEN se aplica un filtro de Empresa_Financiera, THE Sistema SHALL filtrar las líneas presupuestarias utilizando el identificador de la empresa seleccionada

### Requisito 2: Meses como M1-M12 en el Dashboard

**Historia de Usuario:** Como usuario del sistema, quiero que los meses se muestren como M1, M2, M3... M12 en el Dashboard, para tener una nomenclatura más compacta y estándar.

#### Criterios de Aceptación

1. WHEN el Dashboard muestra encabezados de meses en la tabla de comparación, THE Sistema SHALL mostrar los meses como "M1", "M2", "M3"... "M12" en lugar de "Ene", "Feb", "Mar"... "Dic"
2. WHEN el Dashboard muestra encabezados de meses en la vista de plan, THE Sistema SHALL mostrar los meses como "M1", "M2", "M3"... "M12"

### Requisito 3: Corrección de actualización de transacciones reales

**Historia de Usuario:** Como usuario del sistema, quiero poder modificar una transacción real asignándole una línea de presupuesto, para corregir o completar la información de la transacción.

#### Criterios de Aceptación

1. WHEN el usuario edita una Transacción_Real y asigna o cambia el campo `budgetLineId`, THE Sistema SHALL actualizar la transacción correctamente en la base de datos
2. WHEN la actualización de una Transacción_Real es exitosa, THE Sistema SHALL mostrar un mensaje de éxito al usuario
3. IF la actualización de una Transacción_Real falla, THEN THE Sistema SHALL mostrar un mensaje de error descriptivo al usuario

### Requisito 4: Dashboard basado en presupuesto vigente

**Historia de Usuario:** Como usuario del sistema, quiero que el Dashboard siempre muestre datos del presupuesto vigente, para asegurar que la información mostrada sea la relevante y actual.

#### Criterios de Aceptación

1. WHEN el Dashboard se carga, THE Sistema SHALL obtener y mostrar las líneas presupuestarias del Presupuesto_Vigente (isActive = true)
2. IF no existe un Presupuesto_Vigente, THEN THE Sistema SHALL mostrar un mensaje indicando que no hay presupuesto vigente configurado
3. THE Dashboard SHALL calcular todos los indicadores (presupuesto, comprometido, real, diferencia) exclusivamente sobre las líneas del Presupuesto_Vigente

### Requisito 5: Configuración de presupuesto vigente

**Historia de Usuario:** Como administrador del sistema, quiero poder establecer cuál es el presupuesto vigente desde la página de configuración, para controlar qué presupuesto se usa en el Dashboard.

#### Criterios de Aceptación

1. THE Página_Configuración SHALL mostrar una sección para seleccionar el Presupuesto_Vigente de entre todos los presupuestos existentes
2. WHEN el administrador selecciona un presupuesto y confirma, THE Sistema SHALL marcar ese presupuesto como vigente (isActive = true) y desactivar los demás
3. WHEN el presupuesto vigente se cambia exitosamente, THE Sistema SHALL mostrar un mensaje de confirmación
4. THE Página_Configuración SHALL mostrar cuál es el presupuesto vigente actual con un indicador visual

### Requisito 6: Enviar presupuesto a revisión

**Historia de Usuario:** Como usuario del sistema, quiero poder enviar un presupuesto completo a revisión, para iniciar un proceso de aprobación del presupuesto.

#### Criterios de Aceptación

1. WHEN el usuario visualiza un presupuesto en la sección de presupuestos, THE Sistema SHALL mostrar un botón "Enviar a Revisión"
2. WHEN el usuario hace click en "Enviar a Revisión", THE Sistema SHALL registrar el presupuesto como enviado a revisión con la fecha, hora y usuario que lo envió
3. WHILE un presupuesto está en estado de revisión, THE Sistema SHALL mostrar un indicador visual del estado de revisión
4. IF el presupuesto ya fue enviado a revisión, THEN THE Sistema SHALL deshabilitar el botón de envío y mostrar la información del envío previo

### Requisito 7: Última modificación en líneas de presupuesto

**Historia de Usuario:** Como usuario del sistema, quiero ver la fecha, hora y usuario de la última modificación de cada línea de presupuesto, para tener trazabilidad de los cambios.

#### Criterios de Aceptación

1. THE Sistema SHALL registrar la fecha, hora y usuario de la última modificación en cada Línea_Presupuestaria
2. WHEN el usuario hace click en una línea del Dashboard y se abre el Popup_Detalle, THE Popup_Detalle SHALL mostrar la fecha, hora y usuario de la última modificación de la línea
3. THE Tabla_Presupuestos SHALL incluir columnas colapsables al final de la tabla mostrando la fecha de última modificación y el usuario que la realizó
4. WHEN las columnas de última modificación están colapsadas, THE Tabla_Presupuestos SHALL mostrar un botón para expandirlas

### Requisito 8: Categorías como filtro en el Dashboard

**Historia de Usuario:** Como usuario del sistema, quiero filtrar las líneas presupuestarias por categoría de gasto en el Dashboard, para analizar el presupuesto agrupado por tipo de gasto.

#### Criterios de Aceptación

1. THE Panel_de_Filtros SHALL mostrar botones de filtro para cada categoría presente en las líneas presupuestarias cargadas
2. WHEN el usuario selecciona una o más categorías en el filtro, THE Sistema SHALL mostrar únicamente las líneas presupuestarias cuyo gasto pertenezca a las categorías seleccionadas
3. WHEN el usuario limpia los filtros, THE Sistema SHALL restaurar la visualización de todas las líneas presupuestarias sin filtro de categoría
4. WHEN no existen categorías asignadas en las líneas presupuestarias, THE Panel_de_Filtros SHALL ocultar la sección de filtro por categoría

### Requisito 9: Totales por compañía financiera en el Dashboard

**Historia de Usuario:** Como usuario del sistema, quiero ver los indicadores del Dashboard agrupados por compañía financiera, para entender la distribución del presupuesto por empresa.

#### Criterios de Aceptación

1. THE Dashboard SHALL mostrar los indicadores de totales (presupuesto, comprometido, real, diferencia) agrupados por Empresa_Financiera
2. WHEN se aplican filtros, THE Dashboard SHALL recalcular los totales por Empresa_Financiera considerando solo las líneas filtradas
3. THE Dashboard SHALL mostrar el código de la Empresa_Financiera como etiqueta de cada grupo de indicadores

### Requisito 10: Reemplazo de popups nativos por componentes estilizados

**Historia de Usuario:** Como usuario del sistema, quiero que todas las confirmaciones y alertas usen componentes gráficos estilizados en lugar de popups nativos del navegador, para una experiencia visual consistente.

#### Criterios de Aceptación

1. WHEN el sistema requiere confirmación del usuario (por ejemplo, al eliminar un ahorro o una transacción), THE Sistema SHALL mostrar el Diálogo_Confirmación existente en lugar de `window.confirm()`
2. WHEN el sistema necesita mostrar una alerta, THE Sistema SHALL usar el componente Toast existente en lugar de `window.alert()`
3. THE Sistema SHALL eliminar todas las llamadas a `confirm()` y `alert()` nativos del navegador en el código frontend

### Requisito 11: Reestructuración completa de ahorros

**Historia de Usuario:** Como usuario del sistema, quiero que los ahorros estén vinculados a líneas presupuestarias específicas con valores mensuales editables, para tener un control granular del ahorro mes a mes.

#### Criterios de Aceptación

1. THE Ahorro SHALL estar vinculado a una Línea_Presupuestaria específica (clave compuesta: id de gasto + sociedad financiera)
2. WHEN el usuario crea un nuevo Ahorro, THE Sistema SHALL mostrar 12 campos de entrada (M1-M12) donde el usuario ingresa el valor del ahorro para cada mes
3. WHEN el usuario ingresa valores mensuales, THE Sistema SHALL calcular el total del ahorro automáticamente como la suma de los 12 valores mensuales
4. WHEN el usuario hace click en un Ahorro existente, THE Sistema SHALL mostrar un popup de detalle con los valores mes a mes del ahorro
5. THE Sistema SHALL mostrar un botón "Activar" en cada Ahorro con estado pendiente
6. WHEN el usuario activa un Ahorro, THE Sistema SHALL cambiar el estado del ahorro a activo sin modificar los valores originales de la Línea_Presupuestaria
7. WHILE un Ahorro está activo para una Línea_Presupuestaria, THE Dashboard SHALL mostrar el valor consolidado (valor original - ahorro) en las celdas afectadas
8. WHILE un Ahorro está activo para una Línea_Presupuestaria, THE Dashboard SHALL pintar de un color diferente las celdas cuyos valores fueron afectados por el ahorro
9. WHEN el usuario hace click en una línea del Dashboard que tiene ahorro activo, THE Popup_Detalle SHALL indicar qué valores mensuales tienen ahorro aplicado y mostrar el desglose (original, ahorro, consolidado)
