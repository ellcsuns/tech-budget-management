# Documento de Requisitos — Centro de Ayuda (Help Center)

## Introducción

El Centro de Ayuda es una nueva sección dentro de InvestIQ que proporciona documentación completa, educativa y navegable sobre todas las funcionalidades de la plataforma. Está diseñado para usuarios que necesitan entender cómo funciona cada módulo, cómo se calculan los presupuestos, cómo afectan las transacciones, y cómo interactúan los distintos componentes del sistema. La página es puramente frontend (sin cambios en backend), accesible para todos los usuarios autenticados, con soporte i18n (español e inglés), un buscador de texto, e infografías SVG inline que ilustran los conceptos clave.

## Glosario

- **Help_Center_Page**: La página principal del centro de ayuda, accesible desde el sidebar, que contiene todas las secciones de documentación.
- **Search_Bar**: Campo de texto en la parte superior del Help_Center_Page que permite filtrar el contenido por palabras clave.
- **Help_Section**: Un bloque de contenido dentro del Help_Center_Page dedicado a explicar un módulo o concepto específico de InvestIQ.
- **SVG_Infographic**: Diagrama o ilustración vectorial creado inline (como componente React SVG) que representa visualmente un concepto, flujo o pantalla de la aplicación.
- **Table_Of_Contents**: Índice lateral o superior que lista todas las Help_Sections y permite navegación rápida mediante scroll.
- **Sidebar**: Barra de navegación lateral de InvestIQ que contiene los enlaces a los módulos de la aplicación.
- **I18n_System**: Sistema de internacionalización existente en InvestIQ basado en I18nContext que gestiona traducciones por locale (es/en).
- **Authenticated_User**: Cualquier usuario que haya iniciado sesión en InvestIQ, independientemente de su rol o permisos.
- **Budget_Calculation_Section**: Help_Section específica que explica qué es un presupuesto, cómo se calculan los valores computados (base + ahorros + correcciones), y cómo las transacciones afectan al presupuesto.
- **Module_Section**: Help_Section dedicada a un módulo específico de la aplicación (Dashboard, Presupuestos, Transacciones, etc.).

## Requisitos

### Requisito 1: Acceso al Centro de Ayuda desde el Sidebar

**User Story:** Como usuario autenticado, quiero acceder al centro de ayuda desde el sidebar de navegación, para poder consultar la documentación sin salir de la aplicación.

#### Criterios de Aceptación

1. THE Sidebar SHALL mostrar un enlace al Help_Center_Page con un ícono de signo de interrogación (HiOutlineQuestionMarkCircle) visible para todo Authenticated_User.
2. WHEN un Authenticated_User hace clic en el enlace del Help_Center_Page en el Sidebar, THE Help_Center_Page SHALL renderizarse dentro del Layout principal de la aplicación.
3. THE Help_Center_Page SHALL ser accesible en la ruta `/help` sin requerir ningún permiso específico de menuCode.
4. THE Sidebar SHALL mostrar la etiqueta del enlace usando el I18n_System con la clave `menu.help` y fallback "Ayuda".

### Requisito 2: Barra de Búsqueda

**User Story:** Como usuario, quiero buscar contenido dentro del centro de ayuda escribiendo palabras clave, para encontrar rápidamente la información que necesito.

#### Criterios de Aceptación

1. THE Help_Center_Page SHALL mostrar una Search_Bar fija en la parte superior de la página.
2. WHEN un Authenticated_User escribe texto en la Search_Bar, THE Help_Center_Page SHALL filtrar las Help_Sections mostrando solo aquellas cuyo título o contenido de texto contenga las palabras ingresadas (búsqueda case-insensitive).
3. WHEN la Search_Bar está vacía, THE Help_Center_Page SHALL mostrar todas las Help_Sections.
4. WHEN la búsqueda no produce resultados, THE Help_Center_Page SHALL mostrar un mensaje indicando que no se encontraron resultados con el texto "No se encontraron resultados para '[término]'" localizado mediante el I18n_System.
5. THE Search_Bar SHALL incluir un ícono de búsqueda (lupa) y un placeholder localizado mediante el I18n_System con la clave `help.searchPlaceholder`.
6. WHEN un Authenticated_User escribe en la Search_Bar, THE Help_Center_Page SHALL aplicar un debounce de 300ms antes de ejecutar el filtrado para evitar re-renders excesivos.

