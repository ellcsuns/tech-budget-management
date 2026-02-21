# Documento de Requisitos

## Introducción

Este documento define los requisitos para un conjunto de mejoras en la interfaz de usuario de la aplicación de gestión presupuestaria. Los cambios abarcan cuatro áreas: el popup de detalle del dashboard, el formulario de agregar línea de presupuesto, el cálculo del monto total de ahorros, y los filtros en la sección de ahorros.

## Glosario

- **Dashboard**: Página principal que muestra el resumen comparativo del presupuesto activo con transacciones comprometidas y reales.
- **Popup_Detalle_Dashboard**: Ventana modal que se muestra al hacer clic en una fila del dashboard, presentando información detallada de la línea presupuestaria.
- **ExpenseTable**: Componente de tabla en el dashboard que muestra las líneas presupuestarias en modo comparativo (presupuesto, comprometido, real, diferencia).
- **Popup_Agregar_Linea**: Ventana modal en la sección de presupuestos para agregar una nueva línea presupuestaria.
- **Popup_Editar_Linea**: Ventana modal existente en la sección de presupuestos para solicitar cambios en una línea existente, que muestra los meses en formato vertical.
- **Seccion_Ahorros**: Página de gestión de ahorros (SavingsPage) donde se crean, visualizan y activan ahorros.
- **Monto_Total_Ahorro**: Campo `totalAmount` del modelo Saving que representa la suma de los valores mensuales individuales (savingM1 a savingM12).
- **FilterPanel**: Componente reutilizable de filtros que incluye moneda, sociedad financiera, categoría de gasto y búsqueda por texto.
- **Linea_Presupuestaria**: Registro (BudgetLine) que vincula un gasto con un presupuesto, empresa financiera y valores mensuales planificados.
- **Sociedad_Financiera**: Entidad (FinancialCompany) que representa una empresa financiera asociada a líneas presupuestarias.
- **Categoria_Gasto**: Entidad (ExpenseCategory) que clasifica los gastos.
- **Area_Tecnologia**: Entidad (TechnologyDirection) que representa una dirección tecnológica.

## Requisitos

### Requisito 1: Popup de detalle completo en el Dashboard

**Historia de Usuario:** Como usuario del dashboard, quiero ver toda la información de una fila al hacer clic, para poder analizar los datos presupuestarios, comprometidos, reales y diferencias de forma detallada mes a mes.

#### Criterios de Aceptación

1. CUANDO un usuario hace clic en una fila del ExpenseTable en modo comparativo, EL Popup_Detalle_Dashboard DEBERÁ mostrar los metadatos de la línea: moneda, sociedad financiera y categoría del gasto.
2. CUANDO el Popup_Detalle_Dashboard se abre, EL Popup_Detalle_Dashboard DEBERÁ mostrar una tabla con los meses listados verticalmente (M1 a M12 como filas).
3. CUANDO el Popup_Detalle_Dashboard muestra los datos mensuales, EL Popup_Detalle_Dashboard DEBERÁ incluir columnas para presupuesto, comprometido, real y diferencia por cada mes.
4. CUANDO el Popup_Detalle_Dashboard muestra los datos mensuales, EL Popup_Detalle_Dashboard DEBERÁ mostrar una fila de totales al final con la suma de cada columna.
5. CUANDO existen ahorros activos para la línea presupuestaria, EL Popup_Detalle_Dashboard DEBERÁ mostrar el presupuesto neto (original menos ahorro) en la columna de presupuesto.

### Requisito 2: Formulario de agregar línea con meses en vertical

**Historia de Usuario:** Como usuario de la sección de presupuestos, quiero que el popup de agregar una nueva línea muestre los meses en formato vertical, para tener consistencia visual con el popup de edición de líneas existentes.

#### Criterios de Aceptación

1. CUANDO el usuario abre el Popup_Agregar_Linea, EL Popup_Agregar_Linea DEBERÁ mostrar los campos de meses (M1 a M12) en formato vertical (una fila por mes), de la misma forma que el Popup_Editar_Linea.
2. CUANDO el usuario ingresa valores mensuales en el Popup_Agregar_Linea, EL Popup_Agregar_Linea DEBERÁ mostrar el total calculado como la suma de todos los valores mensuales.
3. CUANDO el Popup_Agregar_Linea muestra los meses en vertical, EL Popup_Agregar_Linea DEBERÁ incluir una etiqueta de mes y un campo de entrada numérica por cada fila.

### Requisito 3: Cálculo automático del monto total de ahorro

**Historia de Usuario:** Como usuario del sistema, quiero que el monto total del ahorro se calcule automáticamente como la suma de los valores mensuales, para evitar inconsistencias entre el total y los valores individuales.

#### Criterios de Aceptación

1. CUANDO se crea un ahorro, EL Servicio_Ahorros DEBERÁ calcular el Monto_Total_Ahorro como la suma de savingM1 a savingM12.
2. CUANDO el formulario de creación de ahorro se muestra, LA Seccion_Ahorros DEBERÁ omitir el campo de monto total editable y mostrar únicamente el total calculado como suma de los valores mensuales.
3. CUANDO se muestra el detalle de un ahorro, LA Seccion_Ahorros DEBERÁ mostrar el monto total como la suma calculada de los valores mensuales individuales.
4. PARA TODOS los ahorros válidos, el Monto_Total_Ahorro DEBERÁ ser igual a la suma de savingM1 + savingM2 + ... + savingM12 (propiedad de ida y vuelta).

### Requisito 4: Filtros en la sección de ahorros

**Historia de Usuario:** Como usuario de la sección de ahorros, quiero tener los mismos filtros disponibles en el dashboard (moneda, categoría, sociedad y área de tecnología), para poder buscar y filtrar ahorros de forma consistente con el resto de la aplicación.

#### Criterios de Aceptación

1. CUANDO la Seccion_Ahorros se carga, LA Seccion_Ahorros DEBERÁ mostrar filtros por moneda, categoría de gasto, sociedad financiera y área de tecnología.
2. CUANDO el usuario selecciona un filtro de moneda, LA Seccion_Ahorros DEBERÁ mostrar únicamente los ahorros cuya línea presupuestaria tenga la moneda seleccionada.
3. CUANDO el usuario selecciona un filtro de categoría de gasto, LA Seccion_Ahorros DEBERÁ mostrar únicamente los ahorros cuya línea presupuestaria pertenezca a la categoría seleccionada.
4. CUANDO el usuario selecciona un filtro de sociedad financiera, LA Seccion_Ahorros DEBERÁ mostrar únicamente los ahorros cuya línea presupuestaria pertenezca a la sociedad seleccionada.
5. CUANDO el usuario selecciona un filtro de área de tecnología, LA Seccion_Ahorros DEBERÁ mostrar únicamente los ahorros cuya línea presupuestaria tenga la dirección tecnológica seleccionada.
6. CUANDO el usuario combina múltiples filtros, LA Seccion_Ahorros DEBERÁ aplicar todos los filtros de forma conjunta (intersección).
