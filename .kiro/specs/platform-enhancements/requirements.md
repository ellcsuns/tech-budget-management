# Documento de Requisitos: Mejoras de Plataforma

## Introducción

Este documento define los requisitos para cinco mejoras principales de la plataforma Tech Budget Management: internacionalización (i18n) con soporte para inglés y español, personalización de UI/UX con colores y logo, presupuesto vigente por defecto, comparación de presupuestos, y reportes detallados con exportación a Excel. Estas mejoras buscan hacer la plataforma más accesible, personalizable y funcional para la gestión de presupuestos tecnológicos.

## Glosario

- **Sistema_i18n**: Módulo de internacionalización que gestiona las traducciones de textos del sistema entre inglés y español
- **Tabla_Traducciones**: Modelo de base de datos que almacena todas las traducciones del sistema organizadas por clave y locale
- **Locale**: Identificador del idioma activo (es = español, en = inglés)
- **Configuración_Global**: Variable de configuración almacenada en la base de datos que define el idioma activo del sistema
- **Motor_Temas**: Componente frontend que aplica los colores del tema seleccionado a toda la interfaz
- **Preview_Tema**: Popup que muestra una vista previa de cómo se vería la interfaz con los colores seleccionados
- **Logo_Plataforma**: Imagen SVG del logo principal del sistema con estilo outline/degradé
- **Presupuesto_Vigente**: La versión más reciente del presupuesto para el año actual, determinada por la fecha de creación más reciente
- **Servicio_Presupuesto_Vigente**: Lógica backend que identifica y retorna automáticamente el presupuesto vigente
- **Comparador_Presupuestos**: Módulo que permite seleccionar dos presupuestos del mismo año y visualizar sus diferencias
- **Vista_Diferencias**: Interfaz gráfica que muestra las diferencias entre dos presupuestos a nivel de totales, filas y detalles
- **Generador_Reportes**: Módulo que genera reportes detallados con filtros y exportación a Excel
- **Reporte_Detallado**: Tabla de datos con filtros específicos que puede exportarse a formato Excel (XLSX)

## Requisitos

### Requisito 1: Configuración de Idioma Global

**Historia de Usuario:** Como administrador del sistema, quiero configurar el idioma global de la plataforma, para que todos los usuarios vean la interfaz en el idioma seleccionado.

#### Criterios de Aceptación

1. THE Configuración_Global SHALL almacenar el locale activo del sistema con valores posibles "es" o "en"
2. WHEN un administrador cambia el locale en la página de configuración, THE Sistema_i18n SHALL actualizar el idioma de toda la interfaz sin recargar la página
3. WHEN el sistema se inicia por primera vez, THE Configuración_Global SHALL establecer "es" (español) como locale por defecto
4. WHEN el locale cambia, THE Sistema_i18n SHALL persistir la selección en la base de datos para que aplique a todas las sesiones

### Requisito 2: Tabla de Traducciones

**Historia de Usuario:** Como administrador del sistema, quiero un módulo de traducciones donde se almacenen todos los textos del sistema, para mantener versiones en ambos idiomas de forma centralizada.

#### Criterios de Aceptación

1. THE Tabla_Traducciones SHALL almacenar cada traducción con una clave única, el texto en español y el texto en inglés
2. WHEN se crea una nueva entrada en la Tabla_Traducciones, THE Sistema_i18n SHALL requerir que la clave sea única y no vacía
3. WHEN se consulta una traducción por clave y locale, THE Sistema_i18n SHALL retornar el texto correspondiente al locale activo
4. WHEN una clave de traducción no existe en la Tabla_Traducciones, THE Sistema_i18n SHALL retornar la clave como texto de respaldo
5. WHEN el sistema se despliega inicialmente, THE Tabla_Traducciones SHALL contener todas las traducciones existentes de menús, etiquetas, botones y mensajes del sistema

### Requisito 3: Edición de Traducciones desde la UI

**Historia de Usuario:** Como administrador del sistema, quiero editar las traducciones desde la interfaz, para poder corregir o actualizar textos sin modificar código.

#### Criterios de Aceptación

1. WHEN un administrador accede a la sección de traducciones, THE Sistema_i18n SHALL mostrar una tabla paginada con todas las traducciones existentes
2. WHEN un administrador busca una traducción, THE Sistema_i18n SHALL filtrar las traducciones por clave o por texto en cualquier idioma
3. WHEN un administrador edita una traducción existente, THE Sistema_i18n SHALL actualizar el texto y reflejar el cambio en la interfaz
4. WHEN un administrador crea una nueva traducción, THE Sistema_i18n SHALL validar que la clave sea única antes de guardar
5. IF un administrador intenta guardar una traducción con clave duplicada, THEN THE Sistema_i18n SHALL mostrar un mensaje de error descriptivo

### Requisito 4: Integración de i18n en Componentes Frontend

**Historia de Usuario:** Como usuario del sistema, quiero que todos los textos de la interfaz se muestren en el idioma configurado, para poder usar la plataforma en mi idioma preferido.

#### Criterios de Aceptación

