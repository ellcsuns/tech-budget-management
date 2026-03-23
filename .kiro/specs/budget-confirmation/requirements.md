# Documento de Requerimientos — Confirmación de Presupuesto

## Introducción

Este feature implementa un sistema de confirmación/revisión de presupuesto dentro de InvestIQ. Permite al administrador solicitar a los usuarios que confirmen (den visto bueno) a sus líneas de presupuesto asignadas. Se crea un flujo completo de tracking con transacciones de confirmación, notificaciones y recordatorios.

## Glosario

- **Sistema**: La aplicación InvestIQ (backend + frontend)
- **Administrador**: Usuario con rol de administrador y permiso `budget-confirmation` de tipo `MODIFY`
- **Usuario_Asignado**: Usuario que tiene líneas de presupuesto asignadas a través de sus userAreas
- **Solicitud_de_Confirmación**: Registro maestro que representa un pedido masivo o individual de confirmación de líneas de presupuesto, creado por el Administrador
- **Respuesta_de_Confirmación**: Registro individual de la respuesta de un Usuario_Asignado a una Solicitud_de_Confirmación
- **TopBar**: Barra superior de la aplicación que contiene notificaciones y acciones del usuario
- **BudgetsPage**: Página principal de presupuestos donde los usuarios ven y gestionan líneas de presupuesto
- **Popup_de_Declaración**: Diálogo modal que solicita al usuario declarar que sus líneas de presupuesto están correctas
- **Panel_de_Confirmación**: Sección dentro de BudgetsPage visible solo para el Administrador para gestionar solicitudes de confirmación

## Requerimientos

### Requerimiento 1: Creación de Solicitud de Confirmación Masiva

**User Story:** Como administrador, quiero poder solicitar masivamente la confirmación de líneas de presupuesto a todos los usuarios asignados, para que cada uno valide sus líneas.

#### Criterios de Aceptación

1. WHILE el Administrador se encuentra en el Panel_de_Confirmación, THE Sistema SHALL mostrar un botón "Solicitar Confirmación Masiva" que dispare la creación de una Solicitud_de_Confirmación para todos los Usuario_Asignado del presupuesto activo
2. WHEN el Administrador presiona "Solicitar Confirmación Masiva", THE Sistema SHALL crear una Solicitud_de_Confirmación con un identificador único (UUID), la fecha de creación, el ID del Administrador que la disparó y el ID del presupuesto asociado
3. WHEN se crea una Solicitud_de_Confirmación masiva, THE Sistema SHALL generar una Respuesta_de_Confirmación con estado "PENDING" para cada Usuario_Asignado que tenga al menos una línea de presupuesto asignada

### Requerimiento 2: Creación de Solicitud de Confirmación Individual

**User Story:** Como administrador, quiero poder solicitar la confirmación de líneas de presupuesto a un usuario específico, para tener control granular del proceso.

#### Criterios de Aceptación

1. WHILE el Administrador se encuentra en el Panel_de_Confirmación, THE Sistema SHALL mostrar una lista de usuarios con líneas de presupuesto asignadas y un botón "Solicitar" junto a cada uno
2. WHEN el Administrador presiona "Solicitar" junto a un Usuario_Asignado específico, THE Sistema SHALL crear una Solicitud_de_Confirmación con un identificador único, fecha de creación, ID del Administrador y una única Respuesta_de_Confirmación para ese Usuario_Asignado
3. IF ya existe una Solicitud_de_Confirmación pendiente para el mismo Usuario_Asignado en el mismo presupuesto, THEN THE Sistema SHALL mostrar un mensaje de advertencia indicando que ya existe una solicitud pendiente para ese usuario

### Requerimiento 3: Tracking de Solicitudes de Confirmación (Vista Administrador)

**User Story:** Como administrador, quiero ver el estado de todas las solicitudes de confirmación, para saber quién confirmó y quién no.

#### Criterios de Aceptación

1. WHILE el Administrador se encuentra en el Panel_de_Confirmación, THE Sistema SHALL mostrar una tabla con todas las Solicitud_de_Confirmación, incluyendo: ID, fecha de creación, tipo (masiva/individual), cantidad de respuestas confirmadas vs pendientes
2. WHEN el Administrador selecciona una Solicitud_de_Confirmación, THE Sistema SHALL mostrar el detalle con la lista de cada Usuario_Asignado, su estado (PENDING/CONFIRMED), y la fecha y hora de confirmación si aplica
3. THE Panel_de_Confirmación SHALL ser accesible únicamente para usuarios con permiso `budget-confirmation` de tipo `MODIFY`

### Requerimiento 4: Confirmación por parte del Usuario

