# Documento de Requisitos

## Introducción

Esta especificación cubre la internacionalización completa de la aplicación de gestión presupuestaria y la implementación de popups para la entrada de datos en las secciones de presupuestos, ahorros y diferidos. Actualmente, varios textos de la interfaz (cabeceras de tablas, etiquetas de formularios, mensajes) están escritos directamente en español sin pasar por el sistema de traducciones (i18n). Además, la página de traducciones no agrupa los textos por sección funcional. Por otro lado, se requiere que al agregar líneas de presupuesto se muestre un popup con campos mes a mes (similar al patrón existente en ahorros), y que al agregar ahorros y diferidos la información se presente en un popup modal en lugar de un formulario inline.

## Glosario

- **Sistema_i18n**: El sistema de internacionalización compuesto por I18nContext, la función `t()`, y el servicio de traducciones del backend que almacena y sirve pares clave-valor por idioma.
- **Página_Traducciones**: La página TranslationsPage donde los administradores gestionan las traducciones de la aplicación.
- **Popup_Presupuesto**: Ventana modal que aparece al agregar una nueva línea de presupuesto, mostrando campos de valores mes a mes (M1-M12).
- **Popup_Ahorro**: Ventana modal que muestra el formulario de creación de ahorro con campos de línea presupuestaria, descripción y valores mensuales.
- **Popup_Diferido**: Ventana modal que muestra el formulario de creación de diferido con campos de línea presupuestaria, descripción, monto total y período.
- **Texto_Hardcoded**: Cualquier cadena de texto visible al usuario que está escrita directamente en el código fuente en lugar de usar la función `t()` del Sistema_i18n.
- **Clave_Traducción**: Identificador único con formato de sección y nombre (ej: `budget.description`, `table.currency`) usado para buscar la traducción correspondiente al idioma activo.
- **Categoría_Sección**: Agrupación lógica de claves de traducción por área funcional de la aplicación (budgets, savings, deferrals, dashboard, etc.).

## Requisitos

### Requisito 1: Eliminación de textos hardcoded

**Historia de Usuario:** Como administrador del sistema, quiero que todos los textos visibles en la aplicación utilicen el sistema de traducciones, para que la aplicación sea completamente traducible a cualquier idioma.

#### Criterios de Aceptación

1. THE Sistema_i18n SHALL proveer una Clave_Traducción para cada texto visible al usuario en toda la aplicación
2. WHEN un componente renderiza texto visible al usuario, THE componente SHALL obtener el texto mediante la función `t()` del Sistema_i18n en lugar de usar un Texto_Hardcoded
3. WHEN se reemplazan textos hardcoded en BudgetTable, THE Sistema_i18n SHALL proveer claves para: "Código", "Descripción", "Empresa", "Moneda", "Área", "Categoría", "Total", "Acc.", "Última Modif.", "Modificado por", y los placeholders de filtros
4. WHEN se reemplazan textos hardcoded en ExpenseTable, THE Sistema_i18n SHALL proveer claves para: "Código", "Descripción", "Moneda", "Empresa", "Ppto", "Comp", "Real", "Dif", "Total"
5. WHEN se reemplazan textos hardcoded en BudgetsPage, THE Sistema_i18n SHALL proveer claves para las etiquetas de popups, botones y mensajes que actualmente están en español directo (ej: "Gasto *", "Empresa Financiera *", "Cancelar", "Agregar", "Vigente", "Seleccionar gasto...", "Copiar desde presupuesto", etc.)
6. WHEN se reemplazan textos hardcoded en DeferralsPage, THE Sistema_i18n SHALL proveer claves para mensajes de confirmación y etiquetas inline que están en español directo

### Requisito 2: Agrupación de traducciones por sección

**Historia de Usuario:** Como administrador del sistema, quiero que la página de traducciones muestre todos los textos agrupados por sección funcional, para poder gestionar las traducciones de forma organizada.

#### Criterios de Aceptación

