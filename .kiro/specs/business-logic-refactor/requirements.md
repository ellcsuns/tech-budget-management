# Documento de Requisitos: Refactorización de Lógica de Negocio

## Introducción

Este documento define los requisitos para la refactorización del modelo de datos y la lógica de negocio de la aplicación de gestión de presupuestos tecnológicos. Los cambios principales incluyen: separar el gasto como entidad maestra independiente del presupuesto, reestructurar la tabla de presupuestos como relación gasto-presupuesto-empresa, implementar la lógica de compensación entre transacciones comprometidas y reales, agregar sociedad financiera a las transacciones, y un maestro de monedas permitidas por empresa financiera. Además, se ajusta la sección de gastos en la UI para mostrar solo datos maestros y tagging.

## Glosario

- **Gasto**: Entidad maestra que representa un concepto de gasto tecnológico con código, descripciones, direcciones tecnológicas, áreas de usuario y sistema de tagging. Existe independientemente de cualquier presupuesto.
- **Presupuesto**: Entidad identificada por año + versión que agrupa una serie de gastos asignados a empresas financieras con valores planificados mensuales.
- **Línea_de_Presupuesto**: Registro en la tabla de presupuestos que vincula un gasto con un presupuesto y una empresa financiera, conteniendo la moneda y los valores planificados por mes.
- **Empresa_Financiera**: Entidad que representa una sociedad/empresa financiera con una moneda asociada validada contra el maestro de monedas permitidas.
- **Moneda_Permitida**: Registro en el maestro de monedas que define las monedas válidas que pueden asociarse a una empresa financiera.
- **Transacción_Comprometida**: Transacción financiera en proceso de negociación que aún no ha entrado a la contabilidad real. Se agrupa por código de gasto y mes de fecha de imputación para el dashboard.
- **Transacción_Real**: Transacción financiera contabilizada. Puede o no referenciar a una transacción comprometida. Si la referencia existe, la comprometida se marca como compensada.
- **Compensación**: Proceso por el cual una transacción comprometida referenciada por una transacción real se marca como compensada y deja de sumar en el dashboard.
- **Dashboard**: Vista principal que muestra los valores planificados, comprometidos y reales agrupados por gasto y mes.
- **Fecha_de_Imputación**: Campo postingDate de la transacción, utilizado para determinar el mes al que se asigna la transacción en el dashboard.

## Requisitos

### Requisito 1: Gasto como Entidad Maestra Independiente

**Historia de Usuario:** Como administrador de presupuestos, quiero que los gastos existan como entidades maestras independientes de los presupuestos, para poder reutilizar el mismo gasto en múltiples presupuestos y empresas financieras.

#### Criterios de Aceptación

1. THE Gasto SHALL existir como entidad independiente con código, descripción corta, descripción larga, direcciones tecnológicas, áreas de usuario, estado activo/inactivo y sistema de tagging, sin requerir asociación a un presupuesto.
2. WHEN se crea un Gasto, THE Sistema SHALL validar que el código sea único a nivel global del maestro de gastos.
3. WHEN se consulta un Gasto, THE Sistema SHALL retornar los datos maestros y los tags asociados sin incluir información de transacciones ni de presupuestos.
4. THE Gasto SHALL mantener la relación jerárquica padre-hijo entre gastos a nivel del maestro.
5. WHEN se elimina la relación directa entre Gasto y Empresa_Financiera en el maestro, THE Sistema SHALL mover el campo financialCompanyId a la Línea_de_Presupuesto.

### Requisito 2: Reestructuración de la Tabla de Presupuestos

**Historia de Usuario:** Como administrador de presupuestos, quiero que la tabla de presupuestos vincule gastos con empresas financieras y contenga los valores planificados mensuales, para tener una estructura de clave compuesta que refleje correctamente la relación gasto-presupuesto-empresa.

#### Criterios de Aceptación

1. THE Línea_de_Presupuesto SHALL tener como clave compuesta: ID de presupuesto, ID de gasto e ID de empresa financiera.
2. THE Línea_de_Presupuesto SHALL contener como campos no clave: la moneda (derivada de la empresa financiera) y los valores planificados para cada mes (enero a diciembre).
3. WHEN se asigna un Gasto a un Presupuesto, THE Sistema SHALL requerir la selección de una Empresa_Financiera y derivar la moneda de dicha empresa.
4. WHEN se crea una Línea_de_Presupuesto, THE Sistema SHALL inicializar los valores planificados de los 12 meses en cero.
5. THE Presupuesto SHALL mantener su identificador de clave año + versión como restricción de unicidad.