1. THE Sistema_i18n SHALL proveer una función de traducción `t(clave)` accesible desde cualquier componente React
2. WHEN un componente renderiza texto, THE Sistema_i18n SHALL resolver la clave de traducción al texto del locale activo
3. WHEN el locale cambia dinámicamente, THE Sistema_i18n SHALL re-renderizar todos los componentes que usan traducciones
4. THE Sistema_i18n SHALL cargar las traducciones desde el backend al iniciar la aplicación y almacenarlas en un contexto React
5. WHEN las traducciones se cargan desde el backend, THE Sistema_i18n SHALL agruparlas en un mapa de clave-valor indexado por locale para acceso eficiente

### Requisito 5: Aplicación de Colores del Tema

**Historia de Usuario:** Como usuario del sistema, quiero que los colores seleccionados en configuración se apliquen a toda la interfaz, para personalizar la apariencia de la plataforma.

#### Criterios de Aceptación

1. WHEN un usuario selecciona un tema de colores en la página de configuración, THE Motor_Temas SHALL aplicar los colores primario, sidebar y acento a toda la interfaz
2. WHEN los colores del tema cambian, THE Motor_Temas SHALL actualizar las variables CSS del documento raíz
3. WHEN la aplicación se recarga, THE Motor_Temas SHALL restaurar el último tema seleccionado desde el almacenamiento local
4. THE Motor_Temas SHALL aplicar los colores del tema a botones, barras laterales, encabezados, iconos y elementos interactivos

### Requisito 6: Preview de Tema con Popup

**Historia de Usuario:** Como usuario del sistema, quiero ver una vista previa de cómo se vería la interfaz con los colores seleccionados antes de aplicarlos, para tomar una decisión informada.

#### Criterios de Aceptación

1. WHEN un usuario pasa el cursor sobre un tema en la página de configuración, THE Preview_Tema SHALL mostrar un popup con una vista previa de la interfaz
2. WHEN el Preview_Tema se muestra, THE Preview_Tema SHALL renderizar ejemplos de botones, listas, iconos y barras laterales con los colores del tema
3. WHEN un usuario mueve el cursor fuera del tema, THE Preview_Tema SHALL cerrar el popup de vista previa
4. THE Preview_Tema SHALL mostrar la vista previa sin afectar los colores actuales de la interfaz hasta que el usuario confirme la selección

### Requisito 7: Estilo de Iconos Outline/Degradé

**Historia de Usuario:** Como diseñador del sistema, quiero que todos los iconos sigan un estilo outline consistente, para mantener una identidad visual coherente.

#### Criterios de Aceptación

1. THE Sistema SHALL utilizar iconos de estilo outline (contorno) en toda la interfaz, reemplazando los emojis actuales
2. THE Sistema SHALL permitir que los iconos utilicen colores en degradé que se adapten al tema activo
3. WHEN el tema cambia, THE Motor_Temas SHALL actualizar los colores de los iconos para que coincidan con el esquema de colores del tema activo
4. THE Sistema SHALL incluir un logo principal de la plataforma con estilo outline/degradé que se muestre en la barra lateral

### Requisito 8: Presupuesto Vigente por Defecto

**Historia de Usuario:** Como usuario del sistema, quiero que todas las secciones (excepto presupuestos) muestren automáticamente la información del presupuesto vigente, para no tener que seleccionarlo manualmente cada vez.

#### Criterios de Aceptación

1. THE Servicio_Presupuesto_Vigente SHALL identificar el presupuesto vigente como la versión más reciente del año actual basándose en la fecha de creación
2. WHEN un usuario accede a cualquier sección excepto la de presupuestos, THE Sistema SHALL cargar automáticamente los datos del presupuesto vigente
3. WHEN no existe un presupuesto para el año actual, THE Servicio_Presupuesto_Vigente SHALL retornar el presupuesto más reciente disponible
4. WHEN el presupuesto vigente se determina, THE Sistema SHALL mostrar la información del presupuesto vigente (año y versión) en un indicador visible en la interfaz
5. WHEN un usuario está en la sección de presupuestos, THE Sistema SHALL permitir seleccionar cualquier presupuesto sin restricción de vigencia

### Requisito 9: Selección de Presupuestos para Comparación

**Historia de Usuario:** Como gestor de presupuestos, quiero seleccionar dos presupuestos del mismo año para compararlos, para entender las diferencias entre versiones.

#### Criterios de Aceptación

1. WHEN un usuario accede a la opción "Comparar Presupuestos" dentro del menú de presupuestos, THE Comparador_Presupuestos SHALL mostrar una interfaz de selección con dos selectores de presupuesto
2. WHEN un usuario selecciona un año, THE Comparador_Presupuestos SHALL filtrar los presupuestos disponibles para mostrar solo los de ese año
3. WHEN un usuario selecciona dos presupuestos del mismo año, THE Comparador_Presupuestos SHALL habilitar el botón de comparación
4. IF un usuario intenta comparar presupuestos de años diferentes, THEN THE Comparador_Presupuestos SHALL deshabilitar el botón de comparación y mostrar un mensaje indicando que deben ser del mismo año

