# Documento de Requisitos

## Introducción

Sistema de gestión de presupuesto tecnológico full-stack que permite administrar gastos organizados en una estructura jerárquica de árbol. El sistema maneja múltiples versiones de presupuesto por año, con seguimiento de valores planificados, comprometidos y reales, incluyendo conversión automática de monedas y visualizaciones tabulares configurables.

## Glosario

- **Sistema**: La aplicación completa de gestión de presupuesto tecnológico
- **Presupuesto**: Conjunto de gastos para un año específico con una versión determinada
- **Gasto**: Línea de presupuesto con metadatos configurables y valores monetarios
- **Valor_Plan**: Proyección de gasto para una línea de presupuesto
- **Valor_Comprometido**: Gasto contratado pero no entregado, modelado como transacciones
- **Valor_Real**: Gasto contratado y entregado
- **Transacción**: Registro individual de gasto comprometido o real con fecha y referencia
- **Versión**: Instancia específica de presupuesto para un año con configuración propia
- **Módulo_Conversión**: Componente que gestiona tasas de cambio mensuales por versión
- **Datos_Maestros**: Datos de configuración reutilizables (direcciones tecnológicas, áreas de usuario, empresas financieras)
- **Sistema_Etiquetas**: Mecanismo para campos de metadatos configurables con formato, entrada libre o lista seleccionable
- **Tabla_Gastos**: Visualización principal de gastos con valores mensuales
- **Filtro_Moneda**: Control para filtrar gastos por moneda de transacción
- **Filtro_Empresa**: Control para filtrar gastos por empresa financiera
- **Popup_Detalle**: Ventana emergente que muestra metadatos completos de un gasto

## Requisitos

### Requisito 1: Gestión de Estructura de Presupuesto

**Historia de Usuario:** Como administrador de presupuesto, quiero crear y gestionar presupuestos con estructura jerárquica, para organizar gastos por año y versión.

#### Criterios de Aceptación

1. CUANDO se crea un presupuesto, EL Sistema DEBERÁ asignar un año y una versión únicos
2. CUANDO se consulta un presupuesto, EL Sistema DEBERÁ retornar todos los gastos asociados con su estructura jerárquica
3. PARA cualquier año, EL Sistema DEBERÁ permitir múltiples versiones con gastos independientes
4. CUANDO se crea una versión, EL Sistema DEBERÁ inicializar el Módulo_Conversión para esa versión

### Requisito 2: Gestión de Gastos y Metadatos

**Historia de Usuario:** Como usuario del sistema, quiero definir gastos con metadatos configurables, para capturar toda la información relevante de cada línea presupuestaria.

#### Criterios de Aceptación

1. CUANDO se crea un gasto, EL Sistema DEBERÁ requerir código, descripción corta, descripción larga, dirección tecnológica, áreas de usuario y empresa financiera
2. CUANDO se asignan direcciones tecnológicas, EL Sistema DEBERÁ permitir selección múltiple desde Datos_Maestros configurables
3. CUANDO se asignan áreas de usuario, EL Sistema DEBERÁ permitir selección múltiple desde Datos_Maestros configurables
4. CUANDO se asigna empresa financiera, EL Sistema DEBERÁ permitir selección única desde tabla configurable
5. CUANDO se agregan campos adicionales, EL Sistema_Etiquetas DEBERÁ permitir definir formato, entrada libre o lista seleccionable
6. PARA todos los gastos en una versión, EL Sistema DEBERÁ mantener campos de metadatos consistentes

### Requisito 3: Gestión de Valores Plan

**Historia de Usuario:** Como planificador financiero, quiero cargar proyecciones mensuales de gastos, para establecer el presupuesto planificado del año.

#### Criterios de Aceptación