### Requisito 3: Maestro de Monedas Permitidas

**Historia de Usuario:** Como administrador del sistema, quiero un maestro de monedas permitidas asociado a las empresas financieras, para garantizar que solo se usen monedas válidas en los presupuestos.

#### Criterios de Aceptación

1. THE Sistema SHALL mantener un maestro de monedas permitidas con código ISO de moneda y nombre descriptivo.
2. THE Empresa_Financiera SHALL tener una moneda asociada validada contra el maestro de monedas permitidas.
3. WHEN se asigna una moneda a una Empresa_Financiera, THE Sistema SHALL validar que la moneda exista en el maestro de monedas permitidas.
4. WHEN se crea una Línea_de_Presupuesto, THE Sistema SHALL derivar automáticamente la moneda de la Empresa_Financiera seleccionada.

### Requisito 4: Transacciones Comprometidas en el Dashboard

**Historia de Usuario:** Como analista financiero, quiero ver las transacciones comprometidas agrupadas por gasto y mes en el dashboard, para conocer los compromisos financieros pendientes de contabilización.

#### Criterios de Aceptación

1. WHEN se consultan transacciones comprometidas para el dashboard, THE Sistema SHALL buscar todas las transacciones comprometidas no compensadas por código de gasto.
2. WHEN se agrupan transacciones comprometidas, THE Sistema SHALL detectar el mes usando la fecha de imputación (postingDate) de cada transacción.
3. WHEN se calculan los valores comprometidos de un mes, THE Sistema SHALL sumar los valores de todas las transacciones comprometidas no compensadas asignadas a ese mes.
4. THE Dashboard SHALL mostrar los valores comprometidos en la columna correspondiente al mes detectado por fecha de imputación.

### Requisito 5: Transacciones Reales y Compensación

**Historia de Usuario:** Como analista financiero, quiero que las transacciones reales puedan referenciar transacciones comprometidas para compensarlas automáticamente, para que el dashboard refleje correctamente los valores sin duplicar montos.

#### Criterios de Aceptación

1. THE Transacción_Real SHALL contener un campo opcional de referencia a una Transacción_Comprometida.
2. WHEN una Transacción_Real referencia a una Transacción_Comprometida, THE Sistema SHALL marcar la Transacción_Comprometida como compensada.
3. WHEN una Transacción_Comprometida está marcada como compensada, THE Dashboard SHALL excluir su valor de la suma de comprometidos para ese mes.
4. WHEN se agrupan transacciones reales para el dashboard, THE Sistema SHALL usar la misma lógica de agrupación por código de gasto y mes de fecha de imputación que las comprometidas.
5. WHEN se elimina una Transacción_Real que referenciaba a una Transacción_Comprometida, THE Sistema SHALL revertir la marca de compensación de la Transacción_Comprometida.

### Requisito 6: Sociedad Financiera en Transacciones

**Historia de Usuario:** Como analista financiero, quiero que las transacciones tengan su propia sociedad financiera y moneda independiente, para registrar correctamente transacciones en monedas diferentes a la de la sociedad.

#### Criterios de Aceptación

1. THE Transacción_Comprometida y THE Transacción_Real SHALL contener un campo de sociedad financiera (financialCompanyId).
2. THE Transacción SHALL mantener su campo de moneda de transacción (transactionCurrency) independiente de la moneda de la sociedad financiera.
3. THE Sistema SHALL almacenar los montos de las transacciones con dos decimales de precisión.
4. WHEN se crea una transacción, THE Sistema SHALL validar que la sociedad financiera exista en el maestro de empresas financieras.

### Requisito 7: Sección de Gastos en la UI

**Historia de Usuario:** Como usuario del sistema, quiero que la sección de gastos muestre solo datos maestros y tagging sin transacciones, para tener una vista limpia del maestro de gastos que no dependa de la sociedad financiera.

#### Criterios de Aceptación

1. WHEN se muestra la lista de gastos, THE Sistema SHALL presentar solo los campos maestros: código, descripción corta, direcciones tecnológicas, áreas de usuario, estado y tags.
2. WHEN se abre el popup de detalle de un gasto, THE Sistema SHALL mostrar únicamente datos maestros y el sistema de tagging, sin secciones de transacciones.
3. WHEN se crea un nuevo gasto desde la sección de gastos, THE Sistema SHALL solicitar solo los campos maestros sin requerir presupuesto ni empresa financiera.
4. THE Sección_de_Gastos SHALL eliminar las columnas de empresa financiera y moneda de la tabla de gastos, ya que estos datos pertenecen a la Línea_de_Presupuesto.
