# Documento de Requisitos: Restricción de Edición de Meses y Compensación Parcial

## Introducción

Este documento cubre dos funcionalidades para la aplicación de gestión presupuestaria:

1. **Restricción de edición de meses en presupuesto**: Actualmente los popups de edición y creación de líneas presupuestarias permiten modificar los 12 meses (M1-M12) sin restricción. Se requiere que solo el mes actual y los meses futuros sean editables; los meses pasados deben estar deshabilitados.

2. **Compensación parcial de transacciones**: El modelo actual de compensación es 1:1 (una transacción real compensa completamente una comprometida). Se requiere un modelo N:1 donde múltiples transacciones reales puedan compensar parcialmente una comprometida, con seguimiento del monto compensado y saldo pendiente visible en todo el sistema.

## Glosario

- **Sistema**: La aplicación de gestión presupuestaria (backend + frontend)
- **Popup_Edición**: El popup modal que permite solicitar cambios en los valores mensuales de una línea presupuestaria existente
- **Popup_Agregar**: El popup modal que permite crear una nueva línea presupuestaria con valores mensuales
- **Mes_Actual**: El mes calendario actual del sistema (1-12), derivado de `new Date().getMonth() + 1`
- **Mes_Pasado**: Cualquier mes con número menor al Mes_Actual
- **Mes_Futuro**: Cualquier mes con número mayor o igual al Mes_Actual
- **Transacción_Comprometida**: Una transacción de tipo COMMITTED que representa un gasto planificado
- **Transacción_Real**: Una transacción de tipo REAL que representa un gasto ejecutado
- **Monto_Compensado**: La suma de los valores de todas las transacciones reales que compensan una transacción comprometida (campo `compensatedAmount`)
- **Saldo_Pendiente**: La diferencia entre el valor de la transacción comprometida y el Monto_Compensado (`transactionValue - compensatedAmount`)
- **Compensación_Completa**: Estado donde el Monto_Compensado es mayor o igual al valor de la Transacción_Comprometida
- **Compensación_Parcial**: Estado donde el Monto_Compensado es mayor que cero pero menor que el valor de la Transacción_Comprometida
- **Dashboard**: La vista principal que muestra totales de presupuesto, comprometido, real y diferencia
- **Línea_Presupuestaria**: Una BudgetLine que vincula un gasto con un presupuesto y empresa financiera

---

## Parte 1: Restricción de Edición de Meses en Presupuesto

### Requisito 1: Deshabilitar meses pasados en el popup de edición

**User Story:** Como usuario, quiero que los meses pasados estén deshabilitados en el popup de solicitud de cambio, para que no pueda modificar valores de meses que ya transcurrieron.

#### Criterios de Aceptación

1. WHEN el Popup_Edición se abre, THE Sistema SHALL determinar el Mes_Actual usando la fecha del sistema
2. WHEN el Popup_Edición muestra los inputs de meses M1-M12, THE Sistema SHALL deshabilitar los inputs correspondientes a meses con número menor al Mes_Actual
3. WHEN un input de mes está deshabilitado, THE Sistema SHALL mostrar el input con estilo visual de solo lectura (fondo gris, cursor no permitido)
4. WHEN el usuario envía la solicitud de cambio, THE Sistema SHALL preservar los valores originales de los meses deshabilitados sin modificación

### Requisito 2: Deshabilitar meses pasados en el popup de agregar línea

**User Story:** Como usuario, quiero que los meses pasados estén deshabilitados al agregar una nueva línea presupuestaria, para que solo pueda asignar valores a meses actuales y futuros.

#### Criterios de Aceptación

1. WHEN el Popup_Agregar se abre, THE Sistema SHALL determinar el Mes_Actual usando la fecha del sistema
2. WHEN el Popup_Agregar muestra los inputs de meses M1-M12, THE Sistema SHALL deshabilitar los inputs correspondientes a meses con número menor al Mes_Actual
3. WHEN un input de mes está deshabilitado en el Popup_Agregar, THE Sistema SHALL mantener su valor en 0 e impedir su modificación
4. WHEN el usuario crea la línea presupuestaria, THE Sistema SHALL enviar valor 0 para todos los meses deshabilitados

---

## Parte 2: Compensación Parcial de Transacciones

### Requisito 3: Modelo de datos para compensación parcial

**User Story:** Como administrador del sistema, quiero que el esquema de datos soporte múltiples transacciones reales compensando una sola comprometida, para que se pueda registrar la compensación parcial de compromisos.

#### Criterios de Aceptación

1. THE Sistema SHALL almacenar un campo compensatedAmount de tipo Decimal(15,2) con valor por defecto 0 en cada Transacción_Comprometida
2. THE Sistema SHALL permitir que múltiples transacciones reales referencien la misma Transacción_Comprometida mediante el campo compensatedById
3. WHEN el Monto_Compensado de una Transacción_Comprometida es mayor o igual a su transactionValue, THE Sistema SHALL marcar isCompensated como true
4. WHEN el Monto_Compensado de una Transacción_Comprometida es menor que su transactionValue, THE Sistema SHALL mantener isCompensated como false

### Requisito 4: Creación de transacción real con compensación parcial

**User Story:** Como usuario, quiero crear una transacción real que compense parcialmente una comprometida, para que pueda registrar pagos parciales contra compromisos existentes.

