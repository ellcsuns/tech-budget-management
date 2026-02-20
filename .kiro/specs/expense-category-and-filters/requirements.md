# Documento de Requisitos

## Introducción

Esta funcionalidad extiende el modelo de gastos (Expense) del sistema de gestión presupuestaria para incluir un campo de categoría y un campo de área responsable. Además, se agregan filtros por categoría y área responsable en el Dashboard y se modifica el filtro de empresas financieras para mostrar el código en lugar de la descripción.

## Glosario

- **Sistema**: La aplicación de gestión presupuestaria (backend + frontend)
- **Gasto**: Entidad maestra que representa un gasto presupuestario (modelo Expense en Prisma)
- **Categoría**: Clasificación del gasto (ej: "Infraestructura", "Licencias", "Servicios")
- **Área_Responsable**: Área organizacional responsable del gasto, referenciada desde el modelo UserArea existente
- **Empresa_Financiera**: Entidad que representa una empresa financiera (modelo FinancialCompany en Prisma), con campos `code` y `name`
- **Panel_de_Filtros**: Componente FilterPanel que permite filtrar las líneas presupuestarias en el Dashboard
- **Dashboard**: Página principal que muestra el resumen y detalle de líneas presupuestarias
- **Línea_Presupuestaria**: Registro que vincula un gasto con un presupuesto y una empresa financiera (modelo BudgetLine)
- **Popup_Detalle**: Componente modal estilizado que muestra información detallada de una solicitud de cambio
- **Solicitud_de_Cambio**: Registro que representa una petición de modificación de valores presupuestarios (modelo BudgetLineChangeRequest)

## Requisitos

### Requisito 1: Campo de categoría en gastos

**Historia de Usuario:** Como usuario del sistema, quiero que cada gasto tenga un campo de categoría, para poder clasificar y organizar los gastos de forma estructurada.

#### Criterios de Aceptación

1. THE Sistema SHALL almacenar un campo `category` de tipo texto en cada Gasto
2. WHEN se crea un nuevo Gasto, THE Sistema SHALL permitir asignar una categoría al Gasto
3. WHEN se edita un Gasto existente, THE Sistema SHALL permitir modificar la categoría del Gasto
4. WHEN se consulta un Gasto, THE Sistema SHALL incluir el campo de categoría en la respuesta de la API
5. IF el campo de categoría está vacío al crear o editar un Gasto, THEN THE Sistema SHALL aceptar el Gasto con categoría vacía

### Requisito 2: Campo de área responsable en gastos

**Historia de Usuario:** Como usuario del sistema, quiero que cada gasto tenga un campo de área responsable, para identificar qué área organizacional es responsable de cada gasto.

#### Criterios de Aceptación

1. THE Sistema SHALL almacenar un campo `responsibleAreaId` como referencia al modelo UserArea en cada Gasto
2. WHEN se crea un nuevo Gasto, THE Sistema SHALL permitir asignar un área responsable seleccionándola de las áreas existentes
3. WHEN se edita un Gasto existente, THE Sistema SHALL permitir modificar el área responsable del Gasto
4. WHEN se consulta un Gasto, THE Sistema SHALL incluir los datos del área responsable (código y nombre) en la respuesta de la API
5. IF el campo de área responsable está vacío al crear o editar un Gasto, THEN THE Sistema SHALL aceptar el Gasto sin área responsable asignada

### Requisito 3: Visualización de área responsable en el Dashboard

**Historia de Usuario:** Como usuario del sistema, quiero ver el área responsable de cada gasto en el Dashboard, para identificar rápidamente qué área gestiona cada línea presupuestaria.

#### Criterios de Aceptación

1. WHEN el Dashboard muestra líneas presupuestarias en vista de comparación, THE Sistema SHALL mostrar una columna de área responsable con el nombre del área
2. WHEN una línea presupuestaria no tiene área responsable asignada, THE Sistema SHALL mostrar un indicador vacío ("-") en la columna de área responsable

### Requisito 4: Filtro por categoría en el Dashboard

**Historia de Usuario:** Como usuario del sistema, quiero filtrar las líneas presupuestarias por categoría en el Dashboard, para analizar el presupuesto agrupado por tipo de gasto.