**User Story:** Como usuario asignado, quiero poder confirmar mis líneas de presupuesto cuando me lo soliciten, para dejar constancia de mi visto bueno.

#### Criterios de Aceptación

1. WHEN un Usuario_Asignado accede a la sección de presupuestos y tiene una Respuesta_de_Confirmación con estado "PENDING", THE Sistema SHALL mostrar un indicador visual de confirmación pendiente junto a un botón "Confirmar Presupuesto"
2. WHEN el Usuario_Asignado presiona "Confirmar Presupuesto", THE Sistema SHALL mostrar el Popup_de_Declaración con el texto "Declaro que todas mis líneas de presupuesto están correctas" y botones "Confirmar" y "Cancelar"
3. WHEN el Usuario_Asignado presiona "Confirmar" en el Popup_de_Declaración, THE Sistema SHALL actualizar la Respuesta_de_Confirmación a estado "CONFIRMED", registrar la fecha y hora de confirmación, y registrar el ID del Usuario_Asignado que confirmó
4. WHEN la confirmación se registra exitosamente, THE Sistema SHALL mostrar un mensaje de éxito y ocultar el indicador de confirmación pendiente

### Requerimiento 5: Notificación en TopBar

**User Story:** Como usuario asignado, quiero ver en mis notificaciones que tengo una confirmación de presupuesto pendiente, para no olvidarme de realizarla.

#### Criterios de Aceptación

1. WHILE un Usuario_Asignado tiene al menos una Respuesta_de_Confirmación con estado "PENDING", THE Sistema SHALL mostrar un indicador numérico (badge) en el ícono de notificaciones del TopBar con la cantidad de confirmaciones pendientes
2. WHEN el Usuario_Asignado hace clic en el indicador de confirmaciones pendientes en el TopBar, THE Sistema SHALL navegar a la sección de presupuestos donde puede realizar la confirmación

### Requerimiento 6: Popup Recordatorio al Ingresar a Presupuestos

**User Story:** Como usuario asignado, quiero recibir un recordatorio al ingresar a la sección de presupuestos si tengo confirmaciones pendientes, para que no se me pase confirmar.

#### Criterios de Aceptación

1. WHEN un Usuario_Asignado ingresa a BudgetsPage y tiene al menos una Respuesta_de_Confirmación con estado "PENDING", THE Sistema SHALL mostrar automáticamente un popup modal recordándole que tiene una solicitud de confirmación de presupuesto pendiente
2. THE popup recordatorio SHALL incluir un botón "Ir a Confirmar" que despliegue el flujo de confirmación y un botón "Recordar más tarde" que cierre el popup
3. THE popup recordatorio SHALL mostrarse una sola vez por sesión de navegación para evitar ser intrusivo

### Requerimiento 7: Permisos y Seguridad

**User Story:** Como administrador del sistema, quiero que el acceso al panel de confirmación esté protegido por permisos, para que solo usuarios autorizados puedan gestionar solicitudes.

#### Criterios de Aceptación

1. THE Sistema SHALL registrar un nuevo código de menú `budget-confirmation` en el sistema de permisos
2. THE Sistema SHALL requerir permiso `budget-confirmation` con tipo `MODIFY` para crear Solicitud_de_Confirmación
3. THE Sistema SHALL requerir permiso `budget-confirmation` con tipo `VIEW` para ver el Panel_de_Confirmación y el tracking de solicitudes
4. THE Sistema SHALL permitir a cualquier usuario autenticado consultar sus propias Respuesta_de_Confirmación pendientes sin permisos adicionales

### Requerimiento 8: API Backend para Confirmaciones

**User Story:** Como desarrollador, quiero endpoints REST bien definidos para gestionar el ciclo de vida de las confirmaciones de presupuesto.

#### Criterios de Aceptación

1. THE Sistema SHALL exponer un endpoint POST `/api/budget-confirmations` para crear una Solicitud_de_Confirmación (masiva o individual)
2. THE Sistema SHALL exponer un endpoint GET `/api/budget-confirmations` para listar todas las Solicitud_de_Confirmación con sus estadísticas
3. THE Sistema SHALL exponer un endpoint GET `/api/budget-confirmations/:id` para obtener el detalle de una Solicitud_de_Confirmación con todas sus Respuesta_de_Confirmación
4. THE Sistema SHALL exponer un endpoint POST `/api/budget-confirmations/:id/confirm` para que un Usuario_Asignado confirme su Respuesta_de_Confirmación
5. THE Sistema SHALL exponer un endpoint GET `/api/budget-confirmations/my-pending` para que un usuario obtenga sus confirmaciones pendientes
6. THE Sistema SHALL exponer un endpoint GET `/api/budget-confirmations/pending-count` para obtener la cantidad de confirmaciones pendientes del usuario autenticado