### Requisito 3: Tabla de Contenidos con Navegación

**User Story:** Como usuario, quiero ver un índice de todas las secciones del centro de ayuda y navegar directamente a la que me interesa, para no tener que hacer scroll manual por toda la página.

#### Criterios de Aceptación

1. THE Help_Center_Page SHALL mostrar una Table_Of_Contents en el lado izquierdo de la página (o en la parte superior en pantallas pequeñas) que liste todas las Help_Sections disponibles.
2. WHEN un Authenticated_User hace clic en un elemento de la Table_Of_Contents, THE Help_Center_Page SHALL hacer scroll suave (smooth scroll) hasta la Help_Section correspondiente.
3. WHILE un Authenticated_User hace scroll por la página, THE Table_Of_Contents SHALL resaltar visualmente la Help_Section actualmente visible en el viewport.
4. WHEN se aplica un filtro de búsqueda, THE Table_Of_Contents SHALL mostrar solo las Help_Sections que coincidan con el filtro.

### Requisito 4: Sección General — ¿Qué es un Presupuesto?

**User Story:** Como usuario nuevo, quiero entender qué es un presupuesto en InvestIQ, cómo se calculan los valores y cómo las transacciones afectan al presupuesto, para poder usar la herramienta correctamente.

#### Criterios de Aceptación

1. THE Help_Center_Page SHALL incluir una Budget_Calculation_Section como primera Help_Section que explique el concepto de presupuesto en InvestIQ.
2. THE Budget_Calculation_Section SHALL explicar que un presupuesto contiene líneas presupuestarias con valores planificados mensuales (M1 a M12), y que cada línea está asociada a un gasto (Expense), una compañía financiera y una moneda.
3. THE Budget_Calculation_Section SHALL explicar la fórmula de cálculo del valor computado: Valor Computado = Valor Base (Plan) − Ahorros + Correcciones (Diferidos).
4. THE Budget_Calculation_Section SHALL explicar cómo las transacciones comprometidas (COMMITTED) representan compromisos de gasto y cómo las transacciones reales (REAL) representan gastos efectivos.
5. THE Budget_Calculation_Section SHALL explicar la relación entre presupuesto, comprometido y real, y cómo se calcula la diferencia (varianza).
6. THE Budget_Calculation_Section SHALL incluir al menos una SVG_Infographic que ilustre visualmente el flujo: Plan → Ahorros/Diferidos → Valor Computado → Comprometido → Real.
7. THE Budget_Calculation_Section SHALL explicar el concepto de tipos de cambio y cómo se convierten los valores de moneda local a USD.
8. Todo el contenido de la Budget_Calculation_Section SHALL estar localizado mediante el I18n_System.

### Requisito 5: Sección del Módulo Dashboard

**User Story:** Como usuario, quiero entender qué muestra el Dashboard y cómo interpretar los KPIs y gráficos, para tomar decisiones informadas.

#### Criterios de Aceptación

1. THE Help_Center_Page SHALL incluir una Module_Section para el Dashboard que explique los KPIs principales (presupuesto total, comprometido total, real total, diferencia).
2. THE Module_Section del Dashboard SHALL explicar los gráficos disponibles: presupuesto por categoría, tendencias mensuales, y comparación presupuesto vs comprometido vs real.
3. THE Module_Section del Dashboard SHALL incluir una SVG_Infographic que represente un ejemplo visual del layout del Dashboard con sus componentes principales.
4. Todo el contenido de la Module_Section del Dashboard SHALL estar localizado mediante el I18n_System.

### Requisito 6: Sección del Módulo Presupuestos

**User Story:** Como usuario, quiero entender cómo funciona la página de presupuestos, cómo editar valores mensuales y cómo funciona el flujo de confirmación, para gestionar mis líneas presupuestarias correctamente.

#### Criterios de Aceptación

