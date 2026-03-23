import { PrismaClient } from '@prisma/client';

interface TranslationSeed {
  key: string;
  es: string;
  en: string;
  category: string;
}

const translations: TranslationSeed[] = [
  // =============================================
  // COMMON - Textos compartidos en toda la app
  // =============================================
  { key: 'app.name', es: 'InvestIQ', en: 'InvestIQ', category: 'common' },
  { key: 'app.subtitle', es: 'Inversiones más inteligentes. Mayor impacto', en: 'Smarter investments. Greater impact', category: 'common' },
  { key: 'btn.save', es: 'Guardar', en: 'Save', category: 'common' },
  { key: 'btn.cancel', es: 'Cancelar', en: 'Cancel', category: 'common' },
  { key: 'btn.edit', es: 'Editar', en: 'Edit', category: 'common' },
  { key: 'btn.delete', es: 'Eliminar', en: 'Delete', category: 'common' },
  { key: 'btn.create', es: 'Crear', en: 'Create', category: 'common' },
  { key: 'btn.search', es: 'Buscar', en: 'Search', category: 'common' },
  { key: 'btn.filter', es: 'Filtrar', en: 'Filter', category: 'common' },
  { key: 'btn.download', es: 'Descargar', en: 'Download', category: 'common' },
  { key: 'btn.close', es: 'Cerrar', en: 'Close', category: 'common' },
  { key: 'btn.apply', es: 'Aplicar', en: 'Apply', category: 'common' },
  { key: 'btn.confirm', es: 'Confirmar', en: 'Confirm', category: 'common' },
  { key: 'btn.new', es: 'Nuevo', en: 'New', category: 'common' },
  { key: 'btn.export', es: 'Exportar', en: 'Export', category: 'common' },
  { key: 'btn.downloadExcel', es: 'Descargar Excel', en: 'Download Excel', category: 'common' },
  { key: 'btn.compare', es: 'Comparar', en: 'Compare', category: 'common' },
  { key: 'btn.generateDescription', es: 'Generar Descripción', en: 'Generate Description', category: 'common' },
  { key: 'btn.logout', es: 'Cerrar Sesión', en: 'Logout', category: 'common' },
  { key: 'btn.login', es: 'Iniciar Sesión', en: 'Login', category: 'common' },
  { key: 'btn.approve', es: 'Aprobar', en: 'Approve', category: 'common' },
  { key: 'btn.reject', es: 'Rechazar', en: 'Reject', category: 'common' },
  { key: 'btn.back', es: 'Volver', en: 'Back', category: 'common' },
  { key: 'btn.next', es: 'Siguiente', en: 'Next', category: 'common' },
  { key: 'btn.previous', es: 'Anterior', en: 'Previous', category: 'common' },
  { key: 'btn.viewDetail', es: 'Ver Detalle', en: 'View Detail', category: 'common' },
  { key: 'btn.deactivate', es: 'Desactivar', en: 'Deactivate', category: 'common' },
  { key: 'btn.reactivate', es: 'Reactivar', en: 'Reactivate', category: 'common' },
  { key: 'btn.update', es: 'Actualizar', en: 'Update', category: 'common' },
  { key: 'label.name', es: 'Nombre', en: 'Name', category: 'common' },
  { key: 'label.description', es: 'Descripción', en: 'Description', category: 'common' },
  { key: 'label.code', es: 'Código', en: 'Code', category: 'common' },
  { key: 'label.status', es: 'Estado', en: 'Status', category: 'common' },
  { key: 'label.date', es: 'Fecha', en: 'Date', category: 'common' },
  { key: 'label.month', es: 'Mes', en: 'Month', category: 'common' },
  { key: 'label.year', es: 'Año', en: 'Year', category: 'common' },
  { key: 'label.version', es: 'Versión', en: 'Version', category: 'common' },
  { key: 'label.total', es: 'Total', en: 'Total', category: 'common' },
  { key: 'label.amount', es: 'Monto', en: 'Amount', category: 'common' },
  { key: 'label.currency', es: 'Moneda', en: 'Currency', category: 'common' },
  { key: 'label.type', es: 'Tipo', en: 'Type', category: 'common' },
  { key: 'label.active', es: 'Activo', en: 'Active', category: 'common' },
  { key: 'label.inactive', es: 'Inactivo', en: 'Inactive', category: 'common' },
  { key: 'label.budget', es: 'Presupuesto', en: 'Budget', category: 'common' },
  { key: 'label.expense', es: 'Gasto', en: 'Expense', category: 'common' },
  { key: 'label.category', es: 'Categoría', en: 'Category', category: 'common' },
  { key: 'label.key', es: 'Clave', en: 'Key', category: 'common' },
  { key: 'label.value', es: 'Valor', en: 'Value', category: 'common' },
  { key: 'label.spanish', es: 'Español', en: 'Spanish', category: 'common' },
  { key: 'label.english', es: 'Inglés', en: 'English', category: 'common' },
  { key: 'label.language', es: 'Idioma', en: 'Language', category: 'common' },
  { key: 'label.actions', es: 'Acciones', en: 'Actions', category: 'common' },
  { key: 'label.all', es: 'Todos', en: 'All', category: 'common' },
  { key: 'label.pending', es: 'Pendiente', en: 'Pending', category: 'common' },
  { key: 'label.approved', es: 'Aprobado', en: 'Approved', category: 'common' },
  { key: 'label.difference', es: 'Diferencia', en: 'Difference', category: 'common' },
  { key: 'label.percentage', es: 'Porcentaje', en: 'Percentage', category: 'common' },
  { key: 'label.company', es: 'Empresa', en: 'Company', category: 'common' },
  { key: 'label.area', es: 'Área', en: 'Area', category: 'common' },
  { key: 'label.direction', es: 'Dirección', en: 'Direction', category: 'common' },
  { key: 'label.user', es: 'Usuario', en: 'User', category: 'common' },
  { key: 'label.password', es: 'Contraseña', en: 'Password', category: 'common' },
  { key: 'label.email', es: 'Correo', en: 'Email', category: 'common' },
  { key: 'label.fullName', es: 'Nombre Completo', en: 'Full Name', category: 'common' },
  { key: 'label.role', es: 'Rol', en: 'Role', category: 'common' },
  { key: 'label.permission', es: 'Permiso', en: 'Permission', category: 'common' },
  { key: 'label.view', es: 'Ver', en: 'View', category: 'common' },
  { key: 'label.modify', es: 'Modificar', en: 'Modify', category: 'common' },
  { key: 'msg.loading', es: 'Cargando...', en: 'Loading...', category: 'common' },
  { key: 'msg.noResults', es: 'Sin resultados', en: 'No results', category: 'common' },
  { key: 'msg.error', es: 'Error', en: 'Error', category: 'common' },
  { key: 'msg.success', es: 'Éxito', en: 'Success', category: 'common' },
  { key: 'msg.confirmDelete', es: '¿Está seguro de que desea eliminar este elemento?', en: 'Are you sure you want to delete this item?', category: 'common' },
  { key: 'msg.savedSuccessfully', es: 'Guardado exitosamente', en: 'Saved successfully', category: 'common' },
  { key: 'msg.deletedSuccessfully', es: 'Eliminado exitosamente', en: 'Deleted successfully', category: 'common' },
  { key: 'msg.errorSaving', es: 'Error al guardar', en: 'Error saving', category: 'common' },
  { key: 'msg.errorLoading', es: 'Error al cargar datos', en: 'Error loading data', category: 'common' },
  { key: 'msg.requiredField', es: 'Campo requerido', en: 'Required field', category: 'common' },
  { key: 'msg.invalidCredentials', es: 'Credenciales inválidas', en: 'Invalid credentials', category: 'common' },
  { key: 'msg.sessionExpired', es: 'Sesión expirada', en: 'Session expired', category: 'common' },
  { key: 'msg.duplicateKey', es: 'La clave ya existe', en: 'Key already exists', category: 'common' },
  { key: 'msg.select', es: 'Seleccionar...', en: 'Select...', category: 'common' },
  { key: 'msg.sending', es: 'Enviando...', en: 'Sending...', category: 'common' },
  { key: 'msg.creating', es: 'Creando...', en: 'Creating...', category: 'common' },
  { key: 'msg.saving', es: 'Guardando...', en: 'Saving...', category: 'common' },
  { key: 'msg.yes', es: 'Sí', en: 'Yes', category: 'common' },
  { key: 'msg.no', es: 'No', en: 'No', category: 'common' },
  { key: 'msg.never', es: 'Nunca', en: 'Never', category: 'common' },
  { key: 'common.confirm', es: 'Confirmar Acción', en: 'Confirm Action', category: 'common' },
  { key: 'common.continue', es: 'Continuar', en: 'Continue', category: 'common' },
  { key: 'common.cancel', es: 'Cancelar', en: 'Cancel', category: 'common' },
  { key: 'common.pending', es: 'Pendiente', en: 'Pending', category: 'common' },
  { key: 'common.approved', es: 'Aprobada', en: 'Approved', category: 'common' },
  { key: 'common.rejected', es: 'Rechazada', en: 'Rejected', category: 'common' },
  { key: 'common.active', es: '★ Vigente', en: '★ Active', category: 'common' },
  { key: 'month.1', es: 'Enero', en: 'January', category: 'common' },
  { key: 'month.2', es: 'Febrero', en: 'February', category: 'common' },
  { key: 'month.3', es: 'Marzo', en: 'March', category: 'common' },
  { key: 'month.4', es: 'Abril', en: 'April', category: 'common' },
  { key: 'month.5', es: 'Mayo', en: 'May', category: 'common' },
  { key: 'month.6', es: 'Junio', en: 'June', category: 'common' },
  { key: 'month.7', es: 'Julio', en: 'July', category: 'common' },
  { key: 'month.8', es: 'Agosto', en: 'August', category: 'common' },
  { key: 'month.9', es: 'Septiembre', en: 'September', category: 'common' },
  { key: 'month.10', es: 'Octubre', en: 'October', category: 'common' },
  { key: 'month.11', es: 'Noviembre', en: 'November', category: 'common' },
  { key: 'month.12', es: 'Diciembre', en: 'December', category: 'common' },
  { key: 'month.short.1', es: 'M1', en: 'M1', category: 'common' },
  { key: 'month.short.2', es: 'M2', en: 'M2', category: 'common' },
  { key: 'month.short.3', es: 'M3', en: 'M3', category: 'common' },
  { key: 'month.short.4', es: 'M4', en: 'M4', category: 'common' },
  { key: 'month.short.5', es: 'M5', en: 'M5', category: 'common' },
  { key: 'month.short.6', es: 'M6', en: 'M6', category: 'common' },
  { key: 'month.short.7', es: 'M7', en: 'M7', category: 'common' },
  { key: 'month.short.8', es: 'M8', en: 'M8', category: 'common' },
  { key: 'month.short.9', es: 'M9', en: 'M9', category: 'common' },
  { key: 'month.short.10', es: 'M10', en: 'M10', category: 'common' },
  { key: 'month.short.11', es: 'M11', en: 'M11', category: 'common' },
  { key: 'month.short.12', es: 'M12', en: 'M12', category: 'common' },
  { key: 'filter.search', es: 'Buscar gasto...', en: 'Search expense...', category: 'common' },
  { key: 'filter.clearFilters', es: 'Limpiar filtros', en: 'Clear filters', category: 'common' },
  { key: 'filter.all', es: 'Todas', en: 'All', category: 'common' },
  { key: 'filter.searchComma', es: 'Filtrar (separar por comas)...', en: 'Filter (comma separated)...', category: 'common' },
  { key: 'section.administration', es: 'Administración', en: 'Administration', category: 'common' },
  { key: 'section.budgetManagement', es: 'Gestión de Presupuesto', en: 'Budget Management', category: 'common' },
  { key: 'theme.default', es: 'Azul Corporativo', en: 'Corporate Blue', category: 'common' },
  { key: 'theme.green', es: 'Verde Naturaleza', en: 'Nature Green', category: 'common' },
  { key: 'theme.purple', es: 'Púrpura Elegante', en: 'Elegant Purple', category: 'common' },
  { key: 'theme.red', es: 'Rojo Ejecutivo', en: 'Executive Red', category: 'common' },
  { key: 'theme.teal', es: 'Teal Moderno', en: 'Modern Teal', category: 'common' },
  { key: 'theme.orange', es: 'Naranja Energético', en: 'Energetic Orange', category: 'common' },

  // =============================================
  // SIDEBAR MENU
  // =============================================
  { key: 'menu.dashboard', es: 'Dashboard', en: 'Dashboard', category: 'sidebar' },
  { key: 'menu.budgets', es: 'Presupuestos', en: 'Budgets', category: 'sidebar' },
  { key: 'menu.compareBudgets', es: 'Comparar Presupuestos', en: 'Compare Budgets', category: 'sidebar' },
  { key: 'menu.savings', es: 'Ahorros', en: 'Savings', category: 'sidebar' },
  { key: 'menu.deferrals', es: 'Diferidos', en: 'Deferrals', category: 'sidebar' },
  { key: 'menu.approvals', es: 'Aprobaciones', en: 'Approvals', category: 'sidebar' },
  { key: 'menu.expenses', es: 'Gastos', en: 'Expenses', category: 'sidebar' },
  { key: 'menu.committedTransactions', es: 'Trans. Comprometidas', en: 'Committed Trans.', category: 'sidebar' },
  { key: 'menu.realTransactions', es: 'Trans. Reales', en: 'Real Trans.', category: 'sidebar' },
  { key: 'menu.exchangeRates', es: 'Tasas de Cambio', en: 'Exchange Rates', category: 'sidebar' },
  { key: 'menu.reports', es: 'Reportes', en: 'Reports', category: 'sidebar' },
  { key: 'menu.detailedReports', es: 'Reportes Detallados', en: 'Detailed Reports', category: 'sidebar' },
  { key: 'menu.configuration', es: 'Configuración', en: 'Configuration', category: 'sidebar' },
  { key: 'menu.masterData', es: 'Datos Maestros', en: 'Master Data', category: 'sidebar' },
  { key: 'menu.users', es: 'Usuarios', en: 'Users', category: 'sidebar' },
  { key: 'menu.roles', es: 'Roles', en: 'Roles', category: 'sidebar' },
  { key: 'menu.translations', es: 'Traducciones', en: 'Translations', category: 'sidebar' },
  { key: 'menu.audit', es: 'Auditoría', en: 'Audit Log', category: 'sidebar' },
  { key: 'menu.planValues', es: 'Valores Plan', en: 'Plan Values', category: 'sidebar' },
  { key: 'sidebar.expand', es: 'Expandir menú', en: 'Expand menu', category: 'sidebar' },
  { key: 'sidebar.collapse', es: 'Colapsar menú', en: 'Collapse menu', category: 'sidebar' },

  // =============================================
  // LOGIN
  // =============================================
  { key: 'login.title', es: 'InvestIQ', en: 'InvestIQ', category: 'login' },
  { key: 'login.subtitle', es: 'Inversiones más inteligentes. Mayor impacto', en: 'Smarter investments. Greater impact', category: 'login' },
  { key: 'login.username', es: 'Usuario', en: 'Username', category: 'login' },
  { key: 'login.password', es: 'Contraseña', en: 'Password', category: 'login' },
  { key: 'login.submit', es: 'Iniciar Sesión', en: 'Login', category: 'login' },
  { key: 'login.submitting', es: 'Iniciando sesión...', en: 'Logging in...', category: 'login' },
  { key: 'login.userPlaceholder', es: 'Ingrese su usuario', en: 'Enter your username', category: 'login' },
  { key: 'login.passPlaceholder', es: 'Ingrese su contraseña', en: 'Enter your password', category: 'login' },
  { key: 'login.invalidCredentials', es: 'Credenciales inválidas', en: 'Invalid credentials', category: 'login' },
  { key: 'login.defaultWarning', es: '⚠️ Está usando la contraseña por defecto. Por favor cámbiela después de iniciar sesión.', en: '⚠️ You are using the default password. Please change it after logging in.', category: 'login' },
  { key: 'login.defaultUser', es: 'Usuario por defecto: admin', en: 'Default user: admin', category: 'login' },
  { key: 'login.defaultPass', es: 'Contraseña por defecto: admin', en: 'Default password: admin', category: 'login' },

  // =============================================
  // DASHBOARD
  // =============================================
  { key: 'dashboard.noBudget', es: 'No hay presupuesto vigente configurado. Configure uno en la sección de Configuración.', en: 'No active budget configured. Set one up in the Configuration section.', category: 'dashboard' },
  { key: 'dashboard.companyTotals', es: 'Totales por Compañía', en: 'Totals by Company', category: 'dashboard' },

  // =============================================
  // PRESUPUESTOS
  // =============================================
  { key: 'budget.active', es: 'Presupuesto Vigente', en: 'Active Budget', category: 'presupuestos' },
  { key: 'budget.newVersion', es: 'Nueva Versión', en: 'New Version', category: 'presupuestos' },
  { key: 'budget.planValues', es: 'Valores Plan', en: 'Plan Values', category: 'presupuestos' },
  { key: 'budget.committed', es: 'Comprometido', en: 'Committed', category: 'presupuestos' },
  { key: 'budget.real', es: 'Real', en: 'Real', category: 'presupuestos' },
  { key: 'budget.planned', es: 'Planificado', en: 'Planned', category: 'presupuestos' },
  { key: 'budget.executed', es: 'Ejecutado', en: 'Executed', category: 'presupuestos' },
  { key: 'budget.variance', es: 'Variación', en: 'Variance', category: 'presupuestos' },
  { key: 'budget.addLine', es: 'Agregar Línea', en: 'Add Line', category: 'presupuestos' },
  { key: 'budget.requestChange', es: 'Solicitar Cambio de Presupuesto', en: 'Request Budget Change', category: 'presupuestos' },
  { key: 'budget.submitReview', es: 'Enviar a Revisión', en: 'Submit for Review', category: 'presupuestos' },
  { key: 'budget.setActive', es: 'Marcar Vigente', en: 'Set Active', category: 'presupuestos' },
  { key: 'budget.newBudget', es: 'Nuevo Presupuesto', en: 'New Budget', category: 'presupuestos' },
  { key: 'budget.myRequests', es: 'Mis Solicitudes', en: 'My Requests', category: 'presupuestos' },
  { key: 'budget.readOnly', es: 'Solo lectura', en: 'Read only', category: 'presupuestos' },
  { key: 'budget.noLines', es: 'No hay líneas de presupuesto para mostrar', en: 'No budget lines to display', category: 'presupuestos' },
  { key: 'budget.showModCols', es: 'Mostrar columnas de modificación', en: 'Show modification columns', category: 'presupuestos' },
  { key: 'budget.hideModCols', es: 'Ocultar columnas de modificación', en: 'Hide modification columns', category: 'presupuestos' },
  { key: 'budget.deleteLineConfirm', es: '¿Estás seguro de eliminar esta línea del presupuesto?', en: 'Are you sure you want to delete this budget line?', category: 'presupuestos' },
  { key: 'budget.deleteBudgetConfirm', es: '¿Estás seguro de eliminar el presupuesto {year} {version}? Esta acción no se puede deshacer.', en: 'Are you sure you want to delete budget {year} {version}? This action cannot be undone.', category: 'presupuestos' },
  { key: 'budget.lineDeleted', es: 'Línea eliminada correctamente', en: 'Line deleted successfully', category: 'presupuestos' },
  { key: 'budget.lineAdded', es: 'Línea agregada correctamente', en: 'Line added successfully', category: 'presupuestos' },
  { key: 'budget.expense', es: 'Gasto', en: 'Expense', category: 'presupuestos' },
  { key: 'budget.financialCompany', es: 'Empresa Financiera', en: 'Financial Company', category: 'presupuestos' },
  { key: 'budget.techDirection', es: 'Dirección Tecnológica (opcional)', en: 'Technology Direction (optional)', category: 'presupuestos' },
  { key: 'budget.selectExpense', es: 'Seleccionar gasto...', en: 'Select expense...', category: 'presupuestos' },
  { key: 'budget.selectCompany', es: 'Seleccionar empresa...', en: 'Select company...', category: 'presupuestos' },
  { key: 'budget.noTechDirection', es: 'Sin dirección tecnológica', en: 'No technology direction', category: 'presupuestos' },
  { key: 'budget.copyFrom', es: 'Copiar desde presupuesto (opcional)', en: 'Copy from budget (optional)', category: 'presupuestos' },
  { key: 'budget.emptyBudget', es: 'Sin copia - presupuesto vacío', en: 'No copy - empty budget', category: 'presupuestos' },
  { key: 'budget.copyNote', es: 'Se copiarán las líneas de presupuesto y tasas de conversión', en: 'Budget lines and conversion rates will be copied', category: 'presupuestos' },
  { key: 'budget.changeRequestDetail', es: 'Detalle de Solicitud de Cambio', en: 'Change Request Detail', category: 'presupuestos' },
  { key: 'budget.month', es: 'Mes', en: 'Month', category: 'presupuestos' },
  { key: 'budget.current', es: 'Actual', en: 'Current', category: 'presupuestos' },
  { key: 'budget.proposed', es: 'Propuesto', en: 'Proposed', category: 'presupuestos' },
  { key: 'budget.previous', es: 'Anterior', en: 'Previous', category: 'presupuestos' },
  { key: 'budget.difference', es: 'Diferencia', en: 'Difference', category: 'presupuestos' },
  { key: 'budget.commentOptional', es: 'Comentario (opcional)', en: 'Comment (optional)', category: 'presupuestos' },
  { key: 'budget.justification', es: 'Justificación del cambio...', en: 'Change justification...', category: 'presupuestos' },
  { key: 'budget.modifyValue', es: 'Modifica al menos un valor para enviar la solicitud', en: 'Modify at least one value to submit the request', category: 'presupuestos' },
  { key: 'budget.inReview', es: 'En Revisión', en: 'In Review', category: 'presupuestos' },
  { key: 'budget.budgetCreated', es: 'Presupuesto creado correctamente', en: 'Budget created successfully', category: 'presupuestos' },
  { key: 'budget.markedActive', es: 'Presupuesto marcado como vigente', en: 'Budget marked as active', category: 'presupuestos' },
  { key: 'budget.sentToReview', es: 'Presupuesto enviado a revisión', en: 'Budget sent for review', category: 'presupuestos' },
  { key: 'budget.changeRequestSent', es: 'Solicitud de cambio enviada a aprobación exitosamente', en: 'Change request sent for approval successfully', category: 'presupuestos' },
  { key: 'budget.budgetDeleted', es: 'Presupuesto eliminado', en: 'Budget deleted', category: 'presupuestos' },
  { key: 'budget.budgetA', es: 'Presupuesto A', en: 'Budget A', category: 'presupuestos' },
  { key: 'budget.budgetB', es: 'Presupuesto B', en: 'Budget B', category: 'presupuestos' },
  { key: 'budget.changes', es: 'Cambios', en: 'Changes', category: 'presupuestos' },
  { key: 'budget.hideDescription', es: 'Ocultar', en: 'Hide', category: 'presupuestos' },
  { key: 'budget.showDescription', es: 'Ver', en: 'Show', category: 'presupuestos' },
  { key: 'budget.hideRequests', es: 'Ocultar Solicitudes', en: 'Hide Requests', category: 'presupuestos' },
  { key: 'budget.myChangeRequests', es: 'Mis Solicitudes de Cambio', en: 'My Change Requests', category: 'presupuestos' },
  { key: 'budget.noChangeRequests', es: 'No tienes solicitudes de cambio', en: 'You have no change requests', category: 'presupuestos' },
  { key: 'budget.sendApproval', es: 'Enviar a Aprobación', en: 'Send for Approval', category: 'presupuestos' },
  { key: 'budget.createBudget', es: 'Crear Presupuesto', en: 'Create Budget', category: 'presupuestos' },
  { key: 'budget.addBudgetLine', es: 'Agregar Línea de Presupuesto', en: 'Add Budget Line', category: 'presupuestos' },
  { key: 'budget.newExpenses', es: 'Gastos Nuevos', en: 'New Expenses', category: 'presupuestos' },
  { key: 'budget.removedExpenses', es: 'Gastos Eliminados', en: 'Removed Expenses', category: 'presupuestos' },
  { key: 'budget.modifiedExpenses', es: 'Gastos Modificados', en: 'Modified Expenses', category: 'presupuestos' },
  { key: 'budget.unchanged', es: 'Sin Cambios', en: 'Unchanged', category: 'presupuestos' },
  { key: 'budget.totalBudgetA', es: 'Total Presupuesto A', en: 'Total Budget A', category: 'presupuestos' },
  { key: 'budget.totalBudgetB', es: 'Total Presupuesto B', en: 'Total Budget B', category: 'presupuestos' },
  { key: 'budget.differenceDetail', es: 'Descripción de Diferencias', en: 'Difference Description', category: 'presupuestos' },
  { key: 'budget.compare', es: 'Comparar Presupuestos', en: 'Compare Budgets', category: 'presupuestos' },
  { key: 'msg.sameYearRequired', es: 'Los presupuestos deben ser del mismo año', en: 'Budgets must be from the same year', category: 'presupuestos' },
  { key: 'msg.selectTwoBudgets', es: 'Seleccione dos presupuestos para comparar', en: 'Select two budgets to compare', category: 'presupuestos' },

  // =============================================
  // AHORROS
  // =============================================
  { key: 'saving.new', es: 'Nuevo Ahorro', en: 'New Saving', category: 'ahorros' },
  { key: 'saving.readOnly', es: 'Solo lectura - Solo se pueden modificar ahorros del presupuesto vigente', en: 'Read only - Savings can only be modified on the active budget', category: 'ahorros' },
  { key: 'saving.create', es: 'Crear Ahorro', en: 'Create Saving', category: 'ahorros' },
  { key: 'saving.monthlyValues', es: 'Valores Mensuales', en: 'Monthly Values', category: 'ahorros' },
  { key: 'saving.noRecords', es: 'No hay ahorros registrados', en: 'No savings recorded', category: 'ahorros' },
  { key: 'saving.detail', es: 'Detalle del Ahorro', en: 'Saving Detail', category: 'ahorros' },
  { key: 'saving.line', es: 'Línea', en: 'Line', category: 'ahorros' },
  { key: 'saving.createdBy', es: 'Creado por', en: 'Created by', category: 'ahorros' },
  { key: 'saving.savingValue', es: 'Valor Ahorro', en: 'Saving Value', category: 'ahorros' },
  { key: 'saving.deleteSaving', es: 'Eliminar Ahorro', en: 'Delete Saving', category: 'ahorros' },
  { key: 'saving.confirmDelete', es: '¿Estás seguro de eliminar este ahorro?', en: 'Are you sure you want to delete this saving?', category: 'ahorros' },
  { key: 'saving.activateSaving', es: 'Activar Ahorro', en: 'Activate Saving', category: 'ahorros' },
  { key: 'saving.confirmActivate', es: '¿Estás seguro de activar este ahorro? Los valores se reflejarán en el Dashboard.', en: 'Are you sure you want to activate this saving? Values will be reflected in the Dashboard.', category: 'ahorros' },
  { key: 'saving.created', es: 'Ahorro creado exitosamente', en: 'Saving created successfully', category: 'ahorros' },
  { key: 'saving.deleted', es: 'Ahorro eliminado', en: 'Saving deleted', category: 'ahorros' },
  { key: 'saving.activated', es: 'Ahorro activado exitosamente', en: 'Saving activated successfully', category: 'ahorros' },
  { key: 'saving.deactivateSaving', es: 'Desactivar Ahorro', en: 'Deactivate Saving', category: 'ahorros' },
  { key: 'saving.confirmDeactivate', es: '¿Estás seguro de desactivar este ahorro? Los valores dejarán de reflejarse en el Dashboard.', en: 'Are you sure you want to deactivate this saving? Values will no longer be reflected in the Dashboard.', category: 'ahorros' },
  { key: 'saving.deactivated', es: 'Ahorro desactivado exitosamente', en: 'Saving deactivated successfully', category: 'ahorros' },
  { key: 'saving.availableBudget', es: 'Disponible', en: 'Available', category: 'ahorros' },
  { key: 'saving.exceedsBudget', es: 'El ahorro excede el presupuesto disponible en uno o más meses', en: 'Saving exceeds available budget in one or more months', category: 'ahorros' },

  // =============================================
  // DIFERIDOS
  // =============================================
  { key: 'deferral.new', es: 'Nuevo Diferido', en: 'New Deferral', category: 'diferidos' },
  { key: 'deferral.create', es: 'Crear Diferido', en: 'Create Deferral', category: 'diferidos' },
  { key: 'deferral.noRecords', es: 'No hay diferidos registrados', en: 'No deferrals recorded', category: 'diferidos' },
  { key: 'deferral.searchLine', es: 'Buscar por código, descripción o empresa...', en: 'Search by code, description or company...', category: 'diferidos' },
  { key: 'deferral.totalAmount', es: 'Monto Total', en: 'Total Amount', category: 'diferidos' },
  { key: 'deferral.startMonth', es: 'Mes Inicio', en: 'Start Month', category: 'diferidos' },
  { key: 'deferral.endMonth', es: 'Mes Fin', en: 'End Month', category: 'diferidos' },
  { key: 'deferral.period', es: 'Período', en: 'Period', category: 'diferidos' },
  { key: 'deferral.startBeforeEnd', es: 'El mes de inicio debe ser menor al mes de fin', en: 'Start month must be before end month', category: 'diferidos' },
  { key: 'deferral.deleteConfirm', es: '¿Estás seguro de eliminar este diferido?', en: 'Are you sure you want to delete this deferral?', category: 'diferidos' },

  // =============================================
  // APROBACIONES
  // =============================================
  { key: 'approval.title', es: 'Aprobaciones Pendientes', en: 'Pending Approvals', category: 'aprobaciones' },
  { key: 'approval.pending', es: 'Aprobaciones Pendientes', en: 'Pending Approvals', category: 'aprobaciones' },
  { key: 'approval.approveSelected', es: 'Aprobar seleccionadas', en: 'Approve selected', category: 'aprobaciones' },
  { key: 'approval.noPending', es: 'No hay solicitudes pendientes de aprobación', en: 'No pending approval requests', category: 'aprobaciones' },
  { key: 'approval.detail', es: 'Detalle de Solicitud', en: 'Request Detail', category: 'aprobaciones' },
  { key: 'approval.current', es: 'Actual', en: 'Current', category: 'aprobaciones' },
  { key: 'approval.proposed', es: 'Propuesto', en: 'Proposed', category: 'aprobaciones' },
  { key: 'approval.selected', es: 'seleccionada(s)', en: 'selected', category: 'aprobaciones' },
  { key: 'approval.approveCount', es: 'solicitud(es) aprobadas exitosamente', en: 'request(s) approved successfully', category: 'aprobaciones' },
  { key: 'approval.confirmApprove', es: '¿Aprobar esta solicitud de cambio?', en: 'Approve this change request?', category: 'aprobaciones' },
  { key: 'approval.confirmReject', es: '¿Rechazar esta solicitud de cambio?', en: 'Reject this change request?', category: 'aprobaciones' },
  { key: 'approval.confirmApproveMultiple', es: '¿Aprobar las solicitudes de cambio seleccionadas?', en: 'Approve selected change requests?', category: 'aprobaciones' },
  { key: 'approval.history', es: 'Historial de Aprobaciones', en: 'Approval History', category: 'aprobaciones' },
  { key: 'approval.noHistory', es: 'No hay aprobaciones pasadas', en: 'No past approvals', category: 'aprobaciones' },
  { key: 'approval.resolvedBy', es: 'Resuelto por', en: 'Resolved by', category: 'aprobaciones' },
  { key: 'approval.resolvedAt', es: 'Fecha resolución', en: 'Resolution date', category: 'aprobaciones' },
  { key: 'approval.approved', es: 'Aprobada', en: 'Approved', category: 'aprobaciones' },
  { key: 'approval.rejected', es: 'Rechazada', en: 'Rejected', category: 'aprobaciones' },

  // =============================================
  // GASTOS
  // =============================================
  { key: 'expense.new', es: 'Nuevo Gasto', en: 'New Expense', category: 'gastos' },
  { key: 'expense.edit', es: 'Editar Gasto', en: 'Edit Expense', category: 'gastos' },
  { key: 'expense.search', es: 'Buscar por código, descripción o tags...', en: 'Search by code, description or tags...', category: 'gastos' },
  { key: 'expense.showInactive', es: 'Ver desactivados', en: 'Show inactive', category: 'gastos' },
  { key: 'expense.deactivate', es: 'Desactivar', en: 'Deactivate', category: 'gastos' },
  { key: 'expense.reactivate', es: 'Reactivar', en: 'Reactivate', category: 'gastos' },
  { key: 'expense.noTags', es: 'Sin tags', en: 'No tags', category: 'gastos' },
  { key: 'expense.noRecords', es: 'No hay gastos registrados', en: 'No expenses recorded', category: 'gastos' },
  { key: 'expense.createNew', es: 'Crear Nuevo Gasto', en: 'Create New Expense', category: 'gastos' },
  { key: 'expense.shortDesc', es: 'Descripción Corta', en: 'Short Description', category: 'gastos' },
  { key: 'expense.longDesc', es: 'Descripción Larga', en: 'Long Description', category: 'gastos' },
  { key: 'expense.techDirections', es: 'Direcciones Tecnológicas', en: 'Technology Directions', category: 'gastos' },
  { key: 'expense.userAreas', es: 'Áreas de Usuario', en: 'User Areas', category: 'gastos' },
  { key: 'expense.createExpense', es: 'Crear Gasto', en: 'Create Expense', category: 'gastos' },
  { key: 'expense.noCategory', es: 'Sin categoría', en: 'No category', category: 'gastos' },
  { key: 'expense.code', es: 'Código', en: 'Code', category: 'gastos' },
  { key: 'expense.description', es: 'Descripción', en: 'Description', category: 'gastos' },
  { key: 'expense.budget', es: 'Ppto', en: 'Budget', category: 'gastos' },
  { key: 'expense.committed', es: 'Comp', en: 'Committed', category: 'gastos' },
  { key: 'expense.real', es: 'Real', en: 'Real', category: 'gastos' },
  { key: 'expense.diff', es: 'Dif', en: 'Diff', category: 'gastos' },
  { key: 'expense.updated', es: 'Gasto actualizado correctamente', en: 'Expense updated successfully', category: 'gastos' },
  { key: 'expense.created', es: 'Gasto creado correctamente', en: 'Expense created successfully', category: 'gastos' },
  { key: 'expense.deactivateConfirm', es: '¿Desactivar este gasto? No se eliminará, solo se ocultará de los presupuestos activos.', en: 'Deactivate this expense? It will not be deleted, just hidden from active budgets.', category: 'gastos' },
  { key: 'expense.detail.infoTags', es: 'Info & Tags', en: 'Info & Tags', category: 'gastos' },
  { key: 'expense.detail.committed', es: 'Comprometidas', en: 'Committed', category: 'gastos' },
  { key: 'expense.detail.real', es: 'Reales', en: 'Real', category: 'gastos' },
  { key: 'expense.detail.savings', es: 'Ahorros', en: 'Savings', category: 'gastos' },
  { key: 'expense.detail.description', es: 'Descripción:', en: 'Description:', category: 'gastos' },
  { key: 'expense.detail.lastModification', es: 'Última modificación', en: 'Last modification', category: 'gastos' },
  { key: 'expense.detail.tags', es: 'Tags', en: 'Tags', category: 'gastos' },
  { key: 'expense.detail.addTag', es: 'Agregar Tag', en: 'Add Tag', category: 'gastos' },
  { key: 'expense.detail.tagKey', es: 'Clave', en: 'Key', category: 'gastos' },
  { key: 'expense.detail.tagValue', es: 'Valor', en: 'Value', category: 'gastos' },
  { key: 'expense.detail.tagType', es: 'Tipo', en: 'Type', category: 'gastos' },
  { key: 'expense.detail.tagText', es: 'Texto', en: 'Text', category: 'gastos' },
  { key: 'expense.detail.tagNumber', es: 'Número', en: 'Number', category: 'gastos' },
  { key: 'expense.detail.tagDate', es: 'Fecha', en: 'Date', category: 'gastos' },
  { key: 'expense.detail.noTags', es: 'Sin tags', en: 'No tags', category: 'gastos' },
  { key: 'expense.detail.deleteTag', es: 'Eliminar Tag', en: 'Delete Tag', category: 'gastos' },
  { key: 'expense.detail.deleteTagConfirm', es: '¿Estás seguro de eliminar el tag', en: 'Are you sure you want to delete the tag', category: 'gastos' },
  { key: 'expense.detail.noTransactions', es: 'No hay transacciones', en: 'No transactions', category: 'gastos' },
  { key: 'expense.detail.refDoc', es: 'Ref. Doc', en: 'Ref. Doc', category: 'gastos' },
  { key: 'expense.detail.serviceDate', es: 'Fecha Servicio', en: 'Service Date', category: 'gastos' },
  { key: 'expense.detail.postingDate', es: 'Fecha Imputación', en: 'Posting Date', category: 'gastos' },
  { key: 'expense.detail.usd', es: 'USD', en: 'USD', category: 'gastos' },
  { key: 'expense.detail.compensated', es: 'Compensada', en: 'Compensated', category: 'gastos' },
  { key: 'expense.detail.original', es: 'Original', en: 'Original', category: 'gastos' },
  { key: 'expense.detail.saving', es: 'Ahorro', en: 'Saving', category: 'gastos' },
  { key: 'expense.detail.consolidated', es: 'Consolidado', en: 'Consolidated', category: 'gastos' },

  // =============================================
  // TRANS. COMPROMETIDAS / TRANS. REALES
  // =============================================
  { key: 'transaction.new', es: 'Nueva Transacción', en: 'New Transaction', category: 'transacciones' },
  { key: 'transaction.committed', es: 'Transacción Comprometida', en: 'Committed Transaction', category: 'transacciones' },
  { key: 'transaction.real', es: 'Transacción Real', en: 'Real Transaction', category: 'transacciones' },
  { key: 'transaction.fromCommitted', es: 'Desde Comprometida', en: 'From Committed', category: 'transacciones' },
  { key: 'transaction.hideCommitted', es: 'Ocultar Comprometidas', en: 'Hide Committed', category: 'transacciones' },
  { key: 'transaction.edit', es: 'Editar Transacción', en: 'Edit Transaction', category: 'transacciones' },
  { key: 'transaction.refDoc', es: 'Número de Documento', en: 'Document Number', category: 'transacciones' },
  { key: 'transaction.compensating', es: 'Compensando transacción comprometida', en: 'Compensating committed transaction', category: 'transacciones' },
  { key: 'transaction.selectCommitted', es: 'Selecciona una transacción comprometida no compensada', en: 'Select an uncompensated committed transaction', category: 'transacciones' },
  { key: 'transaction.deleteConfirm', es: '¿Estás seguro de eliminar esta transacción?', en: 'Are you sure you want to delete this transaction?', category: 'transacciones' },
  { key: 'transaction.use', es: 'Usar →', en: 'Use →', category: 'transacciones' },
  { key: 'table.budgetLine', es: 'Línea Presupuesto', en: 'Budget Line', category: 'transacciones' },
  { key: 'table.serviceDate', es: 'Fecha Servicio', en: 'Service Date', category: 'transacciones' },
  { key: 'table.postingDate', es: 'Fecha Imputación', en: 'Posting Date', category: 'transacciones' },
  { key: 'table.refDocument', es: 'Ref. Documento', en: 'Ref. Document', category: 'transacciones' },
  { key: 'table.currency', es: 'Moneda', en: 'Currency', category: 'transacciones' },
  { key: 'table.value', es: 'Valor', en: 'Value', category: 'transacciones' },
  { key: 'table.month', es: 'Mes', en: 'Month', category: 'transacciones' },
  { key: 'table.compensated', es: 'Compensada', en: 'Compensated', category: 'transacciones' },
  { key: 'table.actions', es: 'Acciones', en: 'Actions', category: 'transacciones' },
  { key: 'table.externalLink', es: 'Link Externo', en: 'External Link', category: 'transacciones' },
  { key: 'table.code', es: 'Código', en: 'Code', category: 'transacciones' },
  { key: 'table.description', es: 'Descripción', en: 'Description', category: 'transacciones' },
  { key: 'table.company', es: 'Empresa', en: 'Company', category: 'transacciones' },
  { key: 'table.area', es: 'Área', en: 'Area', category: 'transacciones' },
  { key: 'table.category', es: 'Categoría', en: 'Category', category: 'transacciones' },
  { key: 'table.total', es: 'Total', en: 'Total', category: 'transacciones' },
  { key: 'table.tags', es: 'Tags', en: 'Tags', category: 'transacciones' },
  { key: 'table.status', es: 'Estado', en: 'Status', category: 'transacciones' },
  { key: 'table.expense', es: 'Gasto', en: 'Expense', category: 'transacciones' },
  { key: 'table.budget', es: 'Presupuesto', en: 'Budget', category: 'transacciones' },
  { key: 'table.requestedBy', es: 'Solicitado por', en: 'Requested by', category: 'transacciones' },
  { key: 'table.comment', es: 'Comentario', en: 'Comment', category: 'transacciones' },
  { key: 'table.date', es: 'Fecha', en: 'Date', category: 'transacciones' },
  { key: 'table.approvedBy', es: 'Aprobado por', en: 'Approved by', category: 'transacciones' },
  { key: 'table.lastModified', es: 'Última Modif.', en: 'Last Modified', category: 'transacciones' },
  { key: 'table.modifiedBy', es: 'Modificado por', en: 'Modified by', category: 'transacciones' },
  { key: 'table.filter', es: 'Filtrar...', en: 'Filter...', category: 'transacciones' },
  { key: 'table.all', es: 'Todas', en: 'All', category: 'transacciones' },

  // =============================================
  // TASAS DE CAMBIO
  // =============================================
  { key: 'exchangeRate.title', es: 'Tasas de Conversión a USD', en: 'USD Conversion Rates', category: 'tasas_cambio' },
  { key: 'exchangeRate.saveAll', es: 'Guardar Todo', en: 'Save All', category: 'tasas_cambio' },
  { key: 'exchangeRate.saving', es: 'Guardando...', en: 'Saving...', category: 'tasas_cambio' },
  { key: 'exchangeRate.currency', es: 'Moneda', en: 'Currency', category: 'tasas_cambio' },
  { key: 'exchangeRate.helpText', es: 'Ingrese la tasa de conversión de cada moneda a USD por mes. Ejemplo: CLP 0.00110 significa que 1 CLP = 0.00110 USD. El valor USD de las transacciones se calcula multiplicando el monto por esta tasa según el mes de la transacción.', en: 'Enter the conversion rate from each currency to USD per month. Example: CLP 0.00110 means 1 CLP = 0.00110 USD. The USD value of transactions is calculated by multiplying the amount by this rate according to the transaction month.', category: 'tasas_cambio' },
  { key: 'exchangeRate.saved', es: 'tasas de conversión guardadas', en: 'conversion rates saved', category: 'tasas_cambio' },
  { key: 'exchangeRate.errorSaving', es: 'Error al guardar tasas', en: 'Error saving rates', category: 'tasas_cambio' },
  { key: 'page.exchangeRates', es: 'Tasas de Cambio', en: 'Exchange Rates', category: 'tasas_cambio' },

  // =============================================
  // REPORTES
  // =============================================
  { key: 'report.exportExcel', es: 'Exportar Excel', en: 'Export Excel', category: 'reportes' },
  { key: 'report.totalBudget', es: 'Presupuesto Total', en: 'Total Budget', category: 'reportes' },
  { key: 'report.committed', es: 'Comprometido', en: 'Committed', category: 'reportes' },
  { key: 'report.real', es: 'Real', en: 'Real', category: 'reportes' },
  { key: 'report.available', es: 'Disponible', en: 'Available', category: 'reportes' },
  { key: 'report.noData', es: 'Sin datos', en: 'No data', category: 'reportes' },
  { key: 'report.chart1', es: '1. Presupuesto por Categoría', en: '1. Budget by Category', category: 'reportes' },
  { key: 'report.chart2', es: '2. Presupuesto vs Comprometido vs Real', en: '2. Budget vs Committed vs Real', category: 'reportes' },
  { key: 'report.chart3', es: '3. Presupuesto Mensual', en: '3. Monthly Budget', category: 'reportes' },
  { key: 'report.chart4', es: '4. Comprometido Mensual', en: '4. Monthly Committed', category: 'reportes' },
  { key: 'report.chart5', es: '5. Real Mensual', en: '5. Monthly Real', category: 'reportes' },
  { key: 'report.chart6', es: '6. Presupuesto por Área', en: '6. Budget by Area', category: 'reportes' },
  { key: 'report.chart7', es: '7. % Ejecución por Gasto', en: '7. Execution % by Expense', category: 'reportes' },
  { key: 'report.chart8', es: '8. Top 10 Gastos', en: '8. Top 10 Expenses', category: 'reportes' },
  { key: 'report.chart9', es: '9. Presupuesto vs Ejecutado Mensual', en: '9. Monthly Budget vs Executed', category: 'reportes' },
  { key: 'report.chart10', es: '10. Potencial de Ahorro por Gasto', en: '10. Savings Potential by Expense', category: 'reportes' },
  { key: 'report.legendBudget', es: 'Presupuesto', en: 'Budget', category: 'reportes' },
  { key: 'report.legendExecuted', es: 'Ejecutado', en: 'Executed', category: 'reportes' },
  { key: 'report.executiveSummary', es: 'Resumen Ejecutivo de Presupuesto', en: 'Budget Executive Summary', category: 'reportes' },
  { key: 'report.budgetExecution', es: 'Ejecución Presupuestaria por Gasto', en: 'Budget Execution by Expense', category: 'reportes' },
  { key: 'report.planVsReal', es: 'Comparativo Plan vs Real por Mes', en: 'Plan vs Real by Month', category: 'reportes' },
  { key: 'report.byFinancialCompany', es: 'Gastos por Empresa Financiera', en: 'Expenses by Financial Company', category: 'reportes' },
  { key: 'report.byTechDirection', es: 'Gastos por Dirección Tecnológica', en: 'Expenses by Tech Direction', category: 'reportes' },
  { key: 'report.byUserArea', es: 'Gastos por Área Usuaria', en: 'Expenses by User Area', category: 'reportes' },
  { key: 'report.detailedTransactions', es: 'Transacciones Detalladas por Período', en: 'Detailed Transactions by Period', category: 'reportes' },
  { key: 'report.varianceAnalysis', es: 'Análisis de Variaciones', en: 'Variance Analysis', category: 'reportes' },
  { key: 'report.savingsDeferrals', es: 'Reporte de Ahorros y Diferidos', en: 'Savings & Deferrals Report', category: 'reportes' },
  { key: 'report.annualProjection', es: 'Proyección de Cierre Anual', en: 'Annual Closing Projection', category: 'reportes' },

  // =============================================
  // REPORTES DETALLADOS
  // =============================================
  { key: 'detailedReport.budgetLabel', es: 'Presupuesto:', en: 'Budget:', category: 'reportes_detallados' },
  { key: 'detailedReport.allFilter', es: 'Todos', en: 'All', category: 'reportes_detallados' },
  { key: 'detailedReport.generating', es: 'Generando...', en: 'Generating...', category: 'reportes_detallados' },
  { key: 'detailedReport.generate', es: 'Generar Reporte', en: 'Generate Report', category: 'reportes_detallados' },
  { key: 'detailedReport.downloadCsv', es: 'Descargar CSV', en: 'Download CSV', category: 'reportes_detallados' },
  { key: 'detailedReport.noResults', es: 'No se encontraron resultados para los filtros seleccionados.', en: 'No results found for the selected filters.', category: 'reportes_detallados' },
  { key: 'detailedReport.errorGenerating', es: 'Error al generar reporte', en: 'Error generating report', category: 'reportes_detallados' },
  // Report definition descriptions
  { key: 'reportDef.executiveSummary.desc', es: 'Vista general del presupuesto con indicadores clave de ejecución', en: 'Budget overview with key execution indicators', category: 'reportes_detallados' },
  { key: 'reportDef.budgetExecution.desc', es: 'Detalle de ejecución por cada gasto del presupuesto', en: 'Execution detail for each budget expense', category: 'reportes_detallados' },
  { key: 'reportDef.planVsReal.desc', es: 'Comparación mensual entre valores planificados y ejecutados', en: 'Monthly comparison between planned and executed values', category: 'reportes_detallados' },
  { key: 'reportDef.byFinancialCompany.desc', es: 'Agrupación de gastos y ejecución por empresa financiera', en: 'Expense grouping and execution by financial company', category: 'reportes_detallados' },
  { key: 'reportDef.byTechDirection.desc', es: 'Distribución de presupuesto por dirección tecnológica', en: 'Budget distribution by technology direction', category: 'reportes_detallados' },
  { key: 'reportDef.byUserArea.desc', es: 'Distribución de presupuesto por área usuaria', en: 'Budget distribution by user area', category: 'reportes_detallados' },
  { key: 'reportDef.detailedTransactions.desc', es: 'Listado completo de transacciones con filtros por tipo y período', en: 'Complete transaction list with type and period filters', category: 'reportes_detallados' },
  { key: 'reportDef.varianceAnalysis.desc', es: 'Identificación de gastos con mayor desviación respecto al plan', en: 'Identification of expenses with highest deviation from plan', category: 'reportes_detallados' },
  { key: 'reportDef.savingsDeferrals.desc', es: 'Reporte consolidado de ahorros y diferidos del presupuesto', en: 'Consolidated savings and deferrals report', category: 'reportes_detallados' },
  { key: 'reportDef.annualProjection.desc', es: 'Proyección de cierre anual basada en ejecución actual', en: 'Annual closing projection based on current execution', category: 'reportes_detallados' },
  // Report definition column labels
  { key: 'reportDef.col.indicator', es: 'Indicador', en: 'Indicator', category: 'reportes_detallados' },
  { key: 'reportDef.col.value', es: 'Valor', en: 'Value', category: 'reportes_detallados' },
  { key: 'reportDef.col.code', es: 'Código', en: 'Code', category: 'reportes_detallados' },
  { key: 'reportDef.col.description', es: 'Descripción', en: 'Description', category: 'reportes_detallados' },
  { key: 'reportDef.col.company', es: 'Empresa', en: 'Company', category: 'reportes_detallados' },
  { key: 'reportDef.col.planUsd', es: 'Plan USD', en: 'Plan USD', category: 'reportes_detallados' },
  { key: 'reportDef.col.committed', es: 'Comprometido', en: 'Committed', category: 'reportes_detallados' },
  { key: 'reportDef.col.real', es: 'Real', en: 'Real', category: 'reportes_detallados' },
  { key: 'reportDef.col.balance', es: 'Saldo', en: 'Balance', category: 'reportes_detallados' },
  { key: 'reportDef.col.executionPct', es: '% Ejec.', en: '% Exec.', category: 'reportes_detallados' },
  { key: 'reportDef.col.month', es: 'Mes', en: 'Month', category: 'reportes_detallados' },
  { key: 'reportDef.col.difference', es: 'Diferencia', en: 'Difference', category: 'reportes_detallados' },
  { key: 'reportDef.col.expenses', es: 'Gastos', en: 'Expenses', category: 'reportes_detallados' },
  { key: 'reportDef.col.pctTotal', es: '% del Total', en: '% of Total', category: 'reportes_detallados' },
  { key: 'reportDef.col.direction', es: 'Dirección', en: 'Direction', category: 'reportes_detallados' },
  { key: 'reportDef.col.area', es: 'Área', en: 'Area', category: 'reportes_detallados' },
  { key: 'reportDef.col.type', es: 'Tipo', en: 'Type', category: 'reportes_detallados' },
  { key: 'reportDef.col.expense', es: 'Gasto', en: 'Expense', category: 'reportes_detallados' },
  { key: 'reportDef.col.reference', es: 'Referencia', en: 'Reference', category: 'reportes_detallados' },
  { key: 'reportDef.col.currency', es: 'Moneda', en: 'Currency', category: 'reportes_detallados' },
  { key: 'reportDef.col.originalValue', es: 'Valor Original', en: 'Original Value', category: 'reportes_detallados' },
  { key: 'reportDef.col.usdValue', es: 'Valor USD', en: 'USD Value', category: 'reportes_detallados' },
  { key: 'reportDef.col.date', es: 'Fecha', en: 'Date', category: 'reportes_detallados' },
  { key: 'reportDef.col.executed', es: 'Ejecutado', en: 'Executed', category: 'reportes_detallados' },
  { key: 'reportDef.col.variance', es: 'Variación', en: 'Variance', category: 'reportes_detallados' },
  { key: 'reportDef.col.variancePct', es: 'Var. %', en: 'Var. %', category: 'reportes_detallados' },
  { key: 'reportDef.col.status', es: 'Estado', en: 'Status', category: 'reportes_detallados' },
  { key: 'reportDef.col.amountUsd', es: 'Monto USD', en: 'Amount USD', category: 'reportes_detallados' },
  { key: 'reportDef.col.period', es: 'Período', en: 'Period', category: 'reportes_detallados' },
  { key: 'reportDef.col.createdBy', es: 'Creado por', en: 'Created by', category: 'reportes_detallados' },
  { key: 'reportDef.col.realUsd', es: 'Real USD', en: 'Real USD', category: 'reportes_detallados' },
  { key: 'reportDef.col.projected', es: 'Proyectado', en: 'Projected', category: 'reportes_detallados' },
  { key: 'reportDef.col.cumPlan', es: 'Acum. Plan', en: 'Cum. Plan', category: 'reportes_detallados' },
  { key: 'reportDef.col.cumActual', es: 'Acum. Real/Proy', en: 'Cum. Real/Proj', category: 'reportes_detallados' },
  // Report definition filter labels
  { key: 'reportDef.filter.financialCompany', es: 'Empresa Financiera', en: 'Financial Company', category: 'reportes_detallados' },
  { key: 'reportDef.filter.monthFrom', es: 'Mes Desde', en: 'Month From', category: 'reportes_detallados' },
  { key: 'reportDef.filter.monthTo', es: 'Mes Hasta', en: 'Month To', category: 'reportes_detallados' },
  { key: 'reportDef.filter.type', es: 'Tipo', en: 'Type', category: 'reportes_detallados' },
  { key: 'reportDef.filter.committed', es: 'Comprometidas', en: 'Committed', category: 'reportes_detallados' },
  { key: 'reportDef.filter.real', es: 'Reales', en: 'Real', category: 'reportes_detallados' },

  // =============================================
  // CONFIGURACIÓN
  // =============================================
  { key: 'config.activeBudget', es: 'Presupuesto Vigente', en: 'Active Budget', category: 'configuracion' },
  { key: 'config.activeBudgetDesc', es: 'Selecciona el presupuesto que se usará como vigente en el Dashboard y reportes.', en: 'Select the budget to use as active in the Dashboard and reports.', category: 'configuracion' },
  { key: 'config.selectBudget', es: 'Seleccionar presupuesto', en: 'Select budget', category: 'configuracion' },
  { key: 'config.setActive', es: 'Establecer como Vigente', en: 'Set as Active', category: 'configuracion' },
  { key: 'config.currentActive', es: 'Vigente:', en: 'Active:', category: 'configuracion' },
  { key: 'config.changeActiveTitle', es: 'Cambiar Presupuesto Vigente', en: 'Change Active Budget', category: 'configuracion' },
  { key: 'config.changeActiveConfirm', es: '¿Estás seguro de cambiar el presupuesto vigente? Esto afectará el Dashboard y los reportes.', en: 'Are you sure you want to change the active budget? This will affect the Dashboard and reports.', category: 'configuracion' },
  { key: 'config.activeUpdated', es: 'Presupuesto vigente actualizado', en: 'Active budget updated', category: 'configuracion' },
  { key: 'config.language', es: 'Idioma', en: 'Language', category: 'configuracion' },
  { key: 'config.language_desc', es: 'Selecciona el idioma de la interfaz.', en: 'Select the interface language.', category: 'configuracion' },
  { key: 'config.font_size', es: 'Tamaño de Texto', en: 'Font Size', category: 'configuracion' },
  { key: 'config.font_size_desc', es: 'Ajusta el tamaño del texto en toda la aplicación.', en: 'Adjust the text size across the application.', category: 'configuracion' },
  { key: 'config.fontSize.xs', es: 'Muy pequeño', en: 'Very small', category: 'configuracion' },
  { key: 'config.fontSize.sm', es: 'Pequeño', en: 'Small', category: 'configuracion' },
  { key: 'config.fontSize.md', es: 'Normal', en: 'Normal', category: 'configuracion' },
  { key: 'config.fontSize.lg', es: 'Grande', en: 'Large', category: 'configuracion' },
  { key: 'config.fontSize.xl', es: 'Muy grande', en: 'Very large', category: 'configuracion' },
  { key: 'config.fontPreview', es: 'Vista previa:', en: 'Preview:', category: 'configuracion' },
  { key: 'config.fontPreviewText', es: 'Este es un texto de ejemplo con el tamaño seleccionado.', en: 'This is a sample text with the selected size.', category: 'configuracion' },
  { key: 'config.theme', es: 'Paleta de Colores / Tema', en: 'Color Palette / Theme', category: 'configuracion' },
  { key: 'config.theme_desc', es: 'Selecciona un tema. Pasa el cursor para ver un preview.', en: 'Select a theme. Hover to see a preview.', category: 'configuracion' },
  { key: 'config.themeActive', es: '✓ Activo', en: '✓ Active', category: 'configuracion' },
  { key: 'config.themePreview', es: 'Preview:', en: 'Preview:', category: 'configuracion' },
  { key: 'config.system_info', es: 'Información del Sistema', en: 'System Information', category: 'configuracion' },
  { key: 'config.sysApp', es: 'Aplicación:', en: 'Application:', category: 'configuracion' },
  { key: 'config.sysVersion', es: 'Versión:', en: 'Version:', category: 'configuracion' },
  { key: 'config.sysBackend', es: 'Backend:', en: 'Backend:', category: 'configuracion' },
  { key: 'config.sysFrontend', es: 'Frontend:', en: 'Frontend:', category: 'configuracion' },
  { key: 'config.sysDatabase', es: 'Base de Datos:', en: 'Database:', category: 'configuracion' },
  { key: 'config.sysHosting', es: 'Hosting:', en: 'Hosting:', category: 'configuracion' },

  // =============================================
  // DATOS MAESTROS
  // =============================================
  { key: 'masterData.techDirections', es: 'Dir. Tecnológicas', en: 'Tech Directions', category: 'datos_maestros' },
  { key: 'masterData.userAreas', es: 'Áreas de Usuario', en: 'User Areas', category: 'datos_maestros' },
  { key: 'masterData.companies', es: 'Empresas Financieras', en: 'Financial Companies', category: 'datos_maestros' },
  { key: 'masterData.expenseCategories', es: 'Categorías de Gasto', en: 'Expense Categories', category: 'datos_maestros' },
  { key: 'masterData.techDirection', es: 'Dirección Tecnológica', en: 'Technology Direction', category: 'datos_maestros' },
  { key: 'masterData.userArea', es: 'Área de Usuario', en: 'User Area', category: 'datos_maestros' },
  { key: 'masterData.financialCompany', es: 'Empresa Financiera', en: 'Financial Company', category: 'datos_maestros' },
  { key: 'masterData.expenseCategory', es: 'Categoría de Gasto', en: 'Expense Category', category: 'datos_maestros' },
  { key: 'masterData.newItem', es: '+ Nueva', en: '+ New', category: 'datos_maestros' },
  { key: 'masterData.editItem', es: 'Editar', en: 'Edit', category: 'datos_maestros' },
  { key: 'masterData.createItem', es: 'Crear', en: 'Create', category: 'datos_maestros' },
  { key: 'masterData.code', es: 'Código *', en: 'Code *', category: 'datos_maestros' },
  { key: 'masterData.name', es: 'Nombre *', en: 'Name *', category: 'datos_maestros' },
  { key: 'masterData.description', es: 'Descripción', en: 'Description', category: 'datos_maestros' },
  { key: 'masterData.taxId', es: 'RUT/Tax ID', en: 'Tax ID', category: 'datos_maestros' },
  { key: 'masterData.deleteConfirm', es: '¿Eliminar', en: 'Delete', category: 'datos_maestros' },
  { key: 'masterData.errorDeleting', es: 'Error al eliminar. Puede estar en uso.', en: 'Error deleting. It may be in use.', category: 'datos_maestros' },

  // =============================================
  // USUARIOS
  // =============================================
  { key: 'users.create', es: 'Crear Usuario', en: 'Create User', category: 'usuarios' },
  { key: 'users.edit', es: 'Editar Usuario', en: 'Edit User', category: 'usuarios' },
  { key: 'users.totalUsers', es: 'Total Usuarios', en: 'Total Users', category: 'usuarios' },
  { key: 'users.activeUsers', es: 'Activos', en: 'Active', category: 'usuarios' },
  { key: 'users.inactiveUsers', es: 'Inactivos', en: 'Inactive', category: 'usuarios' },
  { key: 'users.username', es: 'Usuario', en: 'Username', category: 'usuarios' },
  { key: 'users.name', es: 'Nombre', en: 'Name', category: 'usuarios' },
  { key: 'users.email', es: 'Email', en: 'Email', category: 'usuarios' },
  { key: 'users.roles', es: 'Roles', en: 'Roles', category: 'usuarios' },
  { key: 'users.lastLogin', es: 'Último Login', en: 'Last Login', category: 'usuarios' },
  { key: 'users.status', es: 'Estado', en: 'Status', category: 'usuarios' },
  { key: 'users.password', es: 'Contraseña', en: 'Password', category: 'usuarios' },
  { key: 'users.fullName', es: 'Nombre Completo', en: 'Full Name', category: 'usuarios' },
  { key: 'users.multiSelect', es: 'Ctrl/Cmd + click para seleccionar múltiples', en: 'Ctrl/Cmd + click to select multiple', category: 'usuarios' },
  { key: 'users.roleCount', es: 'rol(es)', en: 'role(s)', category: 'usuarios' },
  { key: 'users.errorSaving', es: 'Error al guardar usuario', en: 'Error saving user', category: 'usuarios' },
  { key: 'users.errorStatus', es: 'Error al cambiar estado del usuario', en: 'Error changing user status', category: 'usuarios' },

  // =============================================
  // ROLES
  // =============================================
  { key: 'roles.create', es: 'Crear Rol', en: 'Create Role', category: 'roles' },
  { key: 'roles.edit', es: 'Editar Rol', en: 'Edit Role', category: 'roles' },
  { key: 'roles.totalRoles', es: 'Total Roles', en: 'Total Roles', category: 'roles' },
  { key: 'roles.assignedUsers', es: 'Usuarios Asignados', en: 'Assigned Users', category: 'roles' },
  { key: 'roles.configuredPerms', es: 'Permisos Configurados', en: 'Configured Permissions', category: 'roles' },
  { key: 'roles.system', es: 'Sistema', en: 'System', category: 'roles' },
  { key: 'roles.globalApprover', es: 'Aprobador Global', en: 'Global Approver', category: 'roles' },
  { key: 'roles.areaApprover', es: 'Aprobador', en: 'Approver', category: 'roles' },
  { key: 'roles.areas', es: 'áreas', en: 'areas', category: 'roles' },
  { key: 'roles.users', es: 'usuarios', en: 'users', category: 'roles' },
  { key: 'roles.permissions', es: 'permisos', en: 'permissions', category: 'roles' },
  { key: 'roles.roleName', es: 'Nombre del Rol', en: 'Role Name', category: 'roles' },
  { key: 'roles.approverConfig', es: 'Configuración de Aprobador', en: 'Approver Configuration', category: 'roles' },
  { key: 'roles.approveAll', es: 'Aprobar todas las áreas de tecnología', en: 'Approve all technology areas', category: 'roles' },
  { key: 'roles.selectAreas', es: 'Seleccionar áreas de tecnología que puede aprobar:', en: 'Select technology areas that can be approved:', category: 'roles' },
  { key: 'roles.permissionsLabel', es: 'Permisos', en: 'Permissions', category: 'roles' },
  { key: 'roles.menuLabel', es: 'Menú', en: 'Menu', category: 'roles' },
  { key: 'roles.viewAll', es: 'Ver Todas', en: 'View All', category: 'roles' },
  { key: 'roles.viewOwn', es: 'Ver Propias', en: 'View Own', category: 'roles' },
  { key: 'roles.modifyAll', es: 'Modificar Todas', en: 'Modify All', category: 'roles' },
  { key: 'roles.modifyOwn', es: 'Modificar Propias', en: 'Modify Own', category: 'roles' },
  { key: 'roles.approvePerm', es: 'Aprobar', en: 'Approve', category: 'roles' },
  { key: 'roles.cantDeleteSystem', es: 'No se puede eliminar un rol del sistema', en: 'Cannot delete a system role', category: 'roles' },
  { key: 'roles.cantDeleteUsers', es: 'No se puede eliminar: tiene usuarios asignados', en: 'Cannot delete: has assigned users', category: 'roles' },
  { key: 'roles.deleteConfirm', es: '¿Eliminar el rol', en: 'Delete role', category: 'roles' },

  // =============================================
  // TRADUCCIONES
  // =============================================
  { key: 'translations.count', es: 'traducciones', en: 'translations', category: 'traducciones' },
  { key: 'translations.sections', es: 'secciones', en: 'sections', category: 'traducciones' },
  { key: 'translations.new', es: 'Nueva Traducción', en: 'New Translation', category: 'traducciones' },
  { key: 'translations.searchPlaceholder', es: 'Buscar por clave o texto...', en: 'Search by key or text...', category: 'traducciones' },
  { key: 'translations.allCategories', es: 'Todas las categorías', en: 'All categories', category: 'traducciones' },
  { key: 'translations.key', es: 'Clave', en: 'Key', category: 'traducciones' },
  { key: 'translations.spanish', es: 'Español', en: 'Spanish', category: 'traducciones' },
  { key: 'translations.english', es: 'English', en: 'English', category: 'traducciones' },
  { key: 'translations.cat', es: 'Cat.', en: 'Cat.', category: 'traducciones' },
  { key: 'translations.save', es: 'Guardar', en: 'Save', category: 'traducciones' },
  { key: 'translations.edit', es: 'Editar', en: 'Edit', category: 'traducciones' },
  { key: 'translations.delete', es: 'Eliminar', en: 'Delete', category: 'traducciones' },
  { key: 'translations.deleteConfirm', es: '¿Eliminar esta traducción?', en: 'Delete this translation?', category: 'traducciones' },
  { key: 'translations.loading', es: 'Cargando...', en: 'Loading...', category: 'traducciones' },

  // =============================================
  // AUDITORÍA
  // =============================================
  { key: 'page.audit', es: 'Auditoría', en: 'Audit Log', category: 'auditoria' },
  { key: 'audit.recordsFound', es: 'registros encontrados', en: 'records found', category: 'auditoria' },
  { key: 'audit.hideFilters', es: 'Ocultar filtros', en: 'Hide filters', category: 'auditoria' },
  { key: 'audit.showFilters', es: 'Mostrar filtros', en: 'Show filters', category: 'auditoria' },
  { key: 'audit.action', es: 'Acción', en: 'Action', category: 'auditoria' },
  { key: 'audit.entity', es: 'Entidad', en: 'Entity', category: 'auditoria' },
  { key: 'audit.from', es: 'Desde', en: 'From', category: 'auditoria' },
  { key: 'audit.to', es: 'Hasta', en: 'To', category: 'auditoria' },
  { key: 'audit.noRecords', es: 'No hay registros de auditoría', en: 'No audit records', category: 'auditoria' },
  { key: 'audit.dateTime', es: 'Fecha/Hora', en: 'Date/Time', category: 'auditoria' },
  { key: 'audit.user', es: 'Usuario', en: 'User', category: 'auditoria' },
  { key: 'audit.categoryCol', es: 'Categoría', en: 'Category', category: 'auditoria' },
  { key: 'audit.actionCol', es: 'Acción', en: 'Action', category: 'auditoria' },
  { key: 'audit.entityCol', es: 'Entidad', en: 'Entity', category: 'auditoria' },
  { key: 'audit.page', es: 'Página', en: 'Page', category: 'auditoria' },
  { key: 'audit.of', es: 'de', en: 'of', category: 'auditoria' },
  { key: 'audit.records', es: 'registros', en: 'records', category: 'auditoria' },
  { key: 'audit.noDetails', es: 'Sin detalles', en: 'No details', category: 'auditoria' },
  { key: 'audit.before', es: 'ANTES:', en: 'BEFORE:', category: 'auditoria' },
  { key: 'audit.after', es: 'DESPUÉS:', en: 'AFTER:', category: 'auditoria' },
  { key: 'audit.deleted', es: 'ELIMINADO', en: 'DELETED', category: 'auditoria' },
  { key: 'audit.recordDeleted', es: 'Registro eliminado', en: 'Record deleted', category: 'auditoria' },
  { key: 'audit.login', es: 'Inicio sesión', en: 'Login', category: 'auditoria' },
  { key: 'audit.logout', es: 'Cierre sesión', en: 'Logout', category: 'auditoria' },
  { key: 'audit.loginFailed', es: 'Login fallido', en: 'Login failed', category: 'auditoria' },
  { key: 'audit.view', es: 'Visualización', en: 'View', category: 'auditoria' },
  { key: 'audit.create', es: 'Creación', en: 'Creation', category: 'auditoria' },
  { key: 'audit.update', es: 'Modificación', en: 'Modification', category: 'auditoria' },
  { key: 'audit.deleteAction', es: 'Eliminación', en: 'Deletion', category: 'auditoria' },
  { key: 'audit.approve', es: 'Aprobación', en: 'Approval', category: 'auditoria' },
  { key: 'audit.reject', es: 'Rechazo', en: 'Rejection', category: 'auditoria' },
  { key: 'audit.createVersion', es: 'Nueva versión', en: 'New version', category: 'auditoria' },
  { key: 'audit.addToBudget', es: 'Agregar a presupuesto', en: 'Add to budget', category: 'auditoria' },
  { key: 'audit.changeStatus', es: 'Cambio estado', en: 'Status change', category: 'auditoria' },
  { key: 'audit.changePassword', es: 'Cambio contraseña', en: 'Password change', category: 'auditoria' },
  { key: 'audit.modifyTag', es: 'Modificar etiqueta', en: 'Modify tag', category: 'auditoria' },
  { key: 'audit.catSession', es: '🔐 Sesión', en: '🔐 Session', category: 'auditoria' },
  { key: 'audit.catNavigation', es: '👁 Navegación', en: '👁 Navigation', category: 'auditoria' },
  { key: 'audit.catWrite', es: '✏️ Escritura', en: '✏️ Write', category: 'auditoria' },

  // =============================================
  // PAGE TITLES (used in various places)
  // =============================================
  { key: 'page.dashboard', es: 'Dashboard', en: 'Dashboard', category: 'common' },
  { key: 'page.budgets', es: 'Presupuestos', en: 'Budgets', category: 'common' },
  { key: 'page.expenses', es: 'Gastos', en: 'Expenses', category: 'common' },
  { key: 'page.savings', es: 'Ahorros', en: 'Savings', category: 'common' },
  { key: 'page.deferrals', es: 'Diferidos', en: 'Deferrals', category: 'common' },
  { key: 'page.configuration', es: 'Configuración', en: 'Configuration', category: 'common' },
  { key: 'page.translations', es: 'Gestión de Traducciones', en: 'Translation Management', category: 'common' },
  { key: 'page.detailedReports', es: 'Reportes Detallados', en: 'Detailed Reports', category: 'common' },
  { key: 'page.compareBudgets', es: 'Comparar Presupuestos', en: 'Compare Budgets', category: 'common' },
  { key: 'page.masterData', es: 'Datos Maestros', en: 'Master Data', category: 'common' },
  { key: 'page.users', es: 'Gestión de Usuarios', en: 'User Management', category: 'common' },
  { key: 'page.roles', es: 'Gestión de Roles', en: 'Role Management', category: 'common' },
  { key: 'page.approvals', es: 'Aprobaciones Pendientes', en: 'Pending Approvals', category: 'common' },

  // =============================================
  // TOPBAR
  // =============================================
  { key: 'topbar.language', es: 'Idioma', en: 'Language', category: 'topbar' },
  { key: 'topbar.fontSize', es: 'Tamaño de texto', en: 'Font size', category: 'topbar' },
  { key: 'topbar.theme', es: 'Paleta de colores', en: 'Color palette', category: 'topbar' },
  { key: 'topbar.darkMode', es: 'Modo oscuro', en: 'Dark mode', category: 'topbar' },
  { key: 'topbar.lightMode', es: 'Modo claro', en: 'Light mode', category: 'topbar' },
  { key: 'topbar.notifications', es: 'Aprobaciones pendientes', en: 'Pending approvals', category: 'topbar' },
  { key: 'topbar.editProfile', es: 'Editar perfil', en: 'Edit profile', category: 'topbar' },
  { key: 'topbar.viewProfile', es: 'Ver perfil', en: 'View profile', category: 'topbar' },
  { key: 'topbar.firstName', es: 'Nombre', en: 'First name', category: 'topbar' },
  { key: 'topbar.lastName', es: 'Apellido', en: 'Last name', category: 'topbar' },
  { key: 'topbar.email', es: 'Correo electrónico', en: 'Email', category: 'topbar' },
  { key: 'topbar.username', es: 'Usuario', en: 'Username', category: 'topbar' },
  { key: 'topbar.roles', es: 'Roles', en: 'Roles', category: 'topbar' },
  { key: 'topbar.status', es: 'Estado', en: 'Status', category: 'topbar' },
  { key: 'topbar.active', es: 'Activo', en: 'Active', category: 'topbar' },
  { key: 'topbar.inactive', es: 'Inactivo', en: 'Inactive', category: 'topbar' },
  { key: 'topbar.lastLogin', es: 'Último acceso', en: 'Last login', category: 'topbar' },
  { key: 'topbar.memberSince', es: 'Miembro desde', en: 'Member since', category: 'topbar' },

  // =============================================
  // BUDGET CONFIRMATION
  // =============================================
  { key: 'budgetConfirmation.title', es: 'Confirmación de Presupuesto', en: 'Budget Confirmation', category: 'budgetConfirmation' },
  { key: 'budgetConfirmation.requestMassive', es: 'Solicitar Confirmación Masiva', en: 'Request Massive Confirmation', category: 'budgetConfirmation' },
  { key: 'budgetConfirmation.requestIndividual', es: 'Solicitar', en: 'Request', category: 'budgetConfirmation' },
  { key: 'budgetConfirmation.pendingBanner', es: 'Tienes confirmaciones de presupuesto pendientes', en: 'You have pending budget confirmations', category: 'budgetConfirmation' },
  { key: 'budgetConfirmation.declarationText', es: 'Declaro que todas mis líneas de presupuesto están correctas', en: 'I declare that all my budget lines are correct', category: 'budgetConfirmation' },
  { key: 'budgetConfirmation.confirm', es: 'Confirmar', en: 'Confirm', category: 'budgetConfirmation' },
  { key: 'budgetConfirmation.cancel', es: 'Cancelar', en: 'Cancel', category: 'budgetConfirmation' },
  { key: 'budgetConfirmation.reminderTitle', es: 'Confirmación Pendiente', en: 'Pending Confirmation', category: 'budgetConfirmation' },
  { key: 'budgetConfirmation.reminderText', es: 'Tienes una solicitud de confirmación de presupuesto pendiente', en: 'You have a pending budget confirmation request', category: 'budgetConfirmation' },
  { key: 'budgetConfirmation.goConfirm', es: 'Ir a Confirmar', en: 'Go to Confirm', category: 'budgetConfirmation' },
  { key: 'budgetConfirmation.remindLater', es: 'Recordar más tarde', en: 'Remind me later', category: 'budgetConfirmation' },
  { key: 'budgetConfirmation.confirmed', es: 'Confirmado', en: 'Confirmed', category: 'budgetConfirmation' },
  { key: 'budgetConfirmation.pending', es: 'Pendiente', en: 'Pending', category: 'budgetConfirmation' },
  { key: 'budgetConfirmation.massive', es: 'Masiva', en: 'Massive', category: 'budgetConfirmation' },
  { key: 'budgetConfirmation.individual', es: 'Individual', en: 'Individual', category: 'budgetConfirmation' },
  { key: 'budgetConfirmation.progress', es: 'Progreso', en: 'Progress', category: 'budgetConfirmation' },
  { key: 'budgetConfirmation.requestDate', es: 'Fecha de Solicitud', en: 'Request Date', category: 'budgetConfirmation' },
  { key: 'budgetConfirmation.confirmedAt', es: 'Confirmado el', en: 'Confirmed at', category: 'budgetConfirmation' },
  { key: 'budgetConfirmation.noRequests', es: 'No hay solicitudes de confirmación', en: 'No confirmation requests', category: 'budgetConfirmation' },
  { key: 'budgetConfirmation.alreadyPending', es: 'Ya existe una solicitud pendiente para este usuario', en: 'A pending request already exists for this user', category: 'budgetConfirmation' },
  { key: 'budgetConfirmation.success', es: 'Confirmación registrada exitosamente', en: 'Confirmation registered successfully', category: 'budgetConfirmation' },
  { key: 'budgetConfirmation.requestCreated', es: 'Solicitud de confirmación creada', en: 'Confirmation request created', category: 'budgetConfirmation' },
  { key: 'budgetConfirmation.usersWithLines', es: 'Usuarios con líneas asignadas', en: 'Users with assigned lines', category: 'budgetConfirmation' },
  { key: 'budgetConfirmation.detail', es: 'Detalle de Solicitud', en: 'Request Detail', category: 'budgetConfirmation' },

  // Computed Budget / Transactional Rules
  { key: 'budget.showBaseValues', es: 'Mostrar valores base (sin ajustes)', en: 'Show base values (no adjustments)', category: 'budget' },
  { key: 'budget.showSummary', es: 'Ver Resumen Mensual', en: 'View Monthly Summary', category: 'budget' },
  { key: 'budget.hideSummary', es: 'Ocultar Resumen', en: 'Hide Summary', category: 'budget' },
  { key: 'budget.concept', es: 'Concepto', en: 'Concept', category: 'budget' },
  { key: 'budget.baseValues', es: 'Base', en: 'Base', category: 'budget' },
  { key: 'budget.savings', es: 'Ahorros', en: 'Savings', category: 'budget' },
  { key: 'budget.corrections', es: 'Correcciones', en: 'Corrections', category: 'budget' },
  { key: 'budget.computedTotal', es: 'Total Computado', en: 'Computed Total', category: 'budget' },
  { key: 'config.versionSnapshot', es: 'Consolidar Versión', en: 'Consolidate Version', category: 'config' },
  { key: 'config.createSnapshot', es: 'Crear Nueva Versión', en: 'Create New Version', category: 'config' },
  { key: 'config.snapshotDesc', es: 'Consolida todos los ajustes (ahorros, correcciones aprobadas) del presupuesto vigente en una nueva versión. Los valores computados se escriben como nuevos valores base.', en: 'Consolidates all adjustments (savings, approved corrections) from the active budget into a new version. Computed values are written as new base values.', category: 'config' },
  { key: 'config.snapshotWarningTitle', es: 'Confirmar Consolidación', en: 'Confirm Consolidation', category: 'config' },
  { key: 'config.snapshotWarning', es: 'Esta acción creará una nueva versión del presupuesto vigente con todos los ajustes consolidados como valores base. Los ahorros activos y correcciones aprobadas se reflejarán en los nuevos valores. Esta acción no se puede deshacer.', en: 'This action will create a new version of the active budget with all adjustments consolidated as base values. Active savings and approved corrections will be reflected in the new values. This action cannot be undone.', category: 'config' },
  { key: 'config.confirmSnapshot', es: 'Confirmar y Crear', en: 'Confirm and Create', category: 'config' },
  { key: 'config.snapshotCreated', es: 'Nueva versión creada con valores consolidados', en: 'New version created with consolidated values', category: 'config' },

  // =============================================
  // HELP CENTER — Menu
  // =============================================
  { key: 'menu.help', es: 'Ayuda', en: 'Help', category: 'menu' },

  // =============================================
  // HELP CENTER — General
  // =============================================
  { key: 'help.title', es: 'Centro de Ayuda', en: 'Help Center', category: 'help' },
  { key: 'help.searchPlaceholder', es: 'Buscar en la ayuda...', en: 'Search help...', category: 'help' },
  { key: 'help.searchAriaLabel', es: 'Buscar contenido de ayuda', en: 'Search help content', category: 'help' },
  { key: 'help.noResults', es: 'No se encontraron resultados para', en: 'No results found for', category: 'help' },
  { key: 'help.tocTitle', es: 'Contenido', en: 'Contents', category: 'help' },

  // =============================================
  // HELP CENTER — Budget Calculation Section
  // =============================================
  { key: 'help.section.budgetCalc.title', es: '¿Qué es un Presupuesto?', en: 'What is a Budget?', category: 'help' },
  { key: 'help.section.budgetCalc.description1', es: 'En InvestIQ, un presupuesto es el plan financiero anual de tu organización. Contiene líneas presupuestarias, cada una con valores planificados para los 12 meses del año (M1 a M12). Cada línea está asociada a un gasto (Expense), una compañía financiera y una moneda.', en: 'In InvestIQ, a budget is your organization\'s annual financial plan. It contains budget lines, each with planned values for the 12 months of the year (M1 to M12). Each line is associated with an expense, a financial company, and a currency.', category: 'help' },
  { key: 'help.section.budgetCalc.description2', es: 'El valor computado de cada línea se calcula con la fórmula: Valor Computado = Valor Base (Plan) − Ahorros + Correcciones (Diferidos). Esto permite que el presupuesto refleje ajustes sin perder los valores originales.', en: 'The computed value of each line is calculated with the formula: Computed Value = Base Value (Plan) − Savings + Corrections (Deferrals). This allows the budget to reflect adjustments without losing the original values.', category: 'help' },
  { key: 'help.section.budgetCalc.description3', es: 'Las transacciones comprometidas (COMMITTED) representan compromisos de gasto — contratos firmados, órdenes de compra emitidas. Las transacciones reales (REAL) representan gastos efectivamente ejecutados y pagados.', en: 'Committed transactions represent spending commitments — signed contracts, issued purchase orders. Real transactions represent expenses that have been actually executed and paid.', category: 'help' },
  { key: 'help.section.budgetCalc.description4', es: 'La varianza mide la diferencia entre lo presupuestado y lo ejecutado. Una varianza positiva indica que se gastó menos de lo planificado; una negativa indica sobregasto. Monitorear la varianza es clave para el control financiero.', en: 'Variance measures the difference between budgeted and executed amounts. A positive variance indicates underspending; a negative one indicates overspending. Monitoring variance is key for financial control.', category: 'help' },
  { key: 'help.section.budgetCalc.description5', es: 'Los tipos de cambio permiten convertir valores de moneda local a USD. Cada presupuesto tiene tasas configuradas por moneda y por mes, asegurando que los reportes consolidados reflejen valores comparables.', en: 'Exchange rates allow converting local currency values to USD. Each budget has rates configured by currency and month, ensuring consolidated reports reflect comparable values.', category: 'help' },
  { key: 'help.section.budgetCalc.description6', es: 'El flujo completo es: se define un Plan (valores base) → se aplican Ahorros (reducciones) y Diferidos (correcciones) → se obtiene el Valor Computado → se registran transacciones Comprometidas → finalmente se registran transacciones Reales.', en: 'The complete flow is: a Plan is defined (base values) → Savings (reductions) and Deferrals (corrections) are applied → the Computed Value is obtained → Committed transactions are recorded → finally Real transactions are recorded.', category: 'help' },
  { key: 'help.section.budgetCalc.description7', es: 'InvestIQ soporta múltiples versiones de presupuesto por año. Solo una versión puede estar marcada como "vigente" (activa) en cualquier momento. Las versiones anteriores se conservan para comparación histórica.', en: 'InvestIQ supports multiple budget versions per year. Only one version can be marked as "active" at any time. Previous versions are preserved for historical comparison.', category: 'help' },

  // =============================================
  // HELP CENTER — Dashboard Section
  // =============================================
  { key: 'help.section.dashboard.title', es: 'Dashboard', en: 'Dashboard', category: 'help' },
  { key: 'help.section.dashboard.description1', es: 'El Dashboard es la vista principal de InvestIQ. Muestra un resumen ejecutivo del presupuesto vigente con KPIs clave: presupuesto total, comprometido total, real total y la diferencia entre presupuesto y real.', en: 'The Dashboard is InvestIQ\'s main view. It shows an executive summary of the active budget with key KPIs: total budget, total committed, total real, and the difference between budget and real.', category: 'help' },
  { key: 'help.section.dashboard.description2', es: 'Los gráficos del Dashboard incluyen: distribución del presupuesto por categoría de gasto, tendencias mensuales de ejecución, y una comparación visual entre presupuesto, comprometido y real.', en: 'Dashboard charts include: budget distribution by expense category, monthly execution trends, and a visual comparison between budget, committed, and real.', category: 'help' },
  { key: 'help.section.dashboard.description3', es: 'También puedes ver los totales desglosados por compañía financiera, lo que permite identificar rápidamente qué entidades tienen mayor ejecución presupuestaria.', en: 'You can also view totals broken down by financial company, allowing you to quickly identify which entities have the highest budget execution.', category: 'help' },

  // =============================================
  // HELP CENTER — Budgets Section
  // =============================================
  { key: 'help.section.budgets.title', es: 'Presupuestos', en: 'Budgets', category: 'help' },
  { key: 'help.section.budgets.description1', es: 'La página de Presupuestos muestra una tabla con todas las líneas presupuestarias del presupuesto seleccionado. Cada línea tiene un gasto asociado, una compañía financiera, una moneda y valores para cada mes (M1-M12).', en: 'The Budgets page shows a table with all budget lines for the selected budget. Each line has an associated expense, financial company, currency, and values for each month (M1-M12).', category: 'help' },
  { key: 'help.section.budgets.description2', es: 'Puedes editar los valores de las celdas directamente en la tabla. Los cambios se guardan automáticamente. Los valores de ahorros y correcciones se superponen sobre los valores base para calcular el valor computado.', en: 'You can edit cell values directly in the table. Changes are saved automatically. Savings and correction values are overlaid on base values to calculate the computed value.', category: 'help' },
  { key: 'help.section.budgets.description3', es: 'El flujo de confirmación permite al administrador solicitar que los usuarios confirmen sus líneas presupuestarias. Cada usuario revisa y confirma las líneas que le corresponden.', en: 'The confirmation flow allows the administrator to request that users confirm their budget lines. Each user reviews and confirms the lines assigned to them.', category: 'help' },
  { key: 'help.section.budgets.description4', es: 'Si necesitas modificar una línea después de la confirmación, puedes enviar una Solicitud de Cambio que será revisada por un aprobador antes de aplicarse.', en: 'If you need to modify a line after confirmation, you can submit a Change Request that will be reviewed by an approver before being applied.', category: 'help' },

  // =============================================
  // HELP CENTER — Budget Compare Section
  // =============================================
  { key: 'help.section.budgetCompare.title', es: 'Comparar Presupuestos', en: 'Compare Budgets', category: 'help' },
  { key: 'help.section.budgetCompare.description1', es: 'Esta herramienta permite seleccionar dos versiones de presupuesto del mismo año y compararlas lado a lado. Puedes ver qué gastos se agregaron, eliminaron o modificaron entre versiones.', en: 'This tool allows you to select two budget versions from the same year and compare them side by side. You can see which expenses were added, removed, or modified between versions.', category: 'help' },
  { key: 'help.section.budgetCompare.description2', es: 'Las diferencias se resaltan visualmente con colores: verde para valores que disminuyeron, rojo para valores que aumentaron. También se muestran los porcentajes de cambio para facilitar el análisis.', en: 'Differences are visually highlighted with colors: green for decreased values, red for increased values. Change percentages are also shown to facilitate analysis.', category: 'help' },

  // =============================================
  // HELP CENTER — Savings Section
  // =============================================
  { key: 'help.section.savings.title', es: 'Ahorros', en: 'Savings', category: 'help' },
  { key: 'help.section.savings.description1', es: 'Un ahorro es una reducción planificada sobre una línea presupuestaria. Se crea asociado a una línea específica y se distribuye en valores mensuales (M1-M12). Los ahorros permiten reflejar reducciones sin modificar los valores base del plan.', en: 'A saving is a planned reduction on a budget line. It is created associated with a specific line and distributed in monthly values (M1-M12). Savings allow reflecting reductions without modifying the plan\'s base values.', category: 'help' },
  { key: 'help.section.savings.description2', es: 'Los ahorros tienen dos estados: PENDING (pendiente de activación) y ACTIVE (activo, afectando el presupuesto). Solo los ahorros ACTIVE reducen el valor computado del presupuesto. Un administrador puede activar un ahorro pendiente.', en: 'Savings have two states: PENDING (awaiting activation) and ACTIVE (active, affecting the budget). Only ACTIVE savings reduce the budget\'s computed value. An administrator can activate a pending saving.', category: 'help' },
  { key: 'help.section.savings.description3', es: 'El efecto de un ahorro se visualiza en la tabla de presupuestos: el valor computado de cada mes se reduce por el monto del ahorro correspondiente. Esto permite ver el impacto real de las reducciones planificadas.', en: 'The effect of a saving is visualized in the budget table: each month\'s computed value is reduced by the corresponding saving amount. This allows seeing the real impact of planned reductions.', category: 'help' },

  // =============================================
  // HELP CENTER — Deferrals Section
  // =============================================
  { key: 'help.section.deferrals.title', es: 'Diferidos', en: 'Deferrals', category: 'help' },
  { key: 'help.section.deferrals.description1', es: 'Un diferido es una corrección presupuestaria que redistribuye un monto total entre un rango de meses (mes inicio a mes fin). El monto se divide equitativamente entre los meses del rango seleccionado.', en: 'A deferral is a budget correction that redistributes a total amount across a range of months (start month to end month). The amount is divided equally among the months in the selected range.', category: 'help' },
  { key: 'help.section.deferrals.description2', es: 'Los diferidos actúan como correcciones positivas que se suman al valor computado del presupuesto. Son útiles para reflejar gastos que se redistribuyen temporalmente o ajustes que no estaban en el plan original.', en: 'Deferrals act as positive corrections that are added to the budget\'s computed value. They are useful for reflecting expenses that are temporarily redistributed or adjustments not in the original plan.', category: 'help' },

  // =============================================
  // HELP CENTER — Approvals Section
  // =============================================
  { key: 'help.section.approvals.title', es: 'Aprobaciones', en: 'Approvals', category: 'help' },
  { key: 'help.section.approvals.description1', es: 'El módulo de Aprobaciones gestiona las Solicitudes de Cambio (Change Requests) sobre líneas presupuestarias. Cuando un usuario necesita modificar valores ya confirmados, envía una solicitud que debe ser aprobada.', en: 'The Approvals module manages Change Requests on budget lines. When a user needs to modify already confirmed values, they submit a request that must be approved.', category: 'help' },
  { key: 'help.section.approvals.description2', es: 'Cada solicitud contiene: los valores actuales vs los propuestos para cada mes, un comentario de justificación, y el usuario solicitante. Los aprobadores pueden ver el detalle completo antes de decidir.', en: 'Each request contains: current vs proposed values for each month, a justification comment, and the requesting user. Approvers can see the full detail before deciding.', category: 'help' },
  { key: 'help.section.approvals.description3', es: 'Los estados de una solicitud son: PENDING (pendiente de revisión), APPROVED (aprobada y aplicada al presupuesto) o REJECTED (rechazada, sin cambios). El historial de aprobaciones queda registrado para auditoría.', en: 'Request states are: PENDING (awaiting review), APPROVED (approved and applied to the budget), or REJECTED (rejected, no changes). The approval history is recorded for audit purposes.', category: 'help' },

  // =============================================
  // HELP CENTER — Expenses Section
  // =============================================
  { key: 'help.section.expenses.title', es: 'Gastos', en: 'Expenses', category: 'help' },
  { key: 'help.section.expenses.description1', es: 'El catálogo de Gastos define los conceptos de gasto disponibles para las líneas presupuestarias. Cada gasto tiene: código único, descripción corta, descripción larga, direcciones tecnológicas, áreas de usuario, categoría y tags.', en: 'The Expenses catalog defines the spending concepts available for budget lines. Each expense has: unique code, short description, long description, technology directions, user areas, category, and tags.', category: 'help' },
  { key: 'help.section.expenses.description2', es: 'Los gastos se vinculan a las líneas presupuestarias al crear o editar una línea. Las categorías permiten agrupar gastos para reportes y análisis. Los tags facilitan la búsqueda y filtrado rápido.', en: 'Expenses are linked to budget lines when creating or editing a line. Categories allow grouping expenses for reports and analysis. Tags facilitate quick search and filtering.', category: 'help' },

  // =============================================
  // HELP CENTER — Transactions Section
  // =============================================
  { key: 'help.section.transactions.title', es: 'Transacciones', en: 'Transactions', category: 'help' },
  { key: 'help.section.transactions.description1', es: 'InvestIQ maneja dos tipos de transacciones: Comprometidas (COMMITTED) y Reales (REAL). Las comprometidas representan compromisos de gasto como contratos u órdenes de compra. Las reales representan pagos efectivos.', en: 'InvestIQ handles two types of transactions: Committed and Real. Committed transactions represent spending commitments like contracts or purchase orders. Real transactions represent actual payments.', category: 'help' },
  { key: 'help.section.transactions.description2', es: 'Cada transacción incluye: fecha de servicio, fecha de contabilización, documento de referencia, moneda, valor en moneda local y conversión automática a USD usando los tipos de cambio configurados.', en: 'Each transaction includes: service date, posting date, reference document, currency, value in local currency, and automatic conversion to USD using configured exchange rates.', category: 'help' },
  { key: 'help.section.transactions.description3', es: 'El mecanismo de compensación permite que una transacción REAL compense (total o parcialmente) una transacción COMMITTED. Esto refleja el ciclo natural: primero se compromete el gasto, luego se ejecuta.', en: 'The compensation mechanism allows a REAL transaction to offset (fully or partially) a COMMITTED transaction. This reflects the natural cycle: first the expense is committed, then executed.', category: 'help' },
  { key: 'help.section.transactions.description4', es: 'La compensación parcial permite que un pago real cubra solo una parte del compromiso original, dejando el saldo restante como comprometido pendiente.', en: 'Partial compensation allows a real payment to cover only part of the original commitment, leaving the remaining balance as pending committed.', category: 'help' },

  // =============================================
  // HELP CENTER — Exchange Rates Section
  // =============================================
  { key: 'help.section.exchangeRates.title', es: 'Tipos de Cambio', en: 'Exchange Rates', category: 'help' },
  { key: 'help.section.exchangeRates.description1', es: 'Los tipos de cambio definen las tasas de conversión de moneda local a USD. Se configuran por moneda, por mes y por presupuesto, permitiendo reflejar variaciones cambiarias a lo largo del año.', en: 'Exchange rates define conversion rates from local currency to USD. They are configured by currency, month, and budget, allowing currency variations throughout the year to be reflected.', category: 'help' },
  { key: 'help.section.exchangeRates.description2', es: 'Cuando se registra una transacción en moneda local, InvestIQ aplica automáticamente el tipo de cambio correspondiente para calcular el equivalente en USD. Esto permite consolidar reportes en una moneda única.', en: 'When a transaction is recorded in local currency, InvestIQ automatically applies the corresponding exchange rate to calculate the USD equivalent. This allows consolidating reports in a single currency.', category: 'help' },

  // =============================================
  // HELP CENTER — Reports Section
  // =============================================
  { key: 'help.section.reports.title', es: 'Reportes', en: 'Reports', category: 'help' },
  { key: 'help.section.reports.description1', es: 'La sección de Reportes ofrece gráficos visuales interactivos: distribución del presupuesto por categoría de gasto, tendencias mensuales de ejecución, y comparación entre presupuesto, comprometido y real.', en: 'The Reports section offers interactive visual charts: budget distribution by expense category, monthly execution trends, and comparison between budget, committed, and real.', category: 'help' },
  { key: 'help.section.reports.description2', es: 'Los gráficos se actualizan automáticamente al cambiar el presupuesto seleccionado. Puedes filtrar por compañía, categoría o dirección tecnológica para obtener vistas más específicas.', en: 'Charts update automatically when changing the selected budget. You can filter by company, category, or technology direction for more specific views.', category: 'help' },

  // =============================================
  // HELP CENTER — Detailed Reports Section
  // =============================================
  { key: 'help.section.detailedReports.title', es: 'Reportes Detallados', en: 'Detailed Reports', category: 'help' },
  { key: 'help.section.detailedReports.description1', es: 'Los Reportes Detallados ofrecen análisis profundos exportables a Excel: resumen ejecutivo, ejecución presupuestaria, plan vs real, análisis por compañía, por dirección tecnológica, por área de usuario, análisis de varianza, ahorros/diferidos y proyección anual.', en: 'Detailed Reports offer in-depth exportable analyses to Excel: executive summary, budget execution, plan vs real, analysis by company, by technology direction, by user area, variance analysis, savings/deferrals, and annual projection.', category: 'help' },
  { key: 'help.section.detailedReports.description2', es: 'Cada reporte puede descargarse en formato Excel para compartir con stakeholders o para análisis adicional fuera de la plataforma.', en: 'Each report can be downloaded in Excel format to share with stakeholders or for additional analysis outside the platform.', category: 'help' },

  // =============================================
  // HELP CENTER — Configuration Section
  // =============================================
  { key: 'help.section.configuration.title', es: 'Configuración', en: 'Configuration', category: 'help' },
  { key: 'help.section.configuration.description1', es: 'La sección de Configuración permite a los administradores gestionar presupuestos: crear nuevos presupuestos (opcionalmente copiando desde uno existente), eliminar presupuestos, y establecer cuál es el presupuesto vigente (activo).', en: 'The Configuration section allows administrators to manage budgets: create new budgets (optionally copying from an existing one), delete budgets, and set which budget is active.', category: 'help' },
  { key: 'help.section.configuration.description2', es: 'También permite crear snapshots (consolidaciones) que toman los valores computados actuales y los escriben como nuevos valores base en una nueva versión, consolidando todos los ajustes.', en: 'It also allows creating snapshots (consolidations) that take current computed values and write them as new base values in a new version, consolidating all adjustments.', category: 'help' },
  { key: 'help.section.configuration.description3', es: 'Desde aquí se configura el tema visual de la aplicación y el idioma por defecto del sistema.', en: 'From here you can configure the application\'s visual theme and the system\'s default language.', category: 'help' },

  // =============================================
  // HELP CENTER — Master Data Section
  // =============================================
  { key: 'help.section.masterData.title', es: 'Datos Maestros', en: 'Master Data', category: 'help' },
  { key: 'help.section.masterData.description1', es: 'Los Datos Maestros son las entidades base que se usan en toda la plataforma: Direcciones Tecnológicas, Áreas de Usuario, Compañías Financieras y Categorías de Gastos.', en: 'Master Data are the base entities used throughout the platform: Technology Directions, User Areas, Financial Companies, and Expense Categories.', category: 'help' },
  { key: 'help.section.masterData.description2', es: 'Estas entidades se configuran una vez y se referencian desde presupuestos, gastos y transacciones. Modificar un dato maestro afecta a todos los registros que lo referencian.', en: 'These entities are configured once and referenced from budgets, expenses, and transactions. Modifying a master data entry affects all records that reference it.', category: 'help' },

  // =============================================
  // HELP CENTER — Users & Roles Section
  // =============================================
  { key: 'help.section.usersRoles.title', es: 'Usuarios y Roles', en: 'Users & Roles', category: 'help' },
  { key: 'help.section.usersRoles.description1', es: 'La gestión de usuarios permite crear cuentas, asignar roles y controlar el acceso a la plataforma. Cada usuario tiene un nombre, email, contraseña y uno o más roles asignados.', en: 'User management allows creating accounts, assigning roles, and controlling platform access. Each user has a name, email, password, and one or more assigned roles.', category: 'help' },
  { key: 'help.section.usersRoles.description2', es: 'Los roles definen permisos por módulo. Los tipos de permiso son: VIEW (ver datos), VIEW_OWN (ver solo propios), MODIFY (modificar datos), MODIFY_OWN (modificar solo propios) y APPROVE_BUDGET (aprobar solicitudes de cambio).', en: 'Roles define permissions per module. Permission types are: VIEW (view data), VIEW_OWN (view own only), MODIFY (modify data), MODIFY_OWN (modify own only), and APPROVE_BUDGET (approve change requests).', category: 'help' },
  { key: 'help.section.usersRoles.description3', es: 'Cada módulo tiene un menuCode que controla su visibilidad en el sidebar. Si un usuario no tiene permiso VIEW para un menuCode, ese módulo no aparece en su navegación.', en: 'Each module has a menuCode that controls its visibility in the sidebar. If a user doesn\'t have VIEW permission for a menuCode, that module won\'t appear in their navigation.', category: 'help' },

  // =============================================
  // HELP CENTER — Translations Section
  // =============================================
  { key: 'help.section.translations.title', es: 'Traducciones', en: 'Translations', category: 'help' },
  { key: 'help.section.translations.description1', es: 'InvestIQ soporta múltiples idiomas (español e inglés). El sistema i18n gestiona claves de traducción organizadas por categoría. Cada clave tiene un valor en español y otro en inglés.', en: 'InvestIQ supports multiple languages (Spanish and English). The i18n system manages translation keys organized by category. Each key has a Spanish and an English value.', category: 'help' },
  { key: 'help.section.translations.description2', es: 'Los administradores pueden editar las traducciones existentes o agregar nuevas desde la página de Traducciones. El cambio de idioma se aplica inmediatamente sin recargar la página.', en: 'Administrators can edit existing translations or add new ones from the Translations page. Language changes are applied immediately without reloading the page.', category: 'help' },

  // =============================================
  // HELP CENTER — Audit Section
  // =============================================
  { key: 'help.section.audit.title', es: 'Auditoría', en: 'Audit Log', category: 'help' },
  { key: 'help.section.audit.description1', es: 'El registro de Auditoría captura todas las acciones importantes realizadas en la plataforma: creación, modificación y eliminación de registros. Cada entrada incluye: usuario, acción, entidad afectada, detalles del cambio, dirección IP y fecha/hora.', en: 'The Audit Log captures all important actions performed on the platform: creation, modification, and deletion of records. Each entry includes: user, action, affected entity, change details, IP address, and date/time.', category: 'help' },
  { key: 'help.section.audit.description2', es: 'Puedes filtrar el historial por usuario, tipo de acción o entidad para encontrar rápidamente los cambios que necesitas revisar. El log de auditoría es de solo lectura y no puede ser modificado.', en: 'You can filter the history by user, action type, or entity to quickly find the changes you need to review. The audit log is read-only and cannot be modified.', category: 'help' },

  // =============================================
  // HELP CENTER — SVG Infographic Labels
  // =============================================
  // Budget Flow
  { key: 'help.infographic.budgetFlow.plan', es: 'Plan (Base)', en: 'Plan (Base)', category: 'help' },
  { key: 'help.infographic.budgetFlow.savings', es: 'Ahorros', en: 'Savings', category: 'help' },
  { key: 'help.infographic.budgetFlow.deferrals', es: 'Diferidos', en: 'Deferrals', category: 'help' },
  { key: 'help.infographic.budgetFlow.computed', es: 'Valor Computado', en: 'Computed Value', category: 'help' },
  { key: 'help.infographic.budgetFlow.committed', es: 'Comprometido', en: 'Committed', category: 'help' },
  { key: 'help.infographic.budgetFlow.real', es: 'Real', en: 'Real', category: 'help' },
  { key: 'help.infographic.budgetFlow.formula', es: 'Computado = Plan − Ahorros + Diferidos', en: 'Computed = Plan − Savings + Deferrals', category: 'help' },
  { key: 'help.infographic.budgetFlow.subtract', es: 'Resta', en: 'Subtract', category: 'help' },
  { key: 'help.infographic.budgetFlow.add', es: 'Suma', en: 'Add', category: 'help' },
  { key: 'help.infographic.budgetFlow.compare', es: 'Comparar', en: 'Compare', category: 'help' },
  // Transaction Flow
  { key: 'help.infographic.transactionFlow.title', es: 'Flujo de Compensación', en: 'Compensation Flow', category: 'help' },
  { key: 'help.infographic.transactionFlow.committed', es: 'Trans. Comprometida', en: 'Committed Trans.', category: 'help' },
  { key: 'help.infographic.transactionFlow.real', es: 'Trans. Real', en: 'Real Trans.', category: 'help' },
  { key: 'help.infographic.transactionFlow.full', es: 'Compensación Total', en: 'Full Compensation', category: 'help' },
  { key: 'help.infographic.transactionFlow.partial', es: 'Compensación Parcial', en: 'Partial Compensation', category: 'help' },
  { key: 'help.infographic.transactionFlow.remaining', es: 'Saldo Pendiente', en: 'Remaining Balance', category: 'help' },
  // Approval Flow
  { key: 'help.infographic.approvalFlow.request', es: 'Solicitud de Cambio', en: 'Change Request', category: 'help' },
  { key: 'help.infographic.approvalFlow.pending', es: 'Pendiente', en: 'Pending', category: 'help' },
  { key: 'help.infographic.approvalFlow.review', es: 'Revisión', en: 'Review', category: 'help' },
  { key: 'help.infographic.approvalFlow.approved', es: 'Aprobada', en: 'Approved', category: 'help' },
  { key: 'help.infographic.approvalFlow.rejected', es: 'Rechazada', en: 'Rejected', category: 'help' },
  { key: 'help.infographic.approvalFlow.applied', es: 'Cambios Aplicados', en: 'Changes Applied', category: 'help' },
  // Roles & Permissions
  { key: 'help.infographic.rolesPermissions.users', es: 'Usuarios', en: 'Users', category: 'help' },
  { key: 'help.infographic.rolesPermissions.roles', es: 'Roles', en: 'Roles', category: 'help' },
  { key: 'help.infographic.rolesPermissions.permissions', es: 'Permisos', en: 'Permissions', category: 'help' },
  { key: 'help.infographic.rolesPermissions.modules', es: 'Módulos', en: 'Modules', category: 'help' },
  { key: 'help.infographic.rolesPermissions.assign', es: 'Asignar', en: 'Assign', category: 'help' },
  { key: 'help.infographic.rolesPermissions.define', es: 'Definir', en: 'Define', category: 'help' },
  { key: 'help.infographic.rolesPermissions.access', es: 'Acceso', en: 'Access', category: 'help' },
  // Dashboard Infographic
  { key: 'help.infographic.dashboard.title', es: 'Vista del Dashboard', en: 'Dashboard View', category: 'help' },
  { key: 'help.infographic.dashboard.kpis', es: 'KPIs Principales', en: 'Main KPIs', category: 'help' },
  { key: 'help.infographic.dashboard.budget', es: 'Presupuesto', en: 'Budget', category: 'help' },
  { key: 'help.infographic.dashboard.committed', es: 'Comprometido', en: 'Committed', category: 'help' },
  { key: 'help.infographic.dashboard.real', es: 'Real', en: 'Real', category: 'help' },
  { key: 'help.infographic.dashboard.difference', es: 'Diferencia', en: 'Difference', category: 'help' },
  { key: 'help.infographic.dashboard.charts', es: 'Gráficos', en: 'Charts', category: 'help' },
  { key: 'help.infographic.dashboard.byCategory', es: 'Por Categoría', en: 'By Category', category: 'help' },
  { key: 'help.infographic.dashboard.trends', es: 'Tendencias', en: 'Trends', category: 'help' },
  // Budget Line Infographic
  { key: 'help.infographic.budgetLine.title', es: 'Estructura de Línea Presupuestaria', en: 'Budget Line Structure', category: 'help' },
  { key: 'help.infographic.budgetLine.expense', es: 'Gasto', en: 'Expense', category: 'help' },
  { key: 'help.infographic.budgetLine.company', es: 'Compañía', en: 'Company', category: 'help' },
  { key: 'help.infographic.budgetLine.currency', es: 'Moneda', en: 'Currency', category: 'help' },
  { key: 'help.infographic.budgetLine.months', es: 'Valores Mensuales', en: 'Monthly Values', category: 'help' },
  { key: 'help.infographic.budgetLine.total', es: 'Total Anual', en: 'Annual Total', category: 'help' },
  // Savings Effect Infographic
  { key: 'help.infographic.savingsEffect.title', es: 'Efecto del Ahorro', en: 'Savings Effect', category: 'help' },
  { key: 'help.infographic.savingsEffect.before', es: 'Antes del Ahorro', en: 'Before Saving', category: 'help' },
  { key: 'help.infographic.savingsEffect.after', es: 'Después del Ahorro', en: 'After Saving', category: 'help' },
  { key: 'help.infographic.savingsEffect.reduction', es: 'Reducción', en: 'Reduction', category: 'help' },
  { key: 'help.infographic.savingsEffect.base', es: 'Valor Base', en: 'Base Value', category: 'help' },
  { key: 'help.infographic.savingsEffect.computed', es: 'Valor Computado', en: 'Computed Value', category: 'help' },
];

export async function seedTranslations(prisma: PrismaClient) {
  console.log('🌐 Seeding translations...');
  
  // Clear existing translations
  await prisma.translation.deleteMany();
  await prisma.systemConfig.deleteMany();

  // Seed translations
  for (const t of translations) {
    await prisma.translation.create({ data: t });
  }

  // Seed system config with default locale
  await prisma.systemConfig.create({
    data: { key: 'locale', value: 'es' }
  });
  await prisma.systemConfig.create({
    data: { key: 'theme', value: 'default' }
  });

  console.log(`✅ Seeded ${translations.length} translations and system config`);
}