1. WHEN un administrador visita la Página_Traducciones, THE Página_Traducciones SHALL mostrar todas las Claves_Traducción agrupadas por Categoría_Sección
2. THE Página_Traducciones SHALL incluir las siguientes secciones como mínimo: "budgets", "compare_budgets", "savings", "deferrals", "dashboard", "expenses", "menu", "common", "transactions"
3. WHEN se crea una nueva Clave_Traducción, THE Página_Traducciones SHALL permitir asignarla a una Categoría_Sección existente o crear una nueva categoría
4. WHEN se registran las traducciones de textos previamente hardcoded, THE Sistema_i18n SHALL asignar cada Clave_Traducción a la Categoría_Sección correspondiente a su componente de origen

### Requisito 3: Popup con valores mensuales al agregar línea de presupuesto

**Historia de Usuario:** Como usuario de presupuestos, quiero que al agregar una nueva línea de presupuesto aparezca un popup con campos mes a mes para completar los valores, para poder ingresar los montos de forma similar a como funciona en la sección de ahorros.

#### Criterios de Aceptación

1. WHEN un usuario hace clic en "Agregar Línea" en BudgetsPage, THE Popup_Presupuesto SHALL mostrarse como ventana modal
2. WHEN el Popup_Presupuesto se muestra, THE Popup_Presupuesto SHALL contener: selector de gasto, selector de empresa financiera, selector de dirección tecnológica (opcional), y campos numéricos para cada mes (M1 a M12)
3. WHEN el usuario ingresa valores mensuales en el Popup_Presupuesto, THE Popup_Presupuesto SHALL calcular y mostrar el total acumulado de los 12 meses en tiempo real
4. WHEN el usuario confirma la creación en el Popup_Presupuesto, THE Sistema SHALL crear la línea de presupuesto con los valores mensuales ingresados
5. IF el usuario no selecciona un gasto o una empresa financiera, THEN THE Popup_Presupuesto SHALL deshabilitar el botón de confirmación
6. WHEN el usuario cancela o cierra el Popup_Presupuesto, THE Sistema SHALL descartar los datos ingresados y cerrar el popup sin crear la línea

### Requisito 4: Popup para creación de ahorros

**Historia de Usuario:** Como usuario de ahorros, quiero que al agregar un ahorro la información se muestre en un popup modal, para tener una experiencia consistente con el resto de la aplicación.

#### Criterios de Aceptación

1. WHEN un usuario hace clic en "Nuevo Ahorro" en SavingsPage, THE Popup_Ahorro SHALL mostrarse como ventana modal en lugar del formulario inline actual
2. WHEN el Popup_Ahorro se muestra, THE Popup_Ahorro SHALL contener: selector de línea presupuestaria, campo de descripción, y campos numéricos para cada mes (M1 a M12) con el total calculado
3. WHEN el usuario confirma la creación en el Popup_Ahorro, THE Sistema SHALL crear el ahorro y cerrar el popup
4. WHEN el usuario cancela o cierra el Popup_Ahorro, THE Sistema SHALL descartar los datos y cerrar el popup sin crear el ahorro

### Requisito 5: Popup para creación de diferidos

**Historia de Usuario:** Como usuario de diferidos, quiero que al agregar un diferido la información se muestre en un popup modal, para tener una experiencia consistente con el resto de la aplicación.

#### Criterios de Aceptación

1. WHEN un usuario hace clic en "Nuevo Diferido" en DeferralsPage, THE Popup_Diferido SHALL mostrarse como ventana modal en lugar del formulario inline actual
2. WHEN el Popup_Diferido se muestra, THE Popup_Diferido SHALL contener: buscador de línea presupuestaria, campo de descripción, monto total, mes de inicio y mes de fin
3. WHEN el usuario confirma la creación en el Popup_Diferido, THE Sistema SHALL crear el diferido y cerrar el popup
4. WHEN el usuario cancela o cierra el Popup_Diferido, THE Sistema SHALL descartar los datos y cerrar el popup sin crear el diferido