#### Criterios de Aceptación

1. THE Panel_de_Filtros SHALL mostrar botones de filtro para cada categoría presente en las líneas presupuestarias cargadas
2. WHEN el usuario selecciona una o más categorías en el filtro, THE Sistema SHALL mostrar únicamente las líneas presupuestarias cuyo gasto pertenezca a las categorías seleccionadas
3. WHEN el usuario limpia los filtros, THE Sistema SHALL restaurar la visualización de todas las líneas presupuestarias sin filtro de categoría
4. WHEN no existen categorías asignadas en las líneas presupuestarias, THE Panel_de_Filtros SHALL ocultar la sección de filtro por categoría

### Requisito 5: Filtro por área responsable en el Dashboard

**Historia de Usuario:** Como usuario del sistema, quiero filtrar las líneas presupuestarias por área responsable en el Dashboard, para analizar el presupuesto por área organizacional.

#### Criterios de Aceptación

1. THE Panel_de_Filtros SHALL mostrar botones de filtro para cada área responsable presente en las líneas presupuestarias cargadas
2. WHEN el usuario selecciona una o más áreas responsables en el filtro, THE Sistema SHALL mostrar únicamente las líneas presupuestarias cuyo gasto pertenezca a las áreas responsables seleccionadas
3. WHEN el usuario limpia los filtros, THE Sistema SHALL restaurar la visualización de todas las líneas presupuestarias sin filtro de área responsable
4. WHEN no existen áreas responsables asignadas en las líneas presupuestarias, THE Panel_de_Filtros SHALL ocultar la sección de filtro por área responsable

### Requisito 6: Filtro de empresas financieras por código

**Historia de Usuario:** Como usuario del sistema, quiero que el filtro de empresas financieras muestre el código de la empresa en lugar de la descripción, para identificar las empresas de forma más concisa.

#### Criterios de Aceptación

1. THE Panel_de_Filtros SHALL mostrar el código (`code`) de cada Empresa_Financiera en los botones de filtro en lugar del nombre (`name`)
2. WHEN se aplica un filtro de empresa financiera, THE Sistema SHALL filtrar las líneas presupuestarias utilizando el identificador de la empresa seleccionada

### Requisito 7: Visualización de detalle de solicitudes de cambio propias

**Historia de Usuario:** Como usuario del sistema, quiero poder ver el detalle de mis solicitudes de cambio pendientes en un popup con estilo, para comparar los valores anteriores con los valores propuestos.

#### Criterios de Aceptación

1. WHEN el usuario hace clic en una solicitud de cambio propia en la tabla de "Mis Solicitudes", THE Sistema SHALL mostrar un popup estilizado con el detalle de la solicitud
2. THE Popup_Detalle SHALL mostrar la información del gasto (código, descripción, empresa, moneda) en la cabecera
3. THE Popup_Detalle SHALL mostrar una tabla comparativa mes a mes con columnas: mes, valor actual, valor propuesto y diferencia
4. WHEN un valor propuesto difiere del valor actual, THE Popup_Detalle SHALL resaltar visualmente la fila con el cambio
5. THE Popup_Detalle SHALL mostrar una fila de totales con la suma de valores actuales, propuestos y la diferencia total
6. THE Popup_Detalle SHALL mostrar el estado de la solicitud (Pendiente, Aprobada, Rechazada) con indicador visual de color
7. THE Sistema SHALL utilizar un popup modal con estilo consistente con el diseño de la aplicación, sin utilizar message boxes nativos del navegador

### Requisito 8: Corrección de aprobación de presupuesto para administradores

**Historia de Usuario:** Como administrador del sistema, quiero poder aprobar solicitudes de cambio de presupuesto, para gestionar las aprobaciones sin restricciones.

#### Criterios de Aceptación

1. THE Sistema SHALL otorgar el permiso `APPROVE_BUDGET` al rol de Administrador en el módulo de aprobaciones
2. WHEN un administrador accede a la página de aprobaciones, THE Sistema SHALL mostrar todas las solicitudes pendientes
3. WHEN un administrador aprueba o rechaza una solicitud, THE Sistema SHALL procesar la acción correctamente