1. CUANDO se carga un Valor_Plan, EL Sistema DEBERÁ permitir ingresar valores para los 12 meses del año
2. CUANDO se calcula el total de un Valor_Plan, EL Sistema DEBERÁ sumar los valores de los 12 meses
3. CUANDO se ingresa un valor mensual, EL Sistema DEBERÁ permitir valor cero
4. CUANDO se almacena un Valor_Plan, EL Sistema DEBERÁ registrar moneda de transacción, valor en USD y tasa de conversión

### Requisito 4: Gestión de Valores Comprometidos y Reales

**Historia de Usuario:** Como controlador financiero, quiero registrar transacciones de gastos comprometidos y reales, para rastrear ejecución presupuestaria contra contratos.

#### Criterios de Aceptación

1. CUANDO se crea una Transacción, EL Sistema DEBERÁ requerir ID de gasto, fecha de servicio, fecha de contabilización, número de documento de referencia y enlace a plataforma externa
2. CUANDO se registran múltiples transacciones para un mes, EL Sistema DEBERÁ usar el número de documento de referencia como identificador único
3. CUANDO se calcula el Valor_Comprometido mensual, EL Sistema DEBERÁ sumar todas las transacciones comprometidas del mes para ese gasto
4. CUANDO se calcula el Valor_Real mensual, EL Sistema DEBERÁ sumar todas las transacciones reales del mes para ese gasto
5. CUANDO se almacena una Transacción, EL Sistema DEBERÁ registrar moneda de transacción, valor en USD y tasa de conversión del mes

### Requisito 5: Conversión de Monedas

**Historia de Usuario:** Como analista financiero, quiero que el sistema convierta automáticamente valores a USD, para consolidar reportes en moneda única.

#### Criterios de Aceptación

1. CUANDO se ingresa un valor en moneda de transacción, EL Módulo_Conversión DEBERÁ convertir automáticamente a USD usando la tasa del mes correspondiente
2. CUANDO se almacena un valor monetario, EL Sistema DEBERÁ guardar valor en moneda original, valor en USD y tasa de conversión aplicada
3. PARA cada versión, EL Módulo_Conversión DEBERÁ mantener tasas de cambio mensuales independientes
4. CUANDO se consulta el historial de conversión, EL Sistema DEBERÁ retornar las tasas aplicadas por mes y versión

### Requisito 6: Visualización de Tabla de Valores Plan

**Historia de Usuario:** Como usuario del sistema, quiero ver una tabla con valores plan mensuales por gasto, para analizar proyecciones presupuestarias.

#### Criterios de Aceptación

1. CUANDO se muestra la Tabla_Gastos en modo plan, EL Sistema DEBERÁ mostrar columnas para gasto, categoría, 12 meses y total
2. CUANDO se calcula el total de una fila, EL Sistema DEBERÁ sumar los valores de los 12 meses
3. CUANDO un mes no tiene valor, EL Sistema DEBERÁ mostrar celda vacía
4. CUANDO se aplica un filtro de columna, EL Sistema DEBERÁ actualizar la tabla mostrando solo filas que cumplan el criterio

### Requisito 7: Visualización de Tabla de Valores Comprometidos y Reales

**Historia de Usuario:** Como controlador de presupuesto, quiero ver una tabla comparativa de valores presupuestados, comprometidos y reales por mes, para monitorear ejecución presupuestaria.

#### Criterios de Aceptación

1. CUANDO se muestra la tabla comparativa, EL Sistema DEBERÁ mostrar columnas agrupadas por mes con sub-columnas Presupuesto, Comprometido y Real
2. CUANDO se muestra una fila de gasto, EL Sistema DEBERÁ incluir descripción corta y categoría
3. CUANDO se activa un checkbox de encabezado, EL Sistema DEBERÁ mostrar u ocultar las columnas correspondientes (Presupuesto/Comprometido/Real)
4. CUANDO se aplica un filtro de columna, EL Sistema DEBERÁ actualizar la tabla mostrando solo filas que cumplan el criterio

### Requisito 8: Filtros de Moneda y Empresa Financiera

**Historia de Usuario:** Como analista de presupuesto, quiero filtrar gastos por moneda y empresa financiera, para analizar subconjuntos específicos del presupuesto.