### Requisito 10: Vista de Diferencias Generales

**Historia de Usuario:** Como gestor de presupuestos, quiero ver las diferencias de totales e indicadores generales entre dos presupuestos, para tener una visión rápida de los cambios.

#### Criterios de Aceptación

1. WHEN se comparan dos presupuestos, THE Vista_Diferencias SHALL mostrar tarjetas resumen con el total presupuestado de cada versión y la diferencia absoluta y porcentual
2. WHEN se comparan dos presupuestos, THE Vista_Diferencias SHALL mostrar un gráfico de barras comparativo de los totales mensuales de ambas versiones
3. WHEN se comparan dos presupuestos, THE Vista_Diferencias SHALL mostrar indicadores de gastos nuevos, gastos eliminados y gastos modificados entre versiones
4. WHEN la diferencia entre versiones es positiva, THE Vista_Diferencias SHALL mostrar el indicador en color verde; WHEN es negativa, en color rojo

### Requisito 11: Vista de Diferencias a Nivel de Filas y Detalles

**Historia de Usuario:** Como gestor de presupuestos, quiero ver las diferencias detalladas a nivel de cada gasto y mes, para entender exactamente qué cambió entre versiones.

#### Criterios de Aceptación

1. WHEN se comparan dos presupuestos, THE Vista_Diferencias SHALL mostrar una tabla con cada gasto y sus valores mensuales de ambas versiones lado a lado
2. WHEN un valor mensual difiere entre versiones, THE Vista_Diferencias SHALL resaltar la celda con un color indicativo (verde para aumento, rojo para disminución)
3. WHEN un gasto existe solo en una versión, THE Vista_Diferencias SHALL marcar la fila completa como "nuevo" o "eliminado" con un indicador visual
4. WHEN un usuario solicita la descripción a detalle, THE Vista_Diferencias SHALL generar un listado en texto de todas las diferencias encontradas con explicación de cada cambio
5. THE Vista_Diferencias SHALL calcular la diferencia absoluta y porcentual para cada celda que difiera entre versiones

### Requisito 12: Listado de Reportes Detallados

**Historia de Usuario:** Como gestor de presupuestos, quiero acceder a reportes detallados relevantes para la gestión de presupuesto tecnológico, para analizar la información desde diferentes perspectivas.

#### Criterios de Aceptación

1. WHEN un usuario accede a la sección "Reportes Detallados", THE Generador_Reportes SHALL mostrar un listado de 10 reportes disponibles con nombre y descripción
2. THE Generador_Reportes SHALL incluir los siguientes reportes: (1) Resumen Ejecutivo de Presupuesto, (2) Ejecución Presupuestaria por Gasto, (3) Comparativo Plan vs Real por Mes, (4) Gastos por Empresa Financiera, (5) Gastos por Dirección Tecnológica, (6) Gastos por Área Usuaria, (7) Transacciones Detalladas por Período, (8) Análisis de Variaciones, (9) Reporte de Ahorros y Diferidos, (10) Proyección de Cierre Anual
3. WHEN un usuario selecciona un reporte, THE Generador_Reportes SHALL mostrar los filtros correspondientes al reporte seleccionado

### Requisito 13: Filtros y Visualización de Reportes

**Historia de Usuario:** Como gestor de presupuestos, quiero aplicar filtros a los reportes y ver la información en tabla, para analizar datos específicos de forma estructurada.

#### Criterios de Aceptación

1. WHEN un usuario aplica filtros a un reporte, THE Generador_Reportes SHALL actualizar la tabla de resultados con los datos filtrados
2. WHEN se muestra un reporte, THE Generador_Reportes SHALL renderizar los datos en una tabla con columnas apropiadas al tipo de reporte
3. WHEN un reporte no tiene datos para los filtros seleccionados, THE Generador_Reportes SHALL mostrar un mensaje indicando que no se encontraron resultados
4. THE Generador_Reportes SHALL incluir filtros de presupuesto, rango de meses, empresa financiera, dirección tecnológica y área usuaria según corresponda a cada reporte

### Requisito 14: Exportación de Reportes a Excel

**Historia de Usuario:** Como gestor de presupuestos, quiero descargar los reportes en formato Excel, para compartirlos y analizarlos fuera de la plataforma.

#### Criterios de Aceptación

1. WHEN un usuario hace clic en "Descargar Excel" en un reporte, THE Generador_Reportes SHALL generar un archivo XLSX con los datos del reporte actual
2. WHEN se genera el archivo Excel, THE Generador_Reportes SHALL incluir encabezados de columna, formato numérico apropiado y el nombre del reporte como título
3. WHEN se genera el archivo Excel, THE Generador_Reportes SHALL aplicar los filtros activos al momento de la descarga
4. WHEN se descarga el archivo, THE Generador_Reportes SHALL nombrar el archivo con el formato "reporte_{nombre}_{fecha}.xlsx"
5. THE Generador_Reportes SHALL generar el archivo Excel en el frontend utilizando una librería como xlsx o exceljs