#### Criterios de Aceptación

1. WHEN un usuario crea una Transacción_Real referenciando una Transacción_Comprometida, THE Sistema SHALL sumar el valor de la Transacción_Real al compensatedAmount de la Transacción_Comprometida
2. WHEN un usuario crea una Transacción_Real cuyo valor es menor que el Saldo_Pendiente de la Transacción_Comprometida, THE Sistema SHALL mantener isCompensated en false en la Transacción_Comprometida
3. WHEN un usuario crea una Transacción_Real cuyo valor es mayor o igual al Saldo_Pendiente de la Transacción_Comprometida, THE Sistema SHALL marcar isCompensated como true en la Transacción_Comprometida
4. WHEN un usuario intenta compensar una Transacción_Comprometida que ya tiene Compensación_Completa, THE Sistema SHALL rechazar la operación con un mensaje de error descriptivo

### Requisito 5: Eliminación de transacción real compensadora

**User Story:** Como usuario, quiero que al eliminar una transacción real que compensaba parcialmente una comprometida, el saldo pendiente se recalcule correctamente.

#### Criterios de Aceptación

1. WHEN un usuario elimina una Transacción_Real que compensaba una Transacción_Comprometida, THE Sistema SHALL restar el valor de la Transacción_Real del compensatedAmount de la Transacción_Comprometida
2. WHEN después de eliminar una Transacción_Real el compensatedAmount resulta menor que el transactionValue de la Transacción_Comprometida, THE Sistema SHALL marcar isCompensated como false
3. THE Sistema SHALL garantizar que compensatedAmount no sea negativo después de una eliminación

### Requisito 6: Listado de comprometidas disponibles para compensar

**User Story:** Como usuario, quiero ver las transacciones comprometidas que aún tienen saldo pendiente por compensar, para poder seleccionar cuál compensar con una nueva transacción real.

#### Criterios de Aceptación

1. WHEN el usuario solicita las transacciones comprometidas no compensadas de una línea presupuestaria, THE Sistema SHALL retornar todas las transacciones comprometidas donde compensatedAmount sea menor que transactionValue
2. WHEN el Sistema muestra una Transacción_Comprometida disponible para compensar, THE Sistema SHALL mostrar el Saldo_Pendiente junto al valor original

### Requisito 7: Visualización en página de transacciones comprometidas

**User Story:** Como usuario, quiero ver el monto compensado y el saldo pendiente de cada transacción comprometida en la tabla de comprometidas, para tener visibilidad del estado de compensación.

#### Criterios de Aceptación

1. THE Sistema SHALL mostrar una columna de Monto_Compensado en la tabla de transacciones comprometidas
2. THE Sistema SHALL mostrar una columna de Saldo_Pendiente en la tabla de transacciones comprometidas
3. WHEN una Transacción_Comprometida tiene Compensación_Parcial, THE Sistema SHALL mostrar un badge con estado "Parcial" en color naranja
4. WHEN una Transacción_Comprometida tiene Compensación_Completa, THE Sistema SHALL mostrar un badge con estado "Sí" en color verde
5. WHEN una Transacción_Comprometida no tiene compensación, THE Sistema SHALL mostrar un badge con estado "No" en color amarillo

### Requisito 8: Visualización en el Dashboard

**User Story:** Como usuario, quiero ver el saldo pendiente por compensar en el dashboard, para tener una visión clara de cuánto del comprometido aún no se ha ejecutado.

#### Criterios de Aceptación

1. WHEN se calculan los totales de comprometido en el Dashboard, THE Sistema SHALL incluir solo el Saldo_Pendiente de cada Transacción_Comprometida (no el valor total de las parcialmente compensadas)
2. WHEN se calculan los totales por empresa financiera, THE Sistema SHALL aplicar la misma lógica de Saldo_Pendiente

### Requisito 9: Visualización en popup de detalle de línea presupuestaria

**User Story:** Como usuario, quiero ver el saldo pendiente por compensar de cada transacción comprometida en el popup de detalle, para entender el estado de compensación a nivel de línea.

#### Criterios de Aceptación

1. WHEN el popup de detalle muestra transacciones comprometidas, THE Sistema SHALL incluir columnas de Monto_Compensado y Saldo_Pendiente
2. WHEN el popup calcula el total de comprometido mensual, THE Sistema SHALL usar solo el Saldo_Pendiente de cada transacción (excluyendo la porción ya compensada)

### Requisito 10: Selección de comprometida en página de transacciones reales

**User Story:** Como usuario, quiero que al crear una transacción real desde una comprometida, el sistema me muestre el saldo pendiente y me permita ingresar un monto parcial.

#### Criterios de Aceptación

1. WHEN el picker de comprometidas muestra transacciones disponibles, THE Sistema SHALL mostrar el Saldo_Pendiente de cada una junto al valor original
2. WHEN el usuario selecciona una comprometida para compensar, THE Sistema SHALL pre-llenar el campo de valor con el Saldo_Pendiente en lugar del valor total
3. WHEN el usuario ingresa un valor mayor que el Saldo_Pendiente de la comprometida seleccionada, THE Sistema SHALL mostrar una advertencia indicando que el monto excede el saldo pendiente