#### Criterios de Aceptación

1. CUANDO se aplica el Filtro_Moneda, EL Sistema DEBERÁ mostrar solo gastos con transacciones en la moneda seleccionada
2. CUANDO se aplica el Filtro_Empresa, EL Sistema DEBERÁ mostrar solo gastos asociados a la empresa financiera seleccionada
3. CUANDO se aplican múltiples filtros, EL Sistema DEBERÁ aplicar operación AND entre criterios
4. CUANDO se limpia un filtro, EL Sistema DEBERÁ restaurar la vista completa de gastos

### Requisito 9: Configuración de Datos Maestros

**Historia de Usuario:** Como administrador del sistema, quiero configurar datos maestros reutilizables, para mantener consistencia en la clasificación de gastos.

#### Criterios de Aceptación

1. CUANDO se accede a la sección de configuración, EL Sistema DEBERÁ permitir gestionar direcciones tecnológicas, áreas de usuario y empresas financieras
2. CUANDO se crea un elemento de Datos_Maestros, EL Sistema DEBERÁ validar unicidad del identificador
3. CUANDO se modifica un elemento de Datos_Maestros, EL Sistema DEBERÁ actualizar referencias en gastos existentes
4. CUANDO se elimina un elemento de Datos_Maestros, EL Sistema DEBERÁ prevenir eliminación si está en uso por gastos existentes

### Requisito 10: Visualización de Transacciones

**Historia de Usuario:** Como auditor financiero, quiero ver tablas detalladas de transacciones plan y reales, para revisar el detalle de cada movimiento presupuestario.

#### Criterios de Aceptación

1. CUANDO se accede a la sección de valores plan, EL Sistema DEBERÁ mostrar tabla con todos los Valor_Plan por gasto y mes
2. CUANDO se accede a la sección de valores reales, EL Sistema DEBERÁ mostrar tabla con todas las Transacciones incluyendo fecha de servicio, fecha de contabilización, número de documento y enlace externo
3. CUANDO se selecciona un gasto específico, EL Sistema DEBERÁ filtrar transacciones para mostrar solo las del gasto seleccionado
4. CUANDO se ordena por columna, EL Sistema DEBERÁ reordenar las transacciones según el criterio seleccionado

### Requisito 11: Visualización de Metadatos de Gasto

**Historia de Usuario:** Como usuario del sistema, quiero ver todos los metadatos y configuraciones de un gasto, para entender completamente su clasificación y propósito.

#### Criterios de Aceptación

1. CUANDO se accede a la sección de metadatos, EL Sistema DEBERÁ mostrar todos los campos base y campos configurables del gasto
2. CUANDO se muestra un campo multi-selección, EL Sistema DEBERÁ listar todos los valores seleccionados
3. CUANDO se muestra un campo de Sistema_Etiquetas, EL Sistema DEBERÁ mostrar el valor según su formato configurado
4. CUANDO se actualiza un metadato, EL Sistema DEBERÁ validar el formato según la configuración del campo

### Requisito 12: Popup de Detalle de Gasto

**Historia de Usuario:** Como usuario del sistema, quiero ver un popup con detalles completos al hacer clic en un gasto, para acceder rápidamente a información detallada sin cambiar de vista.

#### Criterios de Aceptación

1. CUANDO se hace clic en un gasto en la Tabla_Gastos, EL Sistema DEBERÁ mostrar el Popup_Detalle
2. CUANDO se muestra el Popup_Detalle, EL Sistema DEBERÁ incluir todos los metadatos base del gasto
3. CUANDO se muestra el Popup_Detalle, EL Sistema DEBERÁ incluir todos los campos configurables del Sistema_Etiquetas
4. CUANDO se cierra el Popup_Detalle, EL Sistema DEBERÁ retornar a la vista de tabla sin perder el estado de filtros

### Requisito 13: Arquitectura Backend con Node.js y Prisma