1. THE Help_Center_Page SHALL incluir una Module_Section para Presupuestos que explique la estructura de la tabla de presupuestos (líneas con valores M1-M12).
2. THE Module_Section de Presupuestos SHALL explicar cómo se editan los valores de las celdas, cómo se guardan los cambios, y cómo funciona la superposición de ahorros y correcciones sobre los valores base.
3. THE Module_Section de Presupuestos SHALL explicar el flujo de confirmación de presupuesto: solicitud del administrador, confirmación por parte de los usuarios.
4. THE Module_Section de Presupuestos SHALL incluir una SVG_Infographic que ilustre la estructura de una línea presupuestaria con sus componentes (gasto, compañía, moneda, valores mensuales).
5. Todo el contenido de la Module_Section de Presupuestos SHALL estar localizado mediante el I18n_System.

### Requisito 7: Sección del Módulo Comparar Presupuestos

**User Story:** Como usuario, quiero entender cómo comparar dos versiones de presupuesto lado a lado, para analizar cambios entre versiones.

#### Criterios de Aceptación

1. THE Help_Center_Page SHALL incluir una Module_Section para Comparar Presupuestos que explique cómo seleccionar dos versiones de presupuesto para comparación.
2. THE Module_Section de Comparar Presupuestos SHALL explicar cómo interpretar las diferencias mostradas (valores resaltados, porcentajes de cambio).
3. Todo el contenido de la Module_Section de Comparar Presupuestos SHALL estar localizado mediante el I18n_System.

### Requisito 8: Sección del Módulo Ahorros

**User Story:** Como usuario, quiero entender cómo funcionan los ahorros, sus estados y cómo afectan al presupuesto, para gestionar correctamente las reducciones presupuestarias.

#### Criterios de Aceptación

1. THE Help_Center_Page SHALL incluir una Module_Section para Ahorros que explique qué es un ahorro, cómo se crea asociado a una línea presupuestaria, y cómo se distribuye mensualmente.
2. THE Module_Section de Ahorros SHALL explicar los estados PENDING y ACTIVE, y cómo un ahorro ACTIVE reduce el valor computado del presupuesto.
3. THE Module_Section de Ahorros SHALL incluir una SVG_Infographic que muestre el efecto de un ahorro sobre los valores mensuales de una línea presupuestaria.
4. Todo el contenido de la Module_Section de Ahorros SHALL estar localizado mediante el I18n_System.

### Requisito 9: Sección del Módulo Diferidos

**User Story:** Como usuario, quiero entender cómo funcionan los diferidos y cómo redistribuyen montos entre meses, para planificar correctamente los gastos.

#### Criterios de Aceptación

1. THE Help_Center_Page SHALL incluir una Module_Section para Diferidos que explique qué es un diferido, cómo se distribuye un monto total entre un rango de meses (startMonth a endMonth).
2. THE Module_Section de Diferidos SHALL explicar cómo los diferidos actúan como correcciones que se suman al valor computado del presupuesto.
3. Todo el contenido de la Module_Section de Diferidos SHALL estar localizado mediante el I18n_System.

### Requisito 10: Sección del Módulo Aprobaciones

**User Story:** Como usuario, quiero entender el flujo de aprobaciones para modificaciones de líneas presupuestarias, para saber cómo solicitar y aprobar cambios.

#### Criterios de Aceptación

1. THE Help_Center_Page SHALL incluir una Module_Section para Aprobaciones que explique el flujo de solicitud de cambio (Change Request): creación, estados (PENDING, APPROVED, REJECTED), y resolución.
2. THE Module_Section de Aprobaciones SHALL explicar qué información contiene una solicitud de cambio (valores actuales vs propuestos, comentario) y quién puede aprobar o rechazar.
3. THE Module_Section de Aprobaciones SHALL incluir una SVG_Infographic que ilustre el flujo de estados de una solicitud de cambio.
4. Todo el contenido de la Module_Section de Aprobaciones SHALL estar localizado mediante el I18n_System.

### Requisito 11: Sección del Módulo Gastos (Expenses)

**User Story:** Como usuario, quiero entender el catálogo de gastos y cómo se organizan con categorías, direcciones tecnológicas y tags, para clasificar correctamente los gastos.

#### Criterios de Aceptación