**Historia de Usuario:** Como desarrollador del sistema, quiero una arquitectura backend desacoplada con Node.js y Prisma ORM, para facilitar mantenimiento y escalabilidad.

#### Criterios de Aceptación

1. CUANDO se implementa una API, EL Sistema DEBERÁ usar Node.js como runtime
2. CUANDO se accede a la base de datos, EL Sistema DEBERÁ usar Prisma ORM como capa de abstracción
3. CUANDO se define un modelo de datos, EL Sistema DEBERÁ usar el esquema de Prisma
4. CUANDO se ejecutan migraciones, EL Sistema DEBERÁ usar las herramientas de Prisma para gestionar cambios de esquema

### Requisito 14: Base de Datos Relacional

**Historia de Usuario:** Como arquitecto del sistema, quiero usar una base de datos relacional costo-efectiva, para almacenar datos estructurados con integridad referencial.

#### Criterios de Aceptación

1. CUANDO se despliega el sistema, EL Sistema DEBERÁ usar PostgreSQL o MySQL como base de datos
2. CUANDO se crean relaciones entre entidades, EL Sistema DEBERÁ usar claves foráneas para integridad referencial
3. CUANDO se ejecutan consultas complejas, EL Sistema DEBERÁ aprovechar capacidades relacionales de la base de datos
4. CUANDO se realizan transacciones, EL Sistema DEBERÁ garantizar propiedades ACID

### Requisito 15: Frontend con React y Tailwind CSS

**Historia de Usuario:** Como usuario final, quiero una interfaz moderna y responsiva construida con React y Tailwind CSS, para tener una experiencia de usuario excepcional.

#### Criterios de Aceptación

1. CUANDO se renderiza la interfaz, EL Sistema DEBERÁ usar React como framework de UI
2. CUANDO se aplican estilos, EL Sistema DEBERÁ usar Tailwind CSS para diseño responsivo
3. CUANDO se interactúa con componentes, EL Sistema DEBERÁ proporcionar feedback visual inmediato
4. CUANDO se carga la aplicación en diferentes dispositivos, EL Sistema DEBERÁ adaptar el layout automáticamente

### Requisito 16: Despliegue en EC2

**Historia de Usuario:** Como ingeniero de infraestructura, quiero desplegar la aplicación en EC2, para tener control sobre el entorno de ejecución.

#### Criterios de Aceptación

1. CUANDO se despliega la aplicación, EL Sistema DEBERÁ ejecutarse en instancias EC2
2. CUANDO se configura el entorno, EL Sistema DEBERÁ separar capa de aplicación de capa de datos
3. CUANDO se escala la aplicación, EL Sistema DEBERÁ permitir agregar instancias EC2 adicionales
4. CUANDO se monitorea el sistema, EL Sistema DEBERÁ exponer métricas de salud y rendimiento

### Requisito 17: Alcance MVP - Datos Pre-cargados

**Historia de Usuario:** Como product owner, quiero un MVP funcional que asuma datos pre-cargados, para validar funcionalidad core antes de implementar interfaces de carga.

#### Criterios de Aceptación

1. PARA el MVP, EL Sistema DEBERÁ asumir que transacciones de Presupuesto y Real están pre-cargadas en tablas
2. PARA el MVP, EL Sistema DEBERÁ incluir tabla principal de gastos con layout descrito
3. PARA el MVP, EL Sistema DEBERÁ incluir filtros de moneda y empresa financiera
4. PARA el MVP, EL Sistema DEBERÁ incluir sección de configuración de Datos_Maestros
5. PARA el MVP, EL Sistema DEBERÁ incluir visualización de valores plan y reales en tablas de transacciones
6. PARA el MVP, EL Sistema DEBERÁ incluir visor de metadatos de gastos
7. PARA el MVP, EL Sistema DEBERÁ incluir Popup_Detalle de gastos
8. PARA el MVP, EL Sistema NO DEBERÁ incluir interfaces de carga de transacciones (se implementarán posteriormente)