1. THE Help_Center_Page SHALL incluir una Module_Section para Gastos que explique la estructura del catálogo de gastos: código, descripción corta, descripción larga, direcciones tecnológicas, áreas de usuario, categoría y tags.
2. THE Module_Section de Gastos SHALL explicar cómo los gastos se vinculan a las líneas presupuestarias y cómo las categorías permiten agrupar gastos para reportes.
3. Todo el contenido de la Module_Section de Gastos SHALL estar localizado mediante el I18n_System.

### Requisito 12: Sección de Transacciones (Comprometidas y Reales)

**User Story:** Como usuario, quiero entender la diferencia entre transacciones comprometidas y reales, y cómo funciona la compensación, para registrar correctamente los movimientos financieros.

#### Criterios de Aceptación

1. THE Help_Center_Page SHALL incluir una Module_Section para Transacciones que explique la diferencia entre transacciones COMMITTED (compromisos de gasto) y REAL (gastos efectivos).
2. THE Module_Section de Transacciones SHALL explicar los campos principales de una transacción: fecha de servicio, fecha de contabilización, documento de referencia, moneda, valor, conversión a USD.
3. THE Module_Section de Transacciones SHALL explicar el mecanismo de compensación: cómo una transacción REAL puede compensar (total o parcialmente) una transacción COMMITTED.
4. THE Module_Section de Transacciones SHALL incluir una SVG_Infographic que ilustre el flujo de compensación entre transacciones comprometidas y reales.
5. Todo el contenido de la Module_Section de Transacciones SHALL estar localizado mediante el I18n_System.

### Requisito 13: Sección del Módulo Tipos de Cambio

**User Story:** Como usuario, quiero entender cómo funcionan los tipos de cambio y cómo afectan a los valores del presupuesto, para configurar correctamente las tasas de conversión.

#### Criterios de Aceptación

1. THE Help_Center_Page SHALL incluir una Module_Section para Tipos de Cambio que explique cómo se configuran las tasas de conversión por moneda, por mes y por presupuesto.
2. THE Module_Section de Tipos de Cambio SHALL explicar cómo los tipos de cambio se aplican para convertir valores de moneda local a USD en transacciones y líneas presupuestarias.
3. Todo el contenido de la Module_Section de Tipos de Cambio SHALL estar localizado mediante el I18n_System.

### Requisito 14: Sección de Reportes y Reportes Detallados

**User Story:** Como usuario, quiero entender qué reportes están disponibles y qué información muestra cada uno, para analizar la ejecución presupuestaria.

#### Criterios de Aceptación

1. THE Help_Center_Page SHALL incluir una Module_Section para Reportes que explique los gráficos visuales disponibles: presupuesto por categoría, tendencias mensuales, presupuesto vs comprometido vs real.
2. THE Help_Center_Page SHALL incluir una Module_Section para Reportes Detallados que liste y explique los tipos de reporte disponibles: resumen ejecutivo, ejecución presupuestaria, plan vs real, por compañía, por dirección tecnológica, por área de usuario, análisis de varianza, ahorros/diferidos, proyección anual.
3. Todo el contenido de las Module_Sections de Reportes SHALL estar localizado mediante el I18n_System.

### Requisito 15: Sección de Configuración y Datos Maestros

**User Story:** Como administrador, quiero entender cómo configurar presupuestos, snapshots y datos maestros, para administrar correctamente la plataforma.

#### Criterios de Aceptación

1. THE Help_Center_Page SHALL incluir una Module_Section para Configuración que explique cómo crear y eliminar presupuestos, establecer el presupuesto activo, y crear snapshots.
2. THE Help_Center_Page SHALL incluir una Module_Section para Datos Maestros que explique las entidades maestras: Direcciones Tecnológicas, Áreas de Usuario, Compañías Financieras y Categorías de Gastos.
3. Todo el contenido de las Module_Sections de Configuración y Datos Maestros SHALL estar localizado mediante el I18n_System.

### Requisito 16: Sección de Usuarios, Roles y Permisos

**User Story:** Como administrador, quiero entender cómo funciona la gestión de usuarios y roles con permisos, para configurar correctamente el acceso a la plataforma.

#### Criterios de Aceptación

1. THE Help_Center_Page SHALL incluir una Module_Section para Usuarios y Roles que explique cómo se crean usuarios, cómo se asignan roles, y cómo los roles definen permisos por módulo (VIEW, VIEW_OWN, MODIFY, MODIFY_OWN, APPROVE_BUDGET).
2. THE Module_Section de Usuarios y Roles SHALL explicar el concepto de menuCode y cómo cada permiso controla el acceso a funcionalidades específicas.
3. THE Module_Section de Usuarios y Roles SHALL incluir una SVG_Infographic que ilustre la relación entre usuarios, roles, permisos y módulos.
4. Todo el contenido de la Module_Section de Usuarios y Roles SHALL estar localizado mediante el I18n_System.

### Requisito 17: Sección de Traducciones y Auditoría

**User Story:** Como administrador, quiero entender cómo gestionar las traducciones de la plataforma y cómo consultar el registro de auditoría, para mantener la plataforma actualizada y trazable.

#### Criterios de Aceptación

1. THE Help_Center_Page SHALL incluir una Module_Section para Traducciones que explique cómo funciona el sistema i18n, cómo se gestionan las claves de traducción por locale (es/en), y cómo cambiar el idioma de la plataforma.
2. THE Help_Center_Page SHALL incluir una Module_Section para Auditoría que explique qué acciones se registran en el log de auditoría, qué información contiene cada registro (usuario, acción, entidad, detalles, IP, fecha), y cómo consultar el historial.
3. Todo el contenido de las Module_Sections de Traducciones y Auditoría SHALL estar localizado mediante el I18n_System.

### Requisito 18: Infografías SVG Inline

**User Story:** Como usuario, quiero ver diagramas e ilustraciones visuales que me ayuden a entender los conceptos, para aprender de forma más intuitiva.

#### Criterios de Aceptación

1. THE Help_Center_Page SHALL incluir SVG_Infographics creadas como componentes React inline (no imágenes externas) que ilustren conceptos clave.
2. THE Help_Center_Page SHALL incluir al menos las siguientes SVG_Infographics: flujo de cálculo del presupuesto, flujo de compensación de transacciones, flujo de aprobaciones, y relación usuarios-roles-permisos.
3. EACH SVG_Infographic SHALL usar los colores del tema de la aplicación (accent, sidebar, etc.) y ser responsive adaptándose al ancho del contenedor.
4. EACH SVG_Infographic SHALL incluir textos localizados mediante el I18n_System.

### Requisito 19: Soporte i18n Completo

**User Story:** Como usuario, quiero que todo el contenido del centro de ayuda esté disponible en español e inglés, para consultar la documentación en mi idioma preferido.

#### Criterios de Aceptación

1. THE Help_Center_Page SHALL renderizar todo su contenido (títulos, textos, placeholders, mensajes, etiquetas de SVG_Infographics) usando el I18n_System con el locale activo del usuario.
2. WHEN el Authenticated_User cambia el locale de la aplicación, THE Help_Center_Page SHALL actualizar todo su contenido al nuevo idioma sin recargar la página.
3. THE Help_Center_Page SHALL definir claves de traducción con el prefijo `help.` para todo su contenido (ejemplo: `help.section.dashboard.title`, `help.section.budget.description`).

### Requisito 20: Diseño Responsive y Accesibilidad

**User Story:** Como usuario, quiero que el centro de ayuda se vea bien en diferentes tamaños de pantalla y sea accesible, para poder consultarlo desde cualquier dispositivo.

#### Criterios de Aceptación

1. THE Help_Center_Page SHALL adaptar su layout para pantallas grandes (Table_Of_Contents lateral + contenido) y pantallas pequeñas (Table_Of_Contents colapsable en la parte superior + contenido a ancho completo).
2. THE Help_Center_Page SHALL usar elementos semánticos HTML (nav, article, section, h2, h3) para la estructura del contenido.
3. THE Help_Center_Page SHALL soportar navegación por teclado: Tab para moverse entre elementos interactivos, Enter para activar enlaces de la Table_Of_Contents.
4. THE Search_Bar SHALL tener un atributo aria-label descriptivo localizado mediante el I18n_System.
